"""
AI Journalist Copilot -- LangGraph Nodes (All implemented)
===========================================================
"""

from __future__ import annotations

import logging
from typing import Any

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from graph.schemas import InterviewDynamicsExtraction, SuggestedPromptSchema
from graph.state import InterviewGraphState, GraphAction

logger = logging.getLogger(__name__)

# =====================================================================
# SYSTEM PROMPTS
# =====================================================================

_DYNAMICS_SYSTEM_PROMPT = """\
You are the perception engine of an AI Journalist Copilot.

Your job is to analyse a rolling transcript window from a live interview
and produce a structured assessment of:
1. The expert's cognitive state (what their mind is doing right now).
2. Their energy level and trend (engagement trajectory).
3. How deep the conversation has gone on the current topic.
4. The current macro phase of the interview.
5. Any mental models, frameworks, or SOPs the expert is articulating.
6. Any standout, quotable insights worth preserving.

CRITICAL RULES:
- Base ALL assessments on the transcript text provided.
- For detected_frameworks, only extract frameworks visible in THIS window.
- For key_insights, quote the expert's exact words.
- Be conservative with extreme scores (0.0-0.1 or 0.9-1.0).
- The source_quote in any extracted framework must be verbatim from the transcript.
- ANTI-HALLUCINATION: Never write generic summaries. Never guess what the expert means. If a framework is incomplete because the expert paused mid-sentence, ignore it until the next chunk.
"""

_PROMPT_SYSTEM_TEMPLATE = """\
You are the prompt engine of an AI Journalist Copilot. Your job is to
generate the EXACT next question a human interviewer should ask.

CRITICAL CONSTRAINT:
- You have {remaining_iterations} questions left in this session.
- Your priority is to extract structured implicit knowledge (SOPs, Frameworks) 
  before the question limit is reached.

CURRENT INTERVIEW STATE:
- Expert cognitive state: {cognitive_state}
- Energy level: {energy_level}/1.0 (trend: {energy_trend})
- Topic depth: {depth}/1.0
- Interview phase: {phase}

ACTIVE STRATEGY: {strategy}

STRATEGY RULES:
{strategy_rules}

RETRIEVED KNOWLEDGE CONTEXT (if any):
{retrieved_context}

Generate a single, natural question the interviewer can speak aloud.
"""

_STRATEGY_RULES = {
    "lex_fridman": (
        "You are channeling Lex Fridman's interviewing style.\n"
        "- PATIENCE is your weapon. Silence is more powerful than any question.\n"
        "- Generate ultra-short prompts: 3-7 words maximum.\n"
        "- Examples: 'Tell me more.', 'Why is that?', 'What happened next?'\n"
        "- NEVER ask compound questions. NEVER interrupt a flow state.\n"
        "- If energy is high, your prompt should be a gentle nudge, not a pivot."
    ),
    "dwarkesh_patel": (
        "You are channeling Dwarkesh Patel's interviewing style.\n"
        "- You excel at DYNAMIC CONTEXT RETRIEVAL -- pulling in adjacent knowledge.\n"
        "- Reference a specific concept from the retrieved context below.\n"
        "- Synthesise a cross-domain question that connects what the expert said\n"
        "  to something from an adjacent field.\n"
        "- Example pattern: 'You mentioned X. In [adjacent field], Y is considered\n"
        "  the standard. How does your approach differ?'"
    ),
    "oshaughnessy": (
        "You are channeling Patrick O'Shaughnessy's interviewing style.\n"
        "- Your goal is FRAMEWORK & SOP EXTRACTION.\n"
        "- Ask the expert to walk through their exact process step-by-step.\n"
        "- Example patterns: 'Can you walk me through exactly how you do that?',\n"
        "  'What are the 3 steps you follow when...?', 'If I were starting from\n"
        "  zero, what would your playbook look like?'"
    ),
    "shane_parrish": (
        "You are channeling Shane Parrish's interviewing style.\n"
        "- Your goal is ROOT-CAUSE COGNITIVE ANALYSIS.\n"
        "- Probe the mental model behind the expert's decisions.\n"
        "- Example patterns: 'What mental model drives that decision?',\n"
        "  'Where did you learn to think about it that way?',\n"
        "  'What would have to be true for you to change your mind on that?'"
    ),
}


