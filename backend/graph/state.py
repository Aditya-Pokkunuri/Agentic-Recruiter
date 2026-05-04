"""
AI Journalist Copilot -- LangGraph State Definition (Step 1 -- PRODUCTION)
==========================================================================

This module defines the single source of truth for every variable that flows
through the LangGraph execution graph.  Each node reads from and writes to
this TypedDict, ensuring a strict, inspectable contract at every hop.

Design Principles
-----------------
1. **Reducer-aware lists** -- Every accumulating ``list`` field is annotated
   with ``Annotated[list[T], operator.add]`` so that LangGraph *appends*
   partial returns instead of overwriting.
2. **NotRequired fields** -- Only session-identity fields (``session_id``,
   ``expert_name``, ``expert_domain``) are mandatory on every hop.  All
   other fields are ``NotRequired`` because no single node touches them all.
3. **Routing control** -- ``next_graph_action`` drives conditional edges,
   keeping routing logic declarative and out of node bodies.
4. **Token-safe retrieval** -- ``active_retrieved_context`` (overwrite)
   carries only the *current* retrieval window for LLM consumption.
   ``retrieved_context_history`` (append) archives all past retrievals
   without ever feeding them to the prompt.
5. **Graceful degradation** -- ``SystemHealth`` sub-dict lets any node
   check connection / latency status and short-circuit if needed.

State Groups
------------
+--------------------------------------------------------------------+
|  GRAPH ROUTING        - conditional edge control variable          |
|  AUDIO / TRANSCRIPT   - raw input from the Deepgram WebSocket      |
|  EXPERT COGNITION     - real-time analysis of the interviewee      |
|  INTERVIEWER TELEM.   - tracking the human's behaviour             |
|  INTERVIEW DYNAMICS   - macro-level interview phase & trajectory   |
|  PROMPT ENGINE        - the AI-generated question for the human    |
|  KNOWLEDGE / MEMORY   - vector-DB retrieval & gap tracking         |
|  SYSTEM HEALTH        - fallback / latency / connection flags      |
|  SESSION METADATA     - bookkeeping for the current session        |
+--------------------------------------------------------------------+
"""

from __future__ import annotations

import operator
from typing import Annotated, Literal, Optional, TypedDict

# NotRequired landed in typing in 3.11; we're on 3.10.
from typing_extensions import NotRequired


# =====================================================================
# Domain Literals -- constrained vocabularies for categorical fields
# =====================================================================

ExpertCognitiveState = Literal[
    "flow",             # Expert is in a deep, uninterrupted stream of insight
    "explaining",       # Expert is walking through a framework / mental model
    "rambling",         # Expert has drifted from the core thread
    "stuck",            # Expert is searching for words or circling a concept
    "storytelling",     # Expert is narrating an anecdote or case study
    "reflecting",       # Expert is pausing to think deeply before answering
    "surface_level",    # Expert is giving high-level / canned responses
]

InterviewPhase = Literal[
    "rapport",              # Warm-up -- building trust and comfort
    "exploration",          # Broad survey -- mapping the expert's knowledge terrain
    "deep_dive",            # Drilling into a specific insight or experience
    "framework_extraction", # Actively pulling out SOPs, heuristics, mental models
    "challenge",            # Constructively stress-testing the expert's reasoning
    "synthesis",            # Summarising and connecting threads
    "closing",              # Wind-down and final reflection
]

PromptStrategy = Literal[
    "lex_fridman",          # Open-ended patience -- long silence, let them go deep
    "dwarkesh_patel",       # Dynamic context retrieval -- pull in adjacent knowledge
    "oshaughnessy",         # Framework / SOP extraction -- structured probing
    "shane_parrish",        # Root-cause cognitive analysis -- "why do you think that?"
]

EnergyTrend = Literal[
    "rising",       # Expert is gaining momentum
    "stable",       # Steady engagement level
    "declining",    # Energy / engagement is dropping
]

GraphAction = Literal[
    "wait_for_audio",       # Idle -- waiting for the next STT chunk
    "analyze_cognition",    # Route to evaluate_interview_dynamics node
    "retrieve_memory",      # Route to retrieve_knowledge_hub node
    "generate_prompt",      # Route to generate_copilot_prompt node
    "error",                # Something broke -- enter fallback / recovery
]


