"""
AI Journalist Copilot -- Translation Node
=========================================

Handles the conversion of Tinglish (Telugu + English) transcript chunks
into clean, professional English before they are processed by the 
cognitive analysis nodes.
"""

import logging
from typing import Any

from langchain_core.messages import SystemMessage, HumanMessage
from langchain_core.runnables import RunnableConfig

from graph.state import InterviewGraphState

logger = logging.getLogger(__name__)

_TRANSLATION_SYSTEM_PROMPT = """\
You are an expert translator specializing in 'Tinglish' (Telugu mixed with English).

Your job is to take a raw transcript chunk and convert it into high-quality, professional English.

RULES:
1. Preserve the technical meaning and intent of the expert.
2. If the text is already in English, return it unchanged.
3. If it is a mixture, synthesize it into a clean English sentence.
4. Maintain the speaker's tone (e.g., authoritative, uncertain, storytelling).
5. Output ONLY the translated English text. No explanations.
"""

def translate_tinglish_to_english(
    state: InterviewGraphState,
    config: RunnableConfig,
) -> dict:
    """Translates the current transcript chunk into English."""
    
    chunk = state.get("current_transcript_chunk", "")
    if not chunk.strip():
        return {"translated_transcript_chunk": ""}

    # Extract LLM from config
    configurable: dict[str, Any] = config.get("configurable", {})
    llm = configurable.get("llm")
    
    if llm is None:
        logger.error("No LLM in config for translation -- passing through raw chunk.")
        return {"translated_transcript_chunk": chunk}

    messages = [
        SystemMessage(content=_TRANSLATION_SYSTEM_PROMPT),
        HumanMessage(content=f"Translate this Tinglish chunk to English:\n\n{chunk}"),
    ]

    try:
        response = llm.invoke(messages)
        translated_text = response.content.strip()
        logger.info("Translated chunk: '%s' -> '%s'", chunk[:30], translated_text[:30])
        
        # Update rolling window (append to existing)
        existing_window: str = state.get("rolling_window", "")
        new_window = (existing_window + " " + translated_text).strip() if existing_window else translated_text

        # Update word count
        prev_expert_words: int = state.get("expert_word_count", 0)
        new_words = len(translated_text.split())

        return {
            "translated_transcript_chunk": translated_text,
            "rolling_window": new_window,
            "expert_word_count": prev_expert_words + new_words,
            "next_graph_action": "analyze_cognition"
        }
    except Exception as exc:
        logger.exception("Translation LLM call failed: %s", exc)
        # Fallback to raw chunk if translation fails
        existing_window: str = state.get("rolling_window", "")
        new_window = (existing_window + " " + chunk).strip() if existing_window else chunk
        
        return {
            "translated_transcript_chunk": chunk,
            "rolling_window": new_window,
            "next_graph_action": "analyze_cognition"
        }
