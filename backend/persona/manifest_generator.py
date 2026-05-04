"""
Step 5: Analyze ALL Master Cases (original + expert's new answers)
to extract communication style → Persona Manifest.
"""

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from backend.persona.schemas import PersonaManifest

MANIFEST_PROMPT = """\
You are a cognitive linguist and communication analyst.

You will receive Master Cases written by an expert. Each case has:
Title, Scenario, Action, Outcome.

These cases include both their past historical cases AND their answers 
to newly generated hypothetical scenarios.

Analyze HOW the expert communicates across ALL cases:
1. Communication style (e.g., direct? narrative? analytical?)
2. Thinking pattern (e.g., action-first? root-cause? systematic?)
3. Tone (e.g., assertive? empathetic? confident? measured?)
4. Vocabulary level (simple, moderate, technical, highly-technical)
5. Sentence structure (short-punchy, long-detailed, mixed)
6. Decision style (data-driven, intuition-first, consensus, authority-based)
7. Energy signature (high-intensity, measured, calm-analytical, results-driven)
8. Problem framing (root-cause, opportunity-first, symptom-first, stakeholder-impact)
9. Persuasion approach (logic-heavy, storytelling, evidence-based, authority, emotional)
10. Signature patterns (3-5 recurring communication behaviors)

CRITICAL RULES:
- ONLY analyze HOW they communicate, NOT what they know.
- Do NOT include domain knowledge, tech names, or methodologies in the output.
- Weight patterns that appear ACROSS MULTIPLE cases more heavily.
- The output must be pure communication DNA.
"""

async def generate_manifest(all_master_cases: list[dict], expert_name: str) -> dict:
    """
    Analyzes all Master Cases to extract the Persona Manifest.
    Returns a dict with the persona manifest fields.
    """
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    structured_llm = llm.with_structured_output(PersonaManifest)
    
    mc_text = ""
    for i, case in enumerate(all_master_cases, 1):
        mc_text += f"\n--- CASE {i} ---\n"
        mc_text += f"Title: {case.get('title', '')}\n"
        mc_text += f"Scenario: {case.get('scenario', '')}\n"
        mc_text += f"Action: {case.get('action', '')}\n"
        mc_text += f"Outcome: {case.get('outcome', '')}\n"
        
    messages = [
        SystemMessage(content=MANIFEST_PROMPT),
        HumanMessage(content=(
            f"Expert Name: {expert_name}\n\n"
            f"ALL CASES (Analyze communication style):\n{mc_text}"
        ))
    ]
    
    result = await structured_llm.ainvoke(messages)
    return result.model_dump()