# =====================================================================
# Node 1 -- STT INGESTION (Mock implementation for testing)
# =====================================================================

def ingest_stt_stream(state: InterviewGraphState) -> dict:
    """Ingest one transcript chunk (mock -- no real WebSocket).

    For testing: reads current_transcript_chunk from state, builds a
    TranscriptSegment, updates rolling window and word counts, and
    routes to analyze_cognition.
    """
    import time

    chunk: str = state.get("current_transcript_chunk", "")
    if not chunk.strip():
        logger.info("ingest_stt_stream: empty chunk -- waiting.")
        return {"next_graph_action": "wait_for_audio"}

    # Build a TranscriptSegment (mock: always "expert", always final)
    segment = {
        "speaker": "expert",
        "text": chunk,
        "timestamp_ms": int(time.time() * 1000),
        "is_final": True,
    }

    # Update rolling window (append to existing)
    existing_window: str = state.get("rolling_window", "")
    new_window = (existing_window + " " + chunk).strip() if existing_window else chunk

    # Update word count
    prev_expert_words: int = state.get("expert_word_count", 0)
    new_words = len(chunk.split())

    logger.info("Ingested chunk (%d words). Rolling window: %d chars.",
                new_words, len(new_window))

    return {
        "current_transcript_chunk": chunk,
        "transcript_history": [segment],       # APPEND via reducer
        "next_graph_action": "translate",
    }


# =====================================================================
# Node 2 -- INTERVIEW DYNAMICS EVALUATION
# =====================================================================