# =====================================================================
# Sub-TypedDicts -- structured payloads nested inside the main state
# =====================================================================

class TranscriptSegment(TypedDict):
    """One atomic utterance from the STT pipeline."""
    speaker: Literal["interviewer", "expert"]   # Diarised speaker label
    text: str                                    # Transcribed text
    timestamp_ms: int                            # Epoch-ms when the chunk arrived
    is_final: bool                               # True if Deepgram marked it final


class ExtractedFramework(TypedDict):
    """A mental model, heuristic, or SOP detected in the expert's speech."""
    name: str                       # Short label, e.g. "First-Principles Decomposition"
    description: str                # One-paragraph distillation
    source_quote: str               # Verbatim excerpt that surfaced the framework
    timestamp_ms: int               # When it was detected


class SuggestedPrompt(TypedDict):
    """The prompt payload sent to the React frontend."""
    text: str                       # The exact sentence the interviewer should say
    strategy: PromptStrategy        # Which reference style generated it
    reasoning: str                  # One-line rationale (for the interviewer's context)
    confidence: float               # 0.0-1.0 -- how strongly the AI recommends this
    alternative: Optional[str]      # A softer / harder variant if the first doesn't land


class SystemHealth(TypedDict):
    """
    Fallback & latency telemetry.

    Any node can read these flags to decide whether to short-circuit.
    The ``ingest_stt_stream`` node is the primary writer; other nodes
    are consumers only.
    """
    stt_connection_active: bool
    """True while the Deepgram WebSocket is alive and streaming."""

    llm_latency_ms: float
    """
    Round-trip latency of the last LLM call (ms).
    If this exceeds a configurable threshold (e.g. 3 000 ms), downstream
    nodes should skip generation and let the audio flow uninterrupted.
    """

    system_latency_warning: bool
    """
    True when ``llm_latency_ms`` has breached the acceptable threshold.
    Acts as a fast boolean check so nodes don't need to compare floats.
    """

    last_stt_heartbeat_ms: int
    """
    Epoch-ms of the last heartbeat / keep-alive from the STT provider.
    Used to detect stale connections (no data for > N seconds).
    """

    error_message: Optional[str]
    """
    Human-readable error string when ``next_graph_action == 'error'``.
    None during normal operation.
    """


# =====================================================================
#  CORE STATE -- the TypedDict that flows through every node
# =====================================================================

