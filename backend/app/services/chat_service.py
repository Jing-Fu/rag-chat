from __future__ import annotations

import json
import uuid
from collections.abc import AsyncGenerator
from datetime import UTC, datetime

import ollama as ollama_client
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.rag import stream_rag_response
from app.models.chat import ChatMessage, ChatSession
from app.models.prompt_template import PromptTemplate
from app.schemas.chat import ChatMessageResponse, ChatRequest, ChatSessionResponse
from app.schemas.prompt_template import PromptTemplateResponse
from app.services.knowledge_service import ServiceError


class ChatService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def stream_response(self, request: ChatRequest) -> AsyncGenerator[dict[str, str], None]:
        await self._ensure_ollama_available()

        prompt_template = await self._resolve_prompt_template(request.prompt_id)
        chat_history: list[ChatMessage]

        if request.session_id:
            session = await self.db.get(ChatSession, request.session_id)
            if session is None:
                raise ServiceError("Chat session not found", status_code=404)
            chat_history = await self._list_message_models(session.id)
        else:
            session = ChatSession(
                kb_id=request.kb_id,
                prompt_id=prompt_template.id,
                model_name=request.model_name,
            )
            self.db.add(session)
            await self.db.flush()
            chat_history = []

        user_message = ChatMessage(
            session_id=session.id,
            role="user",
            content=request.message,
            sources=None,
        )
        self.db.add(user_message)
        await self.db.flush()

        yield {"event": "session", "data": str(session.id)}

        assistant_text = ""
        sources: list[dict] = []
        async for item in stream_rag_response(
            db=self.db,
            request=request,
            prompt_template=prompt_template,
            chat_history=chat_history,
        ):
            if item["type"] == "token":
                token = item["token"]
                assistant_text += token
                yield {"event": "token", "data": token}
                continue

            assistant_text = item["content"]
            sources = item["sources"]

        assistant_message = ChatMessage(
            session_id=session.id,
            role="assistant",
            content=assistant_text,
            sources={"items": sources},
        )
        session.updated_at = datetime.now(UTC)
        self.db.add(assistant_message)
        await self.db.commit()

        yield {
            "event": "done",
            "data": json.dumps(
                {"session_id": str(session.id), "sources": sources},
                ensure_ascii=False,
            ),
        }

    async def list_sessions(self) -> list[ChatSessionResponse]:
        stmt = (
            select(ChatSession, func.count(ChatMessage.id).label("message_count"))
            .outerjoin(ChatMessage, ChatMessage.session_id == ChatSession.id)
            .group_by(ChatSession.id)
            .order_by(ChatSession.updated_at.desc())
        )
        rows = (await self.db.execute(stmt)).all()
        return [
            ChatSessionResponse(
                id=session.id,
                kb_id=session.kb_id,
                prompt_id=session.prompt_id,
                model_name=session.model_name,
                message_count=message_count,
                created_at=session.created_at,
                updated_at=session.updated_at,
            )
            for session, message_count in rows
        ]

    async def get_messages(self, session_id: uuid.UUID) -> list[ChatMessageResponse]:
        session = await self.db.get(ChatSession, session_id)
        if session is None:
            raise ServiceError("Chat session not found", status_code=404)

        messages = await self._list_message_models(session_id)
        return [ChatMessageResponse.model_validate(msg) for msg in messages]

    async def delete_session(self, session_id: uuid.UUID) -> None:
        session = await self.db.get(ChatSession, session_id)
        if session is None:
            raise ServiceError("Chat session not found", status_code=404)
        await self.db.delete(session)
        await self.db.commit()

    async def _resolve_prompt_template(
        self,
        prompt_id: uuid.UUID | None,
    ) -> PromptTemplateResponse:
        prompt_model: PromptTemplate | None
        if prompt_id:
            prompt_model = await self.db.get(PromptTemplate, prompt_id)
        else:
            stmt = (
                select(PromptTemplate)
                .where(PromptTemplate.is_default.is_(True))
                .order_by(PromptTemplate.created_at.asc())
            )
            prompt_model = (await self.db.execute(stmt)).scalars().first()

        if prompt_model is None:
            raise ServiceError("Prompt template not found", status_code=404)
        return PromptTemplateResponse.model_validate(prompt_model)

    async def _list_message_models(self, session_id: uuid.UUID) -> list[ChatMessage]:
        stmt = (
            select(ChatMessage)
            .where(ChatMessage.session_id == session_id)
            .order_by(ChatMessage.created_at.asc())
        )
        return (await self.db.execute(stmt)).scalars().all()

    async def _ensure_ollama_available(self) -> None:
        try:
            client = ollama_client.AsyncClient(host=self.settings.ollama_base_url)
            await client.list()
        except Exception as exc:
            raise ServiceError(f"Ollama is unavailable: {exc}", status_code=503) from exc
