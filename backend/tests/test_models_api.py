from httpx import ASGITransport, AsyncClient

from app.main import app
from app.services.knowledge_service import ServiceError


async def test_list_models_returns_data(monkeypatch) -> None:
    async def _mock_list(self):
        return [{"name": "llama3.2", "size": 10, "model_type": "llm", "modified_at": None}]

    monkeypatch.setattr("app.services.model_service.ModelService.list_models", _mock_list)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/models")

    assert response.status_code == 200
    assert response.json()[0]["name"] == "llama3.2"


async def test_pull_model_streams_progress(monkeypatch) -> None:
    async def _mock_pull(self, model_name):
        yield {"status": "downloading", "completed": 1}

    monkeypatch.setattr("app.services.model_service.ModelService.pull_model", _mock_pull)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        async with client.stream(
            "POST",
            "/api/models/pull",
            json={"model_name": "llama3.2"},
        ) as response:
            body = ""
            async for chunk in response.aiter_text():
                body += chunk

    assert response.status_code == 200
    assert "event: progress" in body
    assert "event: done" in body


async def test_delete_model_maps_service_error(monkeypatch) -> None:
    async def _mock_delete(self, model_name):
        raise ServiceError("Failed to delete model", status_code=502)

    monkeypatch.setattr("app.services.model_service.ModelService.delete_model", _mock_delete)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.delete("/api/models/llama3.2")

    assert response.status_code == 502
    assert response.json()["detail"] == "Failed to delete model"