def evaluate_interview_dynamics(
    state: InterviewGraphState,
    config: RunnableConfig,
) -> dict:
    """Analyse the rolling transcript window to classify expert cognitive
    state, energy trajectory, and interviewer behaviour."""

    # 1. Early exit
    rolling_window: str = state.get("rolling_window", "")
    if not rolling_window.strip():
        logger.info("evaluate_interview_dynamics: empty rolling_window -- skipping.")
        return {"next_graph_action": "wait_for_audio"}

    # 2. Interviewer speaking ratio
    i_words: int = state.get("interviewer_word_count", 0)
    e_words: int = state.get("expert_word_count", 0)
    total = i_words + e_words
    speaking_ratio = round(i_words / total, 4) if total > 0 else 0.0

    # 3. Extract LLM, bind schema
    configurable: dict[str, Any] = config.get("configurable", {})
    llm = configurable.get("llm")
    if llm is None:
        logger.error("No LLM in config['configurable']['llm']")
        return {
            "next_graph_action": "error",
            "system_health": {
                "stt_connection_active": state.get("system_health", {}).get(
                    "stt_connection_active", True),
                "llm_latency_ms": 0.0,
                "system_latency_warning": True,
                "last_stt_heartbeat_ms": state.get("system_health", {}).get(
                    "last_stt_heartbeat_ms", 0),
                "error_message": "LLM not provided in RunnableConfig.",
            },
        }

    structured_llm = llm.with_structured_output(InterviewDynamicsExtraction)

    # 4. Format existing state for semantic deduplication
    existing_frameworks = state.get("detected_frameworks", [])
    existing_insights = state.get("key_insights", [])

    formatted_frameworks = "\n".join([f"- {fw['name']}: {fw.get('core_principle', '')}" for fw in existing_frameworks]) or "None"
    formatted_insights = "\n".join([f"- {ins}" for ins in existing_insights]) or "None"

    # 5. Build messages
    topics_so_far: list[str] = state.get("topics_covered", [])
    topics_ctx = (
        f"\n\nTopics already covered: {', '.join(topics_so_far)}"
        if topics_so_far else ""
    )
    messages = [
        SystemMessage(content=_DYNAMICS_SYSTEM_PROMPT),
        HumanMessage(content=(
            f"Analyse this rolling transcript window:\n\n"
            f"--- TRANSCRIPT WINDOW ---\n{rolling_window}\n--- END ---"
            f"{topics_ctx}\n\n"
            f"--- PREVIOUSLY EXTRACTED FRAMEWORKS (DO NOT DUPLICATE) ---\n{formatted_frameworks}\n"
            f"--- PREVIOUSLY EXTRACTED INSIGHTS (DO NOT DUPLICATE) ---\n{formatted_insights}\n"
        )),
    ]

    # 6. Invoke LLM
    try:
        extraction: InterviewDynamicsExtraction = structured_llm.invoke(messages)
    except Exception as exc:
        logger.exception("LLM call failed: %s", exc)
        return {
            "next_graph_action": "error",
            "system_health": {
                "stt_connection_active": state.get("system_health", {}).get(
                    "stt_connection_active", True),
                "llm_latency_ms": 0.0,
                "system_latency_warning": True,
                "last_stt_heartbeat_ms": state.get("system_health", {}).get(
                    "last_stt_heartbeat_ms", 0),
                "error_message": f"LLM structured output failed: {exc}",
            },
        }

    # 7. Map Pydantic -> state dict (with safety deduplication)
    # The LLM is instructed not to duplicate, but we keep a name-based check for robustness.
    existing_fw_names: set[str] = {
        fw.get("name", "").lower()
        for fw in existing_frameworks
    }
    framework_dicts = [
        {
            "name": fw.name, 
            "core_principle": fw.core_principle,
            "actionable_steps": fw.actionable_steps,
            "source_quote": fw.source_quote, 
            "timestamp_ms": 0
        }
        for fw in extraction.detected_frameworks
        if fw.name.lower() not in existing_fw_names
    ]

    existing_ins_set: set[str] = {
        ins.strip().lower()
        for ins in existing_insights
    }
    new_insights = [
        ins for ins in extraction.key_insights
        if ins.strip().lower() not in existing_ins_set
    ]

    partial: dict[str, Any] = {
        "expert_cognitive_state": extraction.expert_cognitive_state,
        "expert_energy_level": extraction.expert_energy_level,
        "energy_trend": extraction.energy_trend,
        "topic_depth_score": extraction.topic_depth_score,
        "current_interview_phase": extraction.current_interview_phase,
        "detected_frameworks": framework_dicts,
        "key_insights": new_insights,
        "interviewer_speaking_ratio": speaking_ratio,
    }

    # 7. Routing
    cog = extraction.expert_cognitive_state
    depth = extraction.topic_depth_score

    if cog == "flow" and extraction.energy_trend != "declining":
        partial["next_graph_action"] = "wait_for_audio"
    elif depth > 0.6:
        partial["next_graph_action"] = "retrieve_memory"
    else:
        partial["next_graph_action"] = "generate_prompt"

    logger.info("Dynamics: state=%s depth=%.2f energy=%.2f -> %s",
                cog, depth, extraction.expert_energy_level,
                partial["next_graph_action"])
    return partial


# =====================================================================
# Node 3 -- KNOWLEDGE HUB RETRIEVAL
# =====================================================================

