import uuid
from datetime import UTC, datetime

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.api_endpoint import ApiEndpointResponse
from app.services.knowledge_service import ServiceError


async def test_list_endpoints_returns_data(monkeypatch) -> None:
    async def _mock_list(self):
        return [
            ApiEndpointResponse(
                id=uuid.uuid4(),
                name="demo",
                api_key="k",
                kb_id=uuid.uuid4(),
                prompt_id=uuid.uuid4(),
                model_name="llama3.2",
                is_active=True,
                created_at=datetime.now(UTC),
            )
        ]

    monkeypatch.setattr("app.services.endpoint_service.EndpointService.list_endpoints", _mock_list)
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/endpoints")

    assert response.status_code == 200
    assert response.json()[0]["name"] == "demo"


async def test_create_endpoint_returns_created(monkeypatch) -> None:
    async def _mock_create(self, data):
        return ApiEndpointResponse(
            id=uuid.uuid4(),
            name=data.name,
            api_key="k",
            kb_id=data.kb_id,
            prompt_id=data.prompt_id,
            model_name=data.model_name,
            is_active=True,
            created_at=datetime.now(UTC),
        )

    monkeypatch.setattr(
        "app.services.endpoint_service.EndpointService.create_endpoint",
        _mock_create,
    )
    transport = ASGITransport(app=app)
    payload = {
        "name": "e1",
        "kb_id": str(uuid.uuid4()),
        "prompt_id": str(uuid.uuid4()),
        "model_name": "llama3.2",
    }

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post("/api/endpoints", json=payload)

    assert response.status_code == 201
    assert response.json()["name"] == "e1"


async def test_query_endpoint_maps_service_error(monkeypatch) -> None:
    async def _mock_query(self, endpoint_id, question, api_key):
        raise ServiceError("Invalid API key", status_code=401)

    monkeypatch.setattr("app.services.endpoint_service.EndpointService.query_endpoint", _mock_query)
    transport = ASGITransport(app=app)
    payload = {"question": "q", "api_key": "bad"}

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(f"/api/endpoints/{uuid.uuid4()}/query", json=payload)

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid API key"


async def test_regenerate_key_returns_data(monkeypatch) -> None:
    async def _mock_regenerate(self, endpoint_id):
        return ApiEndpointResponse(
            id=endpoint_id,
            name="e1",
            api_key="new-key",
            kb_id=uuid.uuid4(),
            prompt_id=uuid.uuid4(),
            model_name="llama3.2",
            is_active=True,
            created_at=datetime.now(UTC),
        )

    monkeypatch.setattr(
        "app.services.endpoint_service.EndpointService.regenerate_key",
        _mock_regenerate,
    )
    transport = ASGITransport(app=app)
    endpoint_id = uuid.uuid4()

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(f"/api/endpoints/{endpoint_id}/regenerate-key")

    assert response.status_code == 200
    assert response.json()["api_key"] == "new-key"
