"""
Agentic Recruiter Backend Server
================================

Provides REST endpoints for Persona Manifest generation
and a WebSocket endpoint for the AI Journalist Copilot.
"""

from __future__ import annotations

import logging
from typing import Any

from dotenv import load_dotenv
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from langchain_openai import ChatOpenAI

from backend.graph.graph import copilot_graph
from backend.persona.scenario_generator import generate_scenarios
from backend.persona.manifest_generator import generate_manifest

# ── Environment & Logging ───────────────────────────────────────────
load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s",
)
logger = logging.getLogger(__name__)

# ── FastAPI App ─────────────────────────────────────────────────────
app = FastAPI(
    title="Agentic Recruiter Backend",
    version="1.0.0",
    description="Backend for Persona Training and AI Journalist Copilot.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],            # Tighten in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── LLM Config (shared across all sessions) ────────────────────────
llm = ChatOpenAI(model="gpt-4o", temperature=0)

graph_config: dict[str, Any] = {
    "configurable": {
        "llm": llm,
        "retriever": None,          # Plug in vector DB retriever here
    }
}

# ── In-Memory Session Store ────────────────────────────────────────
active_sessions: dict[str, dict[str, Any]] = {}


def _create_empty_state(session_id: str) -> dict[str, Any]:
    """Build a fresh InterviewGraphState for a new session."""
    return {
        "session_id": session_id,
        "expert_name": "",
        "expert_domain": "",
        "transcript_history": [],
        "detected_frameworks": [],
        "key_insights": [],
        "topics_covered": [],
        "knowledge_gaps": [],
        "prompt_history": [],
        "retrieved_context_history": [],
    }


def _build_ui_payload(state: dict[str, Any]) -> dict[str, Any]:
    """Extract the fields the React frontend needs to render."""
    prompt = state.get("next_suggested_prompt", {})
    return {
        "type": "copilot_update",
        "data": {
            "next_suggested_prompt": prompt,
            "expert_cognitive_state": state.get("expert_cognitive_state", "unknown"),
            "expert_energy_level": state.get("expert_energy_level", 0.0),
            "energy_trend": state.get("energy_trend", "stable"),
            "topic_depth_score": state.get("topic_depth_score", 0.0),
            "current_interview_phase": state.get("current_interview_phase", "rapport"),
            "interviewer_speaking_ratio": state.get("interviewer_speaking_ratio", 0.0),
            "active_prompt_strategy": state.get("active_prompt_strategy", ""),
            "detected_frameworks": state.get("detected_frameworks", []),
            "key_insights": state.get("key_insights", []),
            "question_count": state.get("question_count", 0),
        },
    }

# ── Models for REST Endpoints ──────────────────────────────────────

class ScenariosRequest(BaseModel):
    master_cases: list[dict]
    knowledge_hub_summaries: list[str] = []
    expert_name: str = "Expert"

class ManifestRequest(BaseModel):
    all_master_cases: list[dict]
    expert_name: str = "Expert"

# ── REST Endpoints ──────────────────────────────────────────────────

@app.post("/api/persona/scenarios")
async def get_scenarios(body: ScenariosRequest):
    """
    Generates scenarios for persona training based on KH + MC.
    """
    scenarios = await generate_scenarios(
        body.master_cases,
        body.knowledge_hub_summaries,
        body.expert_name
    )
    return {"scenarios": scenarios.get("scenarios", [])}

@app.post("/api/persona/manifest")
async def get_manifest(body: ManifestRequest):
    """
    Generates the persona manifest from ALL Master Cases.
    """
    manifest = await generate_manifest(
        body.all_master_cases,
        body.expert_name
    )
    return {"persona_manifest": manifest}


# ── Health Check ────────────────────────────────────────────────────

@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "active_sessions": len(active_sessions),
        "model": "gpt-4o",
    }


# ── WebSocket Endpoint ─────────────────────────────────────────────

@app.websocket("/ws/copilot/{session_id}")
async def copilot_websocket(websocket: WebSocket, session_id: str):
    """Main copilot WebSocket endpoint."""
    await websocket.accept()
    logger.info("Session %s: WebSocket connected.", session_id)

    # Initialise or resume session state
    if session_id not in active_sessions:
        active_sessions[session_id] = _create_empty_state(session_id)
        logger.info("Session %s: New session created.", session_id)
    else:
        logger.info("Session %s: Resuming existing session.", session_id)

    try:
        while True:
            # 1. Receive message from React
            raw = await websocket.receive_json()
            msg_type = raw.get("type", "")

            if msg_type == "transcript_chunk":
                chunk: str = raw.get("chunk", "").strip()
                if not chunk:
                    await websocket.send_json({
                        "type": "error",
                        "message": "Empty transcript chunk received.",
                    })
                    continue

                # 2. Load current state and inject the new chunk
                state = active_sessions[session_id]
                state["current_transcript_chunk"] = chunk

                # 3. Invoke the LangGraph pipeline
                logger.info(
                    "Session %s: Processing chunk (%d chars)...",
                    session_id, len(chunk),
                )
                result = copilot_graph.invoke(state, config=graph_config)

                # 4. Persist updated state
                active_sessions[session_id] = result

                # 5. Build and send UI payload
                payload = _build_ui_payload(result)
                await websocket.send_json(payload)

                logger.info(
                    "Session %s: Sent copilot update (state=%s, strategy=%s).",
                    session_id,
                    payload["data"]["expert_cognitive_state"],
                    payload["data"]["active_prompt_strategy"],
                )

            elif msg_type == "session_init":
                # Optional: allow frontend to set expert name/domain
                state = active_sessions[session_id]
                state["expert_name"] = raw.get("expert_name", state["expert_name"])
                
                domain = raw.get("expert_domain", state["expert_domain"])
                state["expert_domain"] = domain
                
                if domain:
                    # We wrap the domain context so the LLM treats it as foundational grounding
                    formatted_context = f"EXPERT FOUNDATIONAL KNOWLEDGE & HISTORY:\n{domain}"
                    state["active_retrieved_context"] = [formatted_context]
                    state["retrieved_context_history"] = [formatted_context]

                active_sessions[session_id] = state

                await websocket.send_json({
                    "type": "session_ready",
                    "session_id": session_id,
                    "expert_name": state["expert_name"],
                    "expert_domain": state["expert_domain"],
                })

            elif msg_type == "ping":
                await websocket.send_json({"type": "pong"})

            else:
                await websocket.send_json({
                    "type": "error",
                    "message": f"Unknown message type: '{msg_type}'",
                })

    except WebSocketDisconnect:
        logger.info("Session %s: Client disconnected.", session_id)
        # Clean up session memory
        active_sessions.pop(session_id, None)
        logger.info(
            "Session %s: Session cleaned up. Active sessions: %d",
            session_id, len(active_sessions),
        )

    except Exception as exc:
        logger.exception("Session %s: Unexpected error: %s", session_id, exc)
        active_sessions.pop(session_id, None)
        try:
            await websocket.close(code=1011, reason=str(exc)[:120])
        except RuntimeError:
            pass  # WebSocket already closed


# ── Entrypoint ──────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "backend.server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