def retrieve_knowledge_hub(
    state: InterviewGraphState,
    config: RunnableConfig,
) -> dict:
    """Query the vector DB for contextually relevant knowledge chunks.

    Fires when topic_depth_score > 0.6 -- the expert is going deep
    and we need grounding data to craft a sharper follow-up.
    """

    # 1. Extract retriever from config
    configurable: dict[str, Any] = config.get("configurable", {})
    retriever = configurable.get("retriever")

    if retriever is None:
        logger.error(
            "No retriever in config['configurable']['retriever'] -- "
            "skipping retrieval, routing directly to generate_prompt."
        )
        return {"next_graph_action": "generate_prompt"}

    # 2. Build search query from state signals
    rolling_window: str = state.get("rolling_window", "")
    cognitive_state: str = state.get("expert_cognitive_state", "unknown")
    phase: str = state.get("current_interview_phase", "exploration")

    # Use the tail of the rolling window (most recent speech) + state context
    window_tail = rolling_window[-300:] if len(rolling_window) > 300 else rolling_window
    search_query = (
        f"Expert is in '{cognitive_state}' state during '{phase}' phase. "
        f"Recent transcript: {window_tail}"
    )

    # 3. Invoke retriever
    try:
        documents = retriever.invoke(search_query)
    except Exception as exc:
        logger.exception("Vector DB retrieval failed: %s", exc)
        return {"next_graph_action": "generate_prompt"}

    # 4. Extract text from returned documents
    chunks: list[str] = []
    for doc in documents:
        text = getattr(doc, "page_content", None) or str(doc)
        if text.strip():
            chunks.append(text.strip())

    logger.info("Retrieved %d chunks from knowledge hub.", len(chunks))

    # 5. Return: overwrite active, append to history
    return {
        "active_retrieved_context": chunks,           # OVERWRITE (token-safe)
        "retrieved_context_history": chunks,           # APPEND (audit log)
        "next_graph_action": "generate_prompt",
    }


# =====================================================================
# Node 4 -- COPILOT PROMPT GENERATION
# =====================================================================

