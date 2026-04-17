import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.schemas.chat import ChatRequest
from app.schemas.prompt_template import PromptTemplateResponse
from app.services.chat_service import ChatService
from app.services.knowledge_service import ServiceError


class FakeAsyncSession:
    def __init__(self) -> None:
        self.commit_count = 0
        self.added: list[object] = []
        self.executed: list[object] = []

    def add(self, instance: object) -> None:
        self.added.append(instance)

    async def flush(self) -> None:
        for instance in self.added:
            if getattr(instance, "id", None) is None:
                instance.id = uuid.uuid4()
            if hasattr(instance, "created_at") and getattr(instance, "created_at", None) is None:
                instance.created_at = datetime.now(UTC)
            if hasattr(instance, "updated_at") and getattr(instance, "updated_at", None) is None:
                instance.updated_at = datetime.now(UTC)

    async def commit(self) -> None:
        self.commit_count += 1

    async def execute(self, statement) -> None:
        self.executed.append(statement)


async def test_stream_response_commits_new_session_before_emitting_session_event(
    monkeypatch,
) -> None:
    db = FakeAsyncSession()
    service = ChatService(db)

    async def _mock_ensure_ollama_available(self) -> None:
        return None

    async def _mock_resolve_prompt_template(self, prompt_id):
        return PromptTemplateResponse(
            id=uuid.uuid4(),
            name="Default",
            system_prompt="system",
            user_prompt_template="{question}",
            temperature=0.7,
            is_default=True,
            created_at=datetime.now(UTC),
        )

    async def _mock_stream_rag_response(**kwargs):
        yield {"type": "token", "token": "hello"}
        yield {"type": "final", "content": "hello", "sources": []}

    monkeypatch.setattr(ChatService, "_ensure_ollama_available", _mock_ensure_ollama_available)
    monkeypatch.setattr(ChatService, "_resolve_prompt_template", _mock_resolve_prompt_template)
    monkeypatch.setattr("app.services.chat_service.stream_rag_response", _mock_stream_rag_response)

    stream = service.stream_response(
        ChatRequest(
            message="hi",
            kb_id=uuid.uuid4(),
            model_name="llama3.2",
        )
    )

    first_event = await anext(stream)

    assert first_event["event"] == "session"
    assert db.commit_count == 1

    remaining_events = [event async for event in stream]

    assert remaining_events[-1]["event"] == "done"
    assert db.commit_count == 2


async def test_delete_all_sessions_executes_bulk_delete() -> None:
    db = FakeAsyncSession()
    service = ChatService(db)

    await service.delete_all_sessions()

    assert db.commit_count == 1
    assert len(db.executed) == 1
    assert "DELETE FROM chat_sessions" in str(db.executed[0])


async def test_resolve_prompt_template_falls_back_to_first_prompt_when_no_default() -> None:
    prompt_id = uuid.uuid4()
    db = AsyncMock()
    db.scalar.return_value = SimpleNamespace(
        id=prompt_id,
        name="Fallback",
        system_prompt="system",
        user_prompt_template="{question}",
        temperature=0.7,
        is_default=False,
        created_at=datetime.now(UTC),
    )
    service = ChatService(db)

    prompt = await service._resolve_prompt_template(None)

    assert isinstance(prompt, PromptTemplateResponse)
    assert prompt.id == prompt_id
    db.scalar.assert_awaited_once()


async def test_resolve_prompt_template_raises_when_no_prompt_exists() -> None:
    db = AsyncMock()
    db.scalar.return_value = None
    service = ChatService(db)

    with pytest.raises(ServiceError, match="Prompt template not found"):
        await service._resolve_prompt_template(None)
