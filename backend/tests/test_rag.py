import uuid
from datetime import UTC, datetime
from typing import Any

from app.core.rag import stream_rag_response
from app.schemas.chat import ChatRequest
from app.schemas.prompt_template import PromptTemplateResponse


class FakeAsyncSession:
    def __init__(self, knowledge_base: Any) -> None:
        self.knowledge_base = knowledge_base

    async def get(self, model, key):
        return self.knowledge_base


async def test_stream_rag_response_passes_prompt_temperature_to_ollama(monkeypatch) -> None:
    kb_id = uuid.uuid4()
    db = FakeAsyncSession(
        type("KnowledgeBaseStub", (), {"id": kb_id, "embedding_model": "embed-model"})()
    )
    request = ChatRequest(message="這是什麼？", kb_id=kb_id, model_name="llama3.2")
    prompt_template = PromptTemplateResponse(
        id=uuid.uuid4(),
        name="Grounded",
        system_prompt="你是知識庫助理。",
        temperature=0.3,
        is_default=True,
        created_at=datetime.now(UTC),
    )
    captured_chat_kwargs: dict[str, Any] = {}

    async def _mock_generate_embeddings(
        texts: list[str], model: str | None = None
    ) -> list[list[float]]:
        assert texts == [request.message]
        assert model == "embed-model"
        return [[0.1, 0.2, 0.3]]

    async def _mock_retrieve_relevant_chunks(
        db,
        kb_id,
        query_embedding,
        query_text,
        top_k=5,
    ) -> list[dict[str, Any]]:
        assert kb_id == request.kb_id
        assert query_embedding == [0.1, 0.2, 0.3]
        assert query_text == request.message
        assert top_k == 5
        return [
            {
                "content": "知識庫內容",
                "filename": "guide.md",
                "chunk_index": 0,
            }
        ]

    async def _mock_chat_stream():
        yield {"message": {"content": "回"}}
        yield {"message": {"content": "答"}}

    class FakeAsyncClient:
        def __init__(self, host: str) -> None:
            self.host = host

        async def chat(self, **kwargs):
            captured_chat_kwargs.update(kwargs)
            return _mock_chat_stream()

    monkeypatch.setattr("app.core.rag.generate_embeddings", _mock_generate_embeddings)
    monkeypatch.setattr("app.core.rag.retrieve_relevant_chunks", _mock_retrieve_relevant_chunks)
    monkeypatch.setattr("app.core.rag.ollama_client.AsyncClient", FakeAsyncClient)

    events = [
        event
        async for event in stream_rag_response(
            db=db,
            request=request,
            prompt_template=prompt_template,
            chat_history=[],
        )
    ]

    assert captured_chat_kwargs["model"] == request.model_name
    assert captured_chat_kwargs["options"] == {"temperature": 0.3}
    assert captured_chat_kwargs["stream"] is True
    assert captured_chat_kwargs["messages"][0] == {
        "role": "system",
        "content": prompt_template.system_prompt,
    }
    assert events == [
        {"type": "token", "token": "回"},
        {"type": "token", "token": "答"},
        {
            "type": "done",
            "content": "回答",
            "sources": [{"content": "知識庫內容", "filename": "guide.md", "chunk_index": 0}],
        },
    ]