def generate_copilot_prompt(
    state: InterviewGraphState,
    config: RunnableConfig,
) -> dict:
    """Generate the next suggested question for the human interviewer.

    Selects a strategy archetype (Lex Fridman / Dwarkesh / O'Shaughnessy /
    Shane Parrish) based on expert cognitive state, then calls the LLM
    with strategy-specific system instructions.
    """

    # ------------------------------------------------------------------
    # OVERRIDE GUARD: interviewer talking too much
    # ------------------------------------------------------------------
    speaking_ratio: float = state.get("interviewer_speaking_ratio", 0.0)

    if speaking_ratio > 0.20:
        logger.warning(
            "Interviewer speaking ratio %.2f > 0.20 -- override engaged.",
            speaking_ratio,
        )
        override_prompt = {
            "text": "Stop talking. Let the expert finish their thought. Stay quiet for the next 60 seconds.",
            "strategy": "lex_fridman",
            "reasoning": f"Interviewer speaking ratio is {speaking_ratio:.0%} -- too high. Silence is needed.",
            "confidence": 1.0,
            "alternative": None,
        }
        return {
            "active_prompt_strategy": "lex_fridman",
            "next_suggested_prompt": override_prompt,
            "prompt_history": [override_prompt],
            "next_graph_action": "wait_for_audio",
        }

    # ------------------------------------------------------------------
    # Strategy selection based on expert cognitive state & Iteration limit
    # ------------------------------------------------------------------
    cognitive_state: str = state.get("expert_cognitive_state", "surface_level")
    depth: float = state.get("topic_depth_score", 0.0)
    active_context: list[str] = state.get("active_retrieved_context", [])
    q_count: int = state.get("question_count", 0)
    remaining = max(0, 10 - q_count)

    if q_count >= 7:
        # Near limit: Force O'Shaughnessy for structured extraction
        strategy = "oshaughnessy"
        reason = f"Question count ({q_count}) is high. Forcing O'Shaughnessy for final extraction."
    elif cognitive_state == "flow":
        strategy = "lex_fridman"
        reason = "Expert is in Flow State. Using Lex Fridman to maintain momentum."
    elif cognitive_state == "stuck":
        strategy = "shane_parrish"
        reason = "Expert is Stuck. Using Shane Parrish for root-cause analysis."
    elif cognitive_state == "explaining":
        strategy = "oshaughnessy"
        reason = "Expert is Explaining. Using O'Shaughnessy for SOP extraction."
    elif depth > 0.6 and active_context:
        strategy = "dwarkesh_patel"
        reason = f"High Topic Depth ({depth:.2f}) and context found. Using Dwarkesh Patel for synthesis."
    else:
        # Default: O'Shaughnessy for structured extraction
        strategy = "oshaughnessy"
        reason = f"Defaulting to O'Shaughnessy (State: {cognitive_state}, Depth: {depth:.2f})."

    logger.info("ROUTING DECISION: %s | Reason: %s", strategy.upper(), reason)

    # ------------------------------------------------------------------
    # Extract LLM, bind schema
    # ------------------------------------------------------------------
    configurable: dict[str, Any] = config.get("configurable", {})
    llm = configurable.get("llm")

    if llm is None:
        logger.error("No LLM in config -- returning fallback prompt.")
        fallback = {
            "text": "Can you tell me more about that?",
            "strategy": strategy,
            "reasoning": "LLM unavailable -- generic fallback.",
            "confidence": 0.3,
            "alternative": None,
        }
        return {
            "active_prompt_strategy": strategy,
            "next_suggested_prompt": fallback,
            "prompt_history": [fallback],
            "next_graph_action": "wait_for_audio",
        }

    structured_llm = llm.with_structured_output(SuggestedPromptSchema)

    # ------------------------------------------------------------------
    # Build the LLM prompt
    # ------------------------------------------------------------------
    rolling_window: str = state.get("rolling_window", "")
    context_str = "\n---\n".join(active_context) if active_context else "(none)"

    system_msg = _PROMPT_SYSTEM_TEMPLATE.format(
        remaining_iterations=remaining,
        cognitive_state=cognitive_state,
        energy_level=state.get("expert_energy_level", 0.5),
        energy_trend=state.get("energy_trend", "stable"),
        depth=depth,
        phase=state.get("current_interview_phase", "exploration"),
        strategy=strategy,
        strategy_rules=_STRATEGY_RULES[strategy],
        retrieved_context=context_str,
    )

    messages = [
        SystemMessage(content=system_msg),
        HumanMessage(content=(
            f"Here is the recent transcript. Generate the next prompt.\n\n"
            f"--- TRANSCRIPT ---\n{rolling_window}\n--- END ---"
        )),
    ]

    # ------------------------------------------------------------------
    # Invoke LLM
    # ------------------------------------------------------------------
    try:
        result: SuggestedPromptSchema = structured_llm.invoke(messages)
    except Exception as exc:
        logger.exception("Prompt generation LLM call failed: %s", exc)
        fallback = {
            "text": "Can you elaborate on that?",
            "strategy": strategy,
            "reasoning": f"LLM error: {exc}",
            "confidence": 0.2,
            "alternative": None,
        }
        return {
            "active_prompt_strategy": strategy,
            "next_suggested_prompt": fallback,
            "prompt_history": [fallback],
            "next_graph_action": "wait_for_audio",
        }

    # ------------------------------------------------------------------
    # Map Pydantic -> state, apply confidence gate
    # ------------------------------------------------------------------
    prompt_dict: dict[str, Any] = {
        "text": result.text,
        "strategy": result.strategy,
        "reasoning": result.reasoning,
        "confidence": result.confidence,
        "alternative": None,
    }

    # Confidence gate: suppress low-confidence prompts
    if result.confidence < 0.4:
        logger.info("Prompt confidence %.2f < 0.4 -- suppressing.", result.confidence)
        prompt_dict["text"] = ""
        prompt_dict["reasoning"] = "Confidence too low -- staying silent."

    current_q_count: int = state.get("question_count", 0)

    return {
        "active_prompt_strategy": result.strategy,
        "next_suggested_prompt": prompt_dict,
        "prompt_history": [prompt_dict],
        "question_count": current_q_count + 1,
        "next_graph_action": "wait_for_audio",
    }


# =====================================================================
# Node 5 -- CONDITIONAL ROUTER
# =====================================================================

def router_node(state: InterviewGraphState) -> GraphAction:
    """Read next_graph_action and return the routing key.

    Fallback: returns 'wait_for_audio' if the field is missing.
    """
    action = state.get("next_graph_action", "wait_for_audio")
    valid = {"wait_for_audio", "translate", "analyze_cognition", "retrieve_memory",
             "generate_prompt", "error"}
    if action not in valid:
        logger.warning("Unrecognised graph action '%s' -- defaulting to wait.", action)
        return "wait_for_audio"
    return action
