from __future__ import annotations

import ollama as ollama_client
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.embeddings import generate_embeddings
from app.core.retrieval import retrieve_relevant_chunks
from app.models.chat import ChatMessage
from app.models.knowledge_base import KnowledgeBase
from app.schemas.chat import ChatRequest
from app.schemas.prompt_template import PromptTemplateResponse
from app.services.knowledge_service import ServiceError

DEFAULT_RAG_USER_PROMPT = """知識庫內容：
{context}

對話歷史：
{history}

問題：
{question}"""


def build_rag_prompt(
    system_prompt: str,
    context_chunks: list[dict],
    question: str,
    chat_history: list[ChatMessage],
) -> tuple[str, str]:
    """Build prompt payload for RAG generation."""
    history_lines = [f"{msg.role}: {msg.content}" for msg in chat_history]
    history_text = "\n".join(history_lines) if history_lines else "(no history)"

    context_lines = [
        f"[{idx + 1}] {item['content']} (source: {item['filename']}#{item['chunk_index']})"
        for idx, item in enumerate(context_chunks)
    ]
    context_text = "\n\n".join(context_lines)

    user_prompt = DEFAULT_RAG_USER_PROMPT.format(
        context=context_text,
        question=question,
        history=history_text,
    )
    return system_prompt, user_prompt


async def stream_rag_response(
    db: AsyncSession,
    request: ChatRequest,
    prompt_template: PromptTemplateResponse,
    chat_history: list[ChatMessage],
):
    """Stream RAG response tokens and final metadata."""
    settings = get_settings()
    kb = await db.get(KnowledgeBase, request.kb_id)
    if kb is None:
        raise ServiceError("Knowledge base not found", status_code=404)

    try:
        embeddings = await generate_embeddings([request.message], model=kb.embedding_model)
        query_embedding = embeddings[0]
    except Exception as exc:
        raise ServiceError(f"Embedding generation failed: {exc}", status_code=502) from exc

    chunks = await retrieve_relevant_chunks(
        db,
        kb.id,
        query_embedding,
        query_text=request.message,
        top_k=5,
    )
    if not chunks:
        raise ServiceError("Knowledge base is empty or not indexed yet", status_code=400)

    system_prompt, user_prompt = build_rag_prompt(
        system_prompt=prompt_template.system_prompt,
        context_chunks=chunks,
        question=request.message,
        chat_history=chat_history,
    )

    client = ollama_client.AsyncClient(host=settings.ollama_base_url)
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt},
    ]

    try:
        stream = await client.chat(
            model=request.model_name,
            messages=messages,
            options={"temperature": float(prompt_template.temperature)},
            stream=True,
        )
    except Exception as exc:
        raise ServiceError(f"Ollama chat request failed: {exc}", status_code=502) from exc

    full_text: list[str] = []
    try:
        async for chunk in stream:
            token = chunk.get("message", {}).get("content", "")
            if token:
                full_text.append(token)
                yield {"type": "token", "token": token}
    except Exception as exc:
        raise ServiceError(f"SSE stream interrupted: {exc}", status_code=502) from exc

    yield {"type": "done", "content": "".join(full_text), "sources": chunks}
