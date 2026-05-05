"""
AI Journalist Copilot -- Test Run (Mock STT Pipeline)
======================================================

End-to-end test of the LangGraph pipeline using hardcoded transcript
chunks.  Validates the full flow:

    ingest -> evaluate -> (retrieve) -> generate -> END

Usage
-----
::

    # Ensure .env contains OPENAI_API_KEY=sk-...
    python -m backend.test_run
"""

from __future__ import annotations

import logging
import os
import sys

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI

from backend.graph.graph import copilot_graph

# ── Setup ────────────────────────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── Verify API key ──────────────────────────────────────────────────
if not os.getenv("OPENAI_API_KEY"):
    logger.error("OPENAI_API_KEY not found in environment. Create a .env file.")
    sys.exit(1)

# ── Initialise LLM ──────────────────────────────────────────────────
llm = ChatOpenAI(model="gpt-4o", temperature=0)

# ── Config dict passed to every node via RunnableConfig ─────────────
config = {
    "configurable": {
        "llm": llm,
        "retriever": None,  # No vector DB for this test
    }
}

# ── Mock transcript chunks (simulating an expert explaining a topic) ─
MOCK_CHUNKS = [
    (
        "Let me tell you about how we built the recommendation engine at "
        "our company. Most people think it's just collaborative filtering, "
        "but the real breakthrough came when we realised that user intent "
        "changes within a single session. A person who starts browsing "
        "casually shifts into purchase mode, and if you don't detect that "
        "transition, your recommendations become noise."
    ),
    (
        "Recommendation engine design lo core mental model enti ante Intent Gradient. "
        "Passive discovery nundi active seeking varaku oka spectrum laga think cheyandi. "
        "Memu click event paina lightweight classifier run chestham -- score crossings 0.7 "
        "ithe entire stack exploration mode nundi exploitation mode ki switch chestham. "
        "First broadening, then narrowing."
    ),
    (
        "It usually breaks down when the user has mixed intent -- like "
        "they're comparison shopping but also open to discovery. That's "
        "the hardest edge case. We tried a bunch of things... I think "
        "the thing that finally worked was adding a third state to the "
        "classifier -- we called it 'deliberation mode.' It's kind of "
        "hard to explain exactly why it worked, but I think it's because "
        "deliberation captures the uncertainty that the binary model missed."
    ),
]

# ── Initial state ───────────────────────────────────────────────────
state = {
    "session_id": "test-001",
    "expert_name": "Mock Expert",
    "expert_domain": "Recommendation Systems",
    "transcript_history": [],
    "detected_frameworks": [],
    "key_insights": [],
    "topics_covered": [],
    "knowledge_gaps": [],
    "prompt_history": [],
    "retrieved_context_history": [],
}

# ── Run the graph for each chunk ────────────────────────────────────
print("=" * 72)
print("  AI JOURNALIST COPILOT -- TEST RUN")
print("=" * 72)

for i, chunk in enumerate(MOCK_CHUNKS, 1):
    print("-" * 72)
    print(f"  CHUNK {i}/{len(MOCK_CHUNKS)}")
    print("-" * 72)
    print(f"  Expert says: \"{chunk[:80]}...\"")
    print()

    # Feed the chunk into the state
    state["current_transcript_chunk"] = chunk

    # Invoke the graph
    result = copilot_graph.invoke(state, config=config)

    # Carry forward the accumulated state for next iteration
    state = result

    # ── Display results ──────────────────────────────────────────
    prompt = result.get("next_suggested_prompt", {})
    cog_state = result.get("expert_cognitive_state", "unknown")
    energy = result.get("expert_energy_level", 0.0)
    trend = result.get("energy_trend", "unknown")
    depth = result.get("topic_depth_score", 0.0)
    phase = result.get("current_interview_phase", "unknown")
    ratio = result.get("interviewer_speaking_ratio", 0.0)
    strategy = result.get("active_prompt_strategy", "none")

    print(f"  EXPERT STATE:    {cog_state}")
    print(f"  ENERGY:          {energy:.2f} ({trend})")
    print(f"  DEPTH:           {depth:.2f}")
    print(f"  PHASE:           {phase}")
    print(f"  INTERVIEWER %:   {ratio:.1%}")
    print(f"  STRATEGY:        {strategy}")
    print()

    if prompt:
        print(f"  >>> COPILOT PROMPT: \"{prompt.get('text', '')}\"")
        print(f"      Reasoning:     {prompt.get('reasoning', '')}")
        print(f"      Confidence:    {prompt.get('confidence', 0.0):.2f}")
    else:
        print("  >>> COPILOT: (silent -- no prompt generated)")

    # Show accumulated frameworks
    frameworks = result.get("detected_frameworks", [])
    if frameworks:
        print(f"\n  FRAMEWORKS EXTRACTED ({len(frameworks)}):")
        for fw in frameworks:
            print(f"    - {fw.get('name', '?')}: {fw.get('description', '')[:80]}...")

    # Show accumulated insights
    insights = result.get("key_insights", [])
    if insights:
        print(f"\n  KEY INSIGHTS ({len(insights)}):")
        for ins in insights:
            print(f"    - \"{ins[:80]}...\"" if len(ins) > 80 else f"    - \"{ins}\"")

print("-" * 72)
print("  TEST COMPLETE")
print(f"  Total transcript segments: {len(state.get('transcript_history', []))}")
print(f"  Total prompts generated:   {len(state.get('prompt_history', []))}")
print(f"  Total frameworks found:    {len(state.get('detected_frameworks', []))}")
print(f"  Total insights captured:   {len(state.get('key_insights', []))}")
print("-" * 72)