class InterviewGraphState(TypedDict):
    """
    Canonical state object for the AI Journalist Copilot LangGraph.

    Every node in the graph receives this state and returns a *partial*
    dict with only the keys it modified.  LangGraph handles the merge.

    Field categories
    ~~~~~~~~~~~~~~~~
    * **Required** -- Session identity fields that must always be present.
    * **NotRequired** -- All analytical / transient fields.  Nodes only
      return the subset they computed; omitting a field leaves it unchanged.

    Reducer semantics
    ~~~~~~~~~~~~~~~~~
    * ``Annotated[list[T], operator.add]`` -- append-mode (accumulating).
    * Plain types -- overwrite-mode (latest value wins).
    """

    # == GRAPH ROUTING =================================================
    next_graph_action: NotRequired[GraphAction]
    """
    Control variable for conditional edges.
    Each node sets this to tell the router where to go next.
    The compiled graph reads this field to pick the outbound edge.
    """

    # == AUDIO / TRANSCRIPT ============================================
    current_transcript_chunk: NotRequired[str]
    """The latest raw text chunk from the Deepgram STT stream (can be Tinglish)."""

    translated_transcript_chunk: NotRequired[str]
    """The English translation of the current_transcript_chunk."""

    transcript_history: NotRequired[Annotated[list[TranscriptSegment], operator.add]]
    """
    Ordered list of every finalised transcript segment so far.
    Reducer: APPEND -- each node returns only *new* segments.
    """

    rolling_window: NotRequired[str]
    """
    Concatenated text of the last N segments (sliding window).
    This is the primary input to the LLM analysis nodes -- large enough
    for context, small enough to stay within token budgets.
    """

    # == EXPERT COGNITION ==============================================
    expert_cognitive_state: NotRequired[ExpertCognitiveState]
    """What the expert's mind is *doing* right now."""

    expert_energy_level: NotRequired[float]
    """
    0.0 (disengaged / fatigued) -> 1.0 (peak flow / excitement).
    Derived from lexical cues, speech rate, and sentence complexity.
    """

    energy_trend: NotRequired[EnergyTrend]
    """Direction the energy is moving over the last ~60 seconds."""

    topic_depth_score: NotRequired[float]
    """
    0.0 (surface platitudes) -> 1.0 (novel, first-person tacit knowledge).
    Measures how close we are to knowledge that *only this expert* can provide.
    """

    # == INTERVIEWER TELEMETRY =========================================
    interviewer_speaking_ratio: NotRequired[float]
    """
    Ratio of interviewer talk-time to total talk-time (0.0 - 1.0).
    Calculated from diarised transcript segments.

    Threshold logic (enforced in ``generate_copilot_prompt``):
        > 0.20  ->  Prompt the human to pull back and listen.
        > 0.35  ->  Critical warning -- interviewer is dominating.
        <= 0.20 ->  Healthy Lex Fridman-style ratio.
    """

    interviewer_word_count: NotRequired[int]
    """Total words spoken by the interviewer this session."""

    expert_word_count: NotRequired[int]
    """Total words spoken by the expert this session."""

    # == INTERVIEW DYNAMICS ============================================
    current_interview_phase: NotRequired[InterviewPhase]
    """Macro phase of the conversation arc."""

    detected_frameworks: NotRequired[Annotated[list[ExtractedFramework], operator.add]]
    """
    All mental models / SOPs extracted so far.
    Reducer: APPEND -- nodes return only newly detected frameworks.
    """

    key_insights: NotRequired[Annotated[list[str], operator.add]]
    """
    Short bullet-point insights worth preserving verbatim.
    Reducer: APPEND.
    """

    topics_covered: NotRequired[Annotated[list[str], operator.add]]
    """
    High-level topic labels that have already been explored.
    Reducer: APPEND.
    """

    knowledge_gaps: NotRequired[Annotated[list[str], operator.add]]
    """
    Topics the expert likely knows about but hasn't been asked yet.
    Reducer: APPEND.
    """

    # == PROMPT ENGINE =================================================
    active_prompt_strategy: NotRequired[PromptStrategy]
    """Which interviewer archetype is currently driving prompt generation."""

    next_suggested_prompt: NotRequired[SuggestedPrompt]
    """The payload that gets pushed to the React frontend in real time."""

    prompt_history: NotRequired[Annotated[list[SuggestedPrompt], operator.add]]
    """
    Archive of every prompt the system has generated this session.
    Reducer: APPEND.
    """

    # == KNOWLEDGE / MEMORY ============================================
    active_retrieved_context: NotRequired[list[str]]
    """
    Top-K chunks from the vector DB relevant to the *current* thread.
    OVERWRITE semantics -- only the latest retrieval window is kept here
    so the LLM prompt never exceeds its token budget.
    """

    retrieved_context_history: NotRequired[Annotated[list[str], operator.add]]
    """
    Archival log of every chunk ever retrieved during this session.
    Reducer: APPEND -- for post-session analysis and audit trails.
    Never fed directly into LLM prompts.
    """

    # == SYSTEM HEALTH =================================================
    system_health: NotRequired[SystemHealth]
    """
    Fallback & latency sub-dict.  Overwrite semantics (latest snapshot wins).
    Any node can read these flags to decide whether to short-circuit
    generation and let the raw audio flow uninterrupted.
    """

    # == SESSION METADATA (REQUIRED) ===================================
    session_id: str
    """UUID for the current interview session. Always present."""

    expert_name: str
    """Display name of the expert being interviewed. Always present."""

    expert_domain: str
    """Primary domain / field of the expert (e.g. 'AI Safety', 'Oncology'). Always present."""

    interview_duration_seconds: NotRequired[float]
    """Wall-clock seconds since the interview started."""

    question_count: NotRequired[int]
    """Running tally of questions the human interviewer has asked."""
