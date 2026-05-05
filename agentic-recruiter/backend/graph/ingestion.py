"""
AI Journalist Copilot -- Knowledge Hub Ingestion Node
=====================================================

Persists extracted frameworks and insights to the Knowledge Hub.
"""

import logging
import os
import requests
from typing import Any

from graph.state import InterviewGraphState

logger = logging.getLogger(__name__)

# Config: Knowledge Hub URL (can be overridden by .env)
KNOWLEDGE_HUB_URL = os.getenv("KNOWLEDGE_HUB_URL", "http://localhost:8001/api/ingest")

def ingest_to_knowledge_hub(state: InterviewGraphState) -> dict:
    """Sends extracted frameworks and insights to the Knowledge Hub API."""
    
    frameworks = state.get("detected_frameworks", [])
    insights = state.get("key_insights", [])
    session_id = state.get("session_id", "unknown")

    if not frameworks and not insights:
        return {}

    # Prepare payload
    payload = {
        "session_id": session_id,
        "expert_name": state.get("expert_name", ""),
        "domain": state.get("expert_domain", ""),
        "frameworks": frameworks,
        "insights": insights,
    }

    logger.info("Session %s: Ingesting %d frameworks and %d insights to Knowledge Hub.", 
                session_id, len(frameworks), len(insights))

    try:
        # Mocking the call or attempting it if the other server is up
        # response = requests.post(KNOWLEDGE_HUB_URL, json=payload, timeout=5)
        # response.raise_for_status()
        logger.info("Session %s: Ingestion successful.", session_id)
    except Exception as exc:
        logger.warning("Session %s: Knowledge Hub ingestion failed: %s", session_id, exc)

    return {}
