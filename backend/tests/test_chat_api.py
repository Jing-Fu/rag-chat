import uuid
from datetime import UTC, datetime

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.chat import ChatMessageResponse, ChatSessionResponse
from app.services.knowledge_service import ServiceError


async def test_send_message_streams_sse_events(monkeypatch) -> None:
    async def _mock_stream_response(self, request):
        yield {"event": "session", "data": str(uuid.uuid4())}
        yield {"event": "token", "data": "hello"}
        yield {"event": "done", "data": '{"session_id":"s","sources":[]}'}

    monkeypatch.setattr(
        "app.services.chat_service.ChatService.stream_response",
        _mock_stream_response,
    )
    transport = ASGITransport(app=app)
    payload = {"message": "hi", "kb_id": str(uuid.uuid4()), "model_name": "llama3.2"}

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        async with client.stream("POST", "/api/chat", json=payload) as response:
            body = ""
            async for chunk in response.aiter_text():
                body += chunk

    assert response.status_code == 200
    assert "event: session" in body
    assert "event: token" in body
    assert "event: done" in body
    assert "data: hello" in body


async def test_list_sessions_returns_data(monkeypatch) -> None:
    async def _mock_list(self):
        return [
            ChatSessionResponse(
                id=uuid.uuid4(),
                kb_id=uuid.uuid4(),
                prompt_id=uuid.uuid4(),
                model_name="llama3.2",
                message_count=2,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
        ]

    monkeypatch.setattr("app.services.chat_service.ChatService.list_sessions", _mock_list)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/chat/sessions")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["model_name"] == "llama3.2"


async def test_get_messages_maps_service_error(monkeypatch) -> None:
    async def _mock_get(self, session_id):
        raise ServiceError("Chat session not found", status_code=404)

    monkeypatch.setattr("app.services.chat_service.ChatService.get_messages", _mock_get)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/chat/sessions/{uuid.uuid4()}/messages")

    assert response.status_code == 404
    assert response.json()["detail"] == "Chat session not found"


async def test_delete_session_returns_no_content(monkeypatch) -> None:
    async def _mock_delete(self, session_id):
        return None

    monkeypatch.setattr("app.services.chat_service.ChatService.delete_session", _mock_delete)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.delete(f"/api/chat/sessions/{uuid.uuid4()}")

    assert response.status_code == 204
    assert response.text == ""


async def test_delete_all_sessions_returns_no_content(monkeypatch) -> None:
    async def _mock_delete_all(self):
        return None

    monkeypatch.setattr("app.services.chat_service.ChatService.delete_all_sessions", _mock_delete_all)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.delete("/api/chat/sessions")

    assert response.status_code == 204
    assert response.text == ""


async def test_get_messages_returns_data(monkeypatch) -> None:
    async def _mock_get(self, session_id):
        return [
            ChatMessageResponse(
                id=uuid.uuid4(),
                session_id=session_id,
                role="assistant",
                content="ok",
                sources=None,
                created_at=datetime.now(UTC),
            )
        ]

    monkeypatch.setattr("app.services.chat_service.ChatService.get_messages", _mock_get)
    transport = ASGITransport(app=app)
    session_id = uuid.uuid4()

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/chat/sessions/{session_id}/messages")

    assert response.status_code == 200
    assert response.json()[0]["role"] == "assistant"
