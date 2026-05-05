"""
AI Journalist Copilot -- LangGraph Compilation (Step 5)
========================================================

This module wires all nodes into a compiled LangGraph ``StateGraph``.

Graph Topology
--------------
::

    [START]
       |
       v
    ingest_stt_stream
       |
       v
    router_node ----+---> evaluate_interview_dynamics
       ^            |          |
       |            |          v
       |            |     router_node ---> retrieve_knowledge_hub
       |            |          |                  |
       |            |          v                  v
       |            |     generate_copilot_prompt
       |            |          |
       |            +----------+---> END (wait_for_audio / error)
       |
       +--- (next WebSocket invocation re-enters at START)

Usage
-----
::

    from graph.graph import copilot_graph

    result = copilot_graph.invoke(
        {"session_id": "...", "expert_name": "...", "expert_domain": "...",
         "current_transcript_chunk": "..."},
        config={"configurable": {"llm": my_llm, "retriever": my_retriever}},
    )
"""

from __future__ import annotations

from langgraph.graph import END, StateGraph

from graph.nodes import (
    evaluate_interview_dynamics,
    generate_copilot_prompt,
    ingest_stt_stream,
    retrieve_knowledge_hub,
    router_node,
)
from graph.translation import translate_tinglish_to_english
from graph.ingestion import ingest_to_knowledge_hub
from graph.state import InterviewGraphState


# =====================================================================
# 1. Initialise the graph with our canonical state
# =====================================================================

workflow = StateGraph(InterviewGraphState)

# =====================================================================
# 2. Register all processing nodes
# =====================================================================

workflow.add_node("ingest_stt_stream", ingest_stt_stream)
workflow.add_node("translate_tinglish_to_english", translate_tinglish_to_english)
workflow.add_node("evaluate_interview_dynamics", evaluate_interview_dynamics)
workflow.add_node("ingest_to_knowledge_hub", ingest_to_knowledge_hub)
workflow.add_node("retrieve_knowledge_hub", retrieve_knowledge_hub)
workflow.add_node("generate_copilot_prompt", generate_copilot_prompt)

# =====================================================================
# 3. Set the entry point
# =====================================================================

workflow.set_entry_point("ingest_stt_stream")

# =====================================================================
# 4. Define edges
# =====================================================================

# After ingestion, we ALWAYS translate.
workflow.add_edge("ingest_stt_stream", "translate_tinglish_to_english")

# After translation, the router decides what happens next.
workflow.add_conditional_edges(
    source="translate_tinglish_to_english",
    path=router_node,
    path_map={
        "wait_for_audio": END,
        "analyze_cognition": "evaluate_interview_dynamics",
        "retrieve_memory": "retrieve_knowledge_hub",
        "generate_prompt": "generate_copilot_prompt",
        "error": END,
    },
)

# After dynamics evaluation, we ingest to knowledge hub.
workflow.add_edge("evaluate_interview_dynamics", "ingest_to_knowledge_hub")

# After ingestion, the router decides where to go (retrieve or prompt).
workflow.add_conditional_edges(
    source="ingest_to_knowledge_hub",
    path=router_node,
    path_map={
        "wait_for_audio": END,
        "analyze_cognition": "evaluate_interview_dynamics",
        "retrieve_memory": "retrieve_knowledge_hub",
        "generate_prompt": "generate_copilot_prompt",
        "error": END,
    },
)



# After retrieval, always route (typically to generate_prompt).
workflow.add_conditional_edges(
    source="retrieve_knowledge_hub",
    path=router_node,
    path_map={
        "wait_for_audio": END,
        "analyze_cognition": "evaluate_interview_dynamics",
        "retrieve_memory": "retrieve_knowledge_hub",
        "generate_prompt": "generate_copilot_prompt",
        "error": END,
    },
)

# After prompt generation, always route (typically to wait_for_audio / END).
workflow.add_conditional_edges(
    source="generate_copilot_prompt",
    path=router_node,
    path_map={
        "wait_for_audio": END,
        "analyze_cognition": "evaluate_interview_dynamics",
        "retrieve_memory": "retrieve_knowledge_hub",
        "generate_prompt": "generate_copilot_prompt",
        "error": END,
    },
)

# =====================================================================
# 5. Compile the graph
# =====================================================================

copilot_graph = workflow.compile()
