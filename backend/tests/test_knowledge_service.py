import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.services.knowledge_service import KnowledgeService, ServiceError


@pytest.mark.asyncio
async def test_delete_knowledge_base_removes_dependencies_and_files(tmp_path) -> None:
    kb_id = uuid.uuid4()
    kb_dir = tmp_path / str(kb_id)
    kb_dir.mkdir(parents=True)
    (kb_dir / "sample.txt").write_text("content", encoding="utf-8")

    db = AsyncMock()
    kb = object()
    db.get.return_value = kb

    service = KnowledgeService(db)
    service.settings = SimpleNamespace(upload_dir=tmp_path)

    await service.delete_knowledge_base(kb_id)

    assert db.execute.await_count == 2
    assert "DELETE FROM api_endpoints" in str(db.execute.await_args_list[0].args[0])
    assert "DELETE FROM chat_sessions" in str(db.execute.await_args_list[1].args[0])
    db.delete.assert_awaited_once_with(kb)
    db.commit.assert_awaited_once()
    assert not kb_dir.exists()


@pytest.mark.asyncio
async def test_delete_knowledge_base_raises_when_missing() -> None:
    db = AsyncMock()
    db.get.return_value = None

    service = KnowledgeService(db)

    with pytest.raises(ServiceError, match="Knowledge base not found"):
        await service.delete_knowledge_base(uuid.uuid4())
