"""
Step 2: Generate contextual scenarios from KH + MC.
These will be posed to the expert as questions during persona training.
"""

from langchain_openai import ChatOpenAI
from langchain_core.messages import SystemMessage, HumanMessage
from backend.persona.schemas import GeneratedScenarios

SCENARIO_GEN_PROMPT = """\
You are a scenario architect for expert persona training.

You will receive:
1. KNOWLEDGE HUB: The expert's domain documents and knowledge summaries.
2. MASTER CASES: Real scenarios the expert has already recorded.

Your job is to generate 5-7 NEW, challenging scenarios that:
- Are highly realistic for this expert's specific domain
- Cover different types of challenges (e.g., crisis, strategy, negotiation, edge cases, relationship management)
- Would reveal HOW the expert thinks, makes decisions, and communicates
- Are NOT duplicates of existing Master Cases
- Each scenario should be a situation the expert would actually face and need to resolve

For each scenario, provide:
- title: Short descriptive title
- scenario: The situational challenge description (2-3 sentences)
- context: Why this scenario matters for understanding their approach
"""

async def generate_scenarios(master_cases: list[dict], knowledge_hub_summaries: list[str], expert_name: str) -> dict:
    """
    Generates contextual scenarios based on KH + MC.
    Returns a dict with a list of generated scenarios.
    """
    llm = ChatOpenAI(model="gpt-4o", temperature=0.7)
    structured_llm = llm.with_structured_output(GeneratedScenarios)
    
    kh_text = "\n".join(knowledge_hub_summaries) if knowledge_hub_summaries else "(no documents uploaded)"
    
    mc_text = ""
    for i, case in enumerate(master_cases, 1):
        mc_text += f"\n--- MASTER CASE {i} ---\n"
        mc_text += f"Title: {case.get('title', '')}\n"
        mc_text += f"Scenario: {case.get('scenario', '')}\n"
        mc_text += f"Action: {case.get('action', '')}\n"
        mc_text += f"Outcome: {case.get('outcome', '')}\n"
        
    messages = [
        SystemMessage(content=SCENARIO_GEN_PROMPT),
        HumanMessage(content=(
            f"Expert: {expert_name}\n\n"
            f"KNOWLEDGE HUB:\n{kh_text}\n\n"
            f"EXISTING MASTER CASES:\n{mc_text}"
        ))
    ]
    
    result = await structured_llm.ainvoke(messages)
    return result.model_dump()
