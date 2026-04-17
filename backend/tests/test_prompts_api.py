import uuid
from datetime import UTC, datetime

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.prompt_template import PromptTemplateResponse
from app.services.knowledge_service import ServiceError


async def test_list_prompts_returns_data(monkeypatch) -> None:
    async def _mock_list(self):
        return [
            PromptTemplateResponse(
                id=uuid.uuid4(),
                name="default",
                system_prompt="sys",
                temperature=0.7,
                is_default=True,
                created_at=datetime.now(UTC),
            )
        ]

    monkeypatch.setattr("app.services.prompt_service.PromptService.list_prompts", _mock_list)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/prompts")

    assert response.status_code == 200
    assert response.json()[0]["name"] == "default"


async def test_create_prompt_returns_created(monkeypatch) -> None:
    async def _mock_create(self, data):
        return PromptTemplateResponse(
            id=uuid.uuid4(),
            name=data.name,
            system_prompt=data.system_prompt,
            temperature=data.temperature,
            is_default=data.is_default,
            created_at=datetime.now(UTC),
        )

    monkeypatch.setattr("app.services.prompt_service.PromptService.create_prompt", _mock_create)
    transport = ASGITransport(app=app)
    payload = {"name": "n", "system_prompt": "sys"}

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/prompts", json=payload)

    assert response.status_code == 201
    assert response.json()["name"] == "n"


async def test_get_prompt_maps_service_error(monkeypatch) -> None:
    async def _mock_get(self, prompt_id):
        raise ServiceError("Prompt template not found", status_code=404)

    monkeypatch.setattr("app.services.prompt_service.PromptService.get_prompt", _mock_get)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/prompts/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Prompt template not found"


async def test_delete_prompt_returns_no_content(monkeypatch) -> None:
    async def _mock_delete(self, prompt_id):
        return None

    monkeypatch.setattr("app.services.prompt_service.PromptService.delete_prompt", _mock_delete)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.delete(f"/api/prompts/{uuid.uuid4()}")

    assert response.status_code == 204


async def test_delete_prompt_maps_service_error(monkeypatch) -> None:
    async def _mock_delete(self, prompt_id):
        raise ServiceError("Cannot delete the final prompt template", status_code=409)

    monkeypatch.setattr("app.services.prompt_service.PromptService.delete_prompt", _mock_delete)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.delete(f"/api/prompts/{uuid.uuid4()}")

    assert response.status_code == 409
    assert response.json()["detail"] == "Cannot delete the final prompt template"
