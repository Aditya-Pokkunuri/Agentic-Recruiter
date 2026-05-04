"""
Persona Manifest — Pydantic Schemas
=====================================

Models for scenario generation and persona manifest extraction.
Used with LLM structured output to guarantee consistent shapes.
"""

from __future__ import annotations

from typing import List

from pydantic import BaseModel, Field


# =====================================================================
# Scenario Generation Models
# =====================================================================

class GeneratedScenario(BaseModel):
    """A single scenario to be posed to the expert during persona training."""

    title: str = Field(
        description=(
            "Short, descriptive title for this scenario. "
            "Example: 'High-Stakes Client Escalation', 'Cross-Team Priority Conflict'."
        )
    )

    scenario: str = Field(
        description=(
            "The situational challenge in 2-3 sentences. "
            "Be specific and realistic for the expert's domain. "
            "Write it as a situation the expert is currently IN, not a hypothetical. "
            "Example: 'Your top-performing team member has just submitted their resignation "
            "during a critical sprint. The project deadline is in two weeks and they hold "
            "key domain knowledge that hasn't been documented.'"
        )
    )

    context: str = Field(
        description=(
            "One sentence explaining WHY this scenario is relevant and what "
            "communication/thinking patterns it is designed to reveal. "
            "Example: 'Reveals crisis decision-making and stakeholder communication under pressure.'"
        )
    )


class GeneratedScenarios(BaseModel):
    """Collection of scenarios generated from Knowledge Hub + Master Cases."""

    scenarios: List[GeneratedScenario] = Field(
        description=(
            "5-7 contextual scenarios for the expert to answer. "
            "Cover diverse challenge types: crisis, negotiation, strategy, "
            "edge cases, relationship management, resource constraints."
        )
    )


# =====================================================================
# Persona Manifest Model
# =====================================================================

class PersonaManifest(BaseModel):
    """
    The expert's communication DNA.

    CRITICAL: This model captures ONLY communication style and thinking
    patterns. It must NEVER contain domain knowledge, technical content,
    tool names, or methodology specifics.
    """

    communication_style: str = Field(
        description=(
            "The expert's overall communication style. "
            "Examples: 'direct and action-oriented', 'narrative and detail-rich', "
            "'analytical and structured', 'conversational and empathetic'. "
            "Base this on HOW they write, not WHAT they write about."
        )
    )

    thinking_pattern: str = Field(
        description=(
            "How the expert approaches problems and structures their thinking. "
            "Examples: 'action-first — states the solution before the problem', "
            "'root-cause — always diagnoses before prescribing', "
            "'systematic — breaks everything into ordered steps'."
        )
    )

    tone: str = Field(
        description=(
            "The natural tone that comes through in their writing. "
            "Examples: 'assertive and confident', 'measured and diplomatic', "
            "'warm but decisive', 'intense and results-focused'."
        )
    )

    vocabulary_level: str = Field(
        description=(
            "The complexity of language they naturally use. "
            "One of: 'simple', 'moderate', 'technical', 'highly-technical'."
        )
    )

    sentence_structure: str = Field(
        description=(
            "How they build sentences. "
            "Examples: 'short-punchy — rarely exceeds 10 words per clause', "
            "'long-detailed — packs multiple ideas per sentence', "
            "'mixed — varies by context'."
        )
    )

    decision_style: str = Field(
        description=(
            "How they make and communicate decisions. "
            "Examples: 'data-driven — cites metrics and evidence', "
            "'intuition-backed — trusts experience over data', "
            "'consensus-seeking — involves stakeholders before deciding'."
        )
    )

    energy_signature: str = Field(
        description=(
            "The energy they project through their communication. "
            "Examples: 'high-intensity and results-driven', "
            "'calm-analytical and methodical', 'measured but passionate'."
        )
    )

    problem_framing: str = Field(
        description=(
            "How they frame challenges and problems. "
            "Examples: 'root-cause focused — always asks why before what', "
            "'opportunity-first — reframes problems as growth chances', "
            "'impact-oriented — leads with stakeholder consequences'."
        )
    )

    persuasion_approach: str = Field(
        description=(
            "How they convince and influence others. "
            "Examples: 'logic-heavy — builds arguments from evidence', "
            "'storytelling — uses analogies and case studies', "
            "'authority-based — leverages experience and track record'."
        )
    )

    signature_patterns: List[str] = Field(
        description=(
            "3-5 recurring communication BEHAVIORS observed across multiple cases. "
            "Examples: 'Uses action verbs as sentence openers', "
            "'Quantifies outcomes in every response', "
            "'Frames problems before proposing solutions', "
            "'Defaults to structured lists over prose'. "
            "These must be style patterns, NOT domain knowledge."
        )
    )
