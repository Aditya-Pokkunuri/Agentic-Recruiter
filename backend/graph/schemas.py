"""
AI Journalist Copilot -- Pydantic Schemas for Structured LLM Output
====================================================================

These Pydantic models are bound to the LLM via ``.with_structured_output()``
to guarantee the model's response maps 1:1 to our ``InterviewGraphState``.

Every ``Field(description=...)`` doubles as **in-line prompt engineering**:
the description is injected into the LLM's function-calling schema, so it
directly shapes the model's reasoning.  Write these descriptions as if you
are talking to the LLM, not to a Python developer.
"""

from __future__ import annotations

from typing import Literal, Optional, List

from pydantic import BaseModel, Field


# =====================================================================
# Domain Literals (mirrored from state.py for schema independence)
# =====================================================================

ExpertCognitiveStateLiteral = Literal[
    "flow",
    "explaining",
    "rambling",
    "stuck",
    "storytelling",
    "reflecting",
    "surface_level",
]

EnergyTrendLiteral = Literal[
    "rising",
    "stable",
    "declining",
]

InterviewPhaseLiteral = Literal[
    "rapport",
    "exploration",
    "deep_dive",
    "framework_extraction",
    "challenge",
    "synthesis",
    "closing",
]

PromptStrategyLiteral = Literal[
    "lex_fridman",
    "dwarkesh_patel",
    "oshaughnessy",
    "shane_parrish",
]


# =====================================================================
# Sub-Models
# =====================================================================

class ExtractedFrameworkSchema(BaseModel):
    """
    A mental model, heuristic, decision framework, or standard operating
    procedure that the expert has articulated during the interview.
    """

    name: str = Field(
        description=(
            "A concise, descriptive label for this mental model or framework. "
            "Use title case.  Examples: 'First-Principles Decomposition', "
            "'Bias-Variance Trade-off Heuristic', 'Customer Feedback Loop SOP'. "
            "If the expert did not name it explicitly, infer a reasonable label."
        )
    )

    core_principle: str = Field(
        description=(
            "A single, precise sentence defining the rule. NO FLUFF. "
            "NO 'This likely involves...'. State it as a fact. "
            "Example: 'The user intent is the primary signal for ranking "
            "rather than static content similarity.'"
        )
    )

    actionable_steps: List[str] = Field(
        default_factory=list,
        description=(
            "An array of the exact, chronological steps the expert takes to "
            "execute this framework. You MUST extract the concrete mechanics "
            "(e.g., '1. Map out the wiring harness', '2. Isolate dead space'). "
            "If the expert has not stated the concrete steps yet, leave this "
            "array empty. DO NOT hallucinate or guess steps."
        )
    )

    source_quote: str = Field(
        description=(
            "The verbatim excerpt from the transcript that best captures "
            "this framework.  Copy the expert's exact words.  Keep it under "
            "3 sentences."
        )
    )


# =====================================================================
# Primary Extraction Model -- bound to the LLM
# =====================================================================

class InterviewDynamicsExtraction(BaseModel):
    """
    Structured output schema for the ``evaluate_interview_dynamics`` node.
    """

    expert_cognitive_state: ExpertCognitiveStateLiteral = Field(
        description=(
            "Classify what the expert's mind is doing RIGHT NOW based on "
            "the most recent portion of the transcript.  Use these rules:\n"
            "- 'flow': The expert is speaking fluently with deep, original "
            "insight.  Sentences are long, specific, and contain first-person "
            "experiential detail.  Do NOT interrupt.\n"
            "- 'explaining': The expert is walking through a structured "
            "process, framework, or mental model step-by-step.  Look for "
            "sequential language ('First... then...').  "
            "IMPORTANT: if the expert is explaining a process but ALSO "
            "expressing uncertainty about WHY it works, classify as 'stuck' "
            "or 'reflecting', NOT 'explaining'.\n"
            "- 'rambling': The expert has drifted away from the core question.\n"
            "- 'stuck': The expert is struggling to articulate a concept. "
            "Look for hedging ('I think maybe...', 'It's hard to explain...'), "
            "long pauses, or circular phrasing.  CRITICAL: If the expert "
            "uses phrases like 'It's hard to explain', 'I'm not sure why', "
            "'I don't know exactly', 'kind of hard to explain', or shows "
            "uncertainty about WHY something worked, you MUST classify them "
            "as 'stuck'.  This takes PRIORITY over 'explaining'.\n"
            "- 'storytelling': The expert is narrating a specific anecdote, "
            "case study, or war story.\n"
            "- 'reflecting': The expert is thinking out loud, reconsidering "
            "a prior statement, or exploring a new angle.  If the expert is "
            "actively working through a problem live, or pausing to figure "
            "out a mechanism they don't fully understand yet, classify as "
            "'reflecting'.  Highly valuable -- do not interrupt.\n"
            "- 'surface_level': The expert is giving generic, well-rehearsed "
            "answers.  No first-person detail, no novel insight."
        )
    )

    expert_energy_level: float = Field(
        ge=0.0,
        le=1.0,
        description="Score the expert's engagement and energy on a 0.0 to 1.0 scale."
    )

    energy_trend: EnergyTrendLiteral = Field(
        description="Determine if energy is rising, stable, or declining."
    )

    topic_depth_score: float = Field(
        ge=0.0,
        le=1.0,
        description=(
            "Score how deep the conversation has gone. "
            "0.0-0.2: Surface-level. "
            "0.3-0.5: Moderate. "
            "0.6-0.8: Deep experiences/numbers. "
            "0.9-1.0: Tacit knowledge/intuition (the gold standard)."
        )
    )

    current_interview_phase: InterviewPhaseLiteral = Field(
        description="Determine the macro phase: rapport, exploration, deep_dive, framework_extraction, challenge, synthesis, closing."
    )

    detected_frameworks: List[ExtractedFrameworkSchema] = Field(
        default_factory=list,
        description=(
            "Extract any NEW mental models, SOPs, or frameworks articulated. "
            "CRITICAL: You will be provided with a list of 'PREVIOUSLY EXTRACTED ITEMS'. "
            "If the current transcript is merely elaborating on an existing framework, "
            "DO NOT extract it again. ONLY extract genuinely novel frameworks."
        )
    )

    key_insights: List[str] = Field(
        default_factory=list,
        description=(
            "Extract 0-3 novel, pithy statements. "
            "CRITICAL: You will be provided with a list of 'PREVIOUSLY EXTRACTED ITEMS'. "
            "If the current transcript is merely repeating or elaborating on an "
            "existing insight, DO NOT extract it again. ONLY extract genuinely "
            "novel insights."
        )
    )


# =====================================================================
# Prompt Generation Model
# =====================================================================

class SuggestedPromptSchema(BaseModel):
    """
    Structured output schema for the ``generate_copilot_prompt`` node.
    """

    text: str = Field(
        description=(
            "The EXACT sentence the human interviewer should say next. "
            "Keep it under 2 sentences. Brevity is power."
        )
    )

    strategy: PromptStrategyLiteral = Field(
        description="Which interviewer archetype was used."
    )

    reasoning: str = Field(
        description="A one-sentence explanation of WHY this prompt was chosen."
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
        description="Confidence score (0.0 to 1.0). Silent if < 0.4."
    )
