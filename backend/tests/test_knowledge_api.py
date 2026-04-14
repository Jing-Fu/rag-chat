import uuid
from datetime import UTC, datetime

from httpx import ASGITransport, AsyncClient

from app.main import app
from app.schemas.document import DocumentResponse
from app.schemas.knowledge_base import KnowledgeBaseResponse
from app.services.knowledge_service import ServiceError


async def test_list_knowledge_bases_returns_data(monkeypatch) -> None:
    async def _mock_list(self):
        return [
            KnowledgeBaseResponse(
                id=uuid.uuid4(),
                name="KB 1",
                description="desc",
                chunk_size=1000,
                chunk_overlap=200,
                embedding_model="nomic-embed-text",
                status="active",
                document_count=2,
                created_at=datetime.now(UTC),
                updated_at=datetime.now(UTC),
            )
        ]

    monkeypatch.setattr(
        "app.services.knowledge_service.KnowledgeService.list_knowledge_bases",
        _mock_list,
    )
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get("/api/knowledge")

    assert response.status_code == 200
    assert len(response.json()) == 1
    assert response.json()[0]["name"] == "KB 1"


async def test_get_knowledge_base_not_found(monkeypatch) -> None:
    async def _mock_get(self, kb_id):
        return None

    monkeypatch.setattr(
        "app.services.knowledge_service.KnowledgeService.get_knowledge_base",
        _mock_get,
    )
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.get(f"/api/knowledge/{uuid.uuid4()}")

    assert response.status_code == 404
    assert response.json()["detail"] == "Knowledge base not found"


async def test_upload_document_maps_service_error(monkeypatch) -> None:
    async def _mock_upload(self, kb_id, file):
        raise ServiceError("Unsupported file type: .exe", status_code=400)

    monkeypatch.setattr(
        "app.services.knowledge_service.KnowledgeService.upload_document",
        _mock_upload,
    )
    transport = ASGITransport(app=app)

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(
            f"/api/knowledge/{uuid.uuid4()}/upload",
            files={"file": ("bad.exe", b"binary", "application/octet-stream")},
        )

    assert response.status_code == 400
    assert response.json()["detail"] == "Unsupported file type: .exe"


async def test_reindex_document_returns_response(monkeypatch) -> None:
    async def _mock_reindex(self, kb_id, doc_id):
        return DocumentResponse(
            id=doc_id,
            kb_id=kb_id,
            filename="sample.txt",
            file_type=".txt",
            file_size=100,
            chunk_count=3,
            status="ready",
            created_at=datetime.now(UTC),
        )

    monkeypatch.setattr(
        "app.services.knowledge_service.KnowledgeService.reindex_document",
        _mock_reindex,
    )
    transport = ASGITransport(app=app)
    kb_id = uuid.uuid4()
    doc_id = uuid.uuid4()

    async with AsyncClient(transport=transport, base_url="http://testserver") as client:
        response = await client.post(f"/api/knowledge/{kb_id}/documents/{doc_id}/reindex")

    assert response.status_code == 200
    assert response.json()["id"] == str(doc_id)
    assert response.json()["status"] == "ready"
