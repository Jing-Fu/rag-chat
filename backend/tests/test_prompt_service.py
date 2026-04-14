import uuid
from types import SimpleNamespace
from unittest.mock import AsyncMock

import pytest

from app.services.knowledge_service import ServiceError
from app.services.prompt_service import PromptService


@pytest.mark.asyncio
async def test_delete_prompt_reassigns_dependencies_and_keeps_history() -> None:
    prompt_id = uuid.uuid4()
    replacement_id = uuid.uuid4()

    db = AsyncMock()
    db.get.return_value = SimpleNamespace(id=prompt_id, is_default=True)
    db.scalar.side_effect = [
        2,
        SimpleNamespace(id=replacement_id, is_default=False),
    ]

    service = PromptService(db)

    await service.delete_prompt(prompt_id)

    chat_session_update = db.execute.await_args_list[0].args[0]
    endpoint_update = db.execute.await_args_list[1].args[0]

    assert db.execute.await_count == 2
    assert "UPDATE chat_sessions" in str(chat_session_update)
    assert chat_session_update.compile().params["prompt_id"] is None
    assert "UPDATE api_endpoints" in str(endpoint_update)
    assert endpoint_update.compile().params["prompt_id"] == replacement_id
    db.delete.assert_awaited_once()
    db.commit.assert_awaited_once()


@pytest.mark.asyncio
async def test_delete_prompt_rejects_deleting_last_template() -> None:
    prompt_id = uuid.uuid4()
    db = AsyncMock()
    db.get.return_value = SimpleNamespace(id=prompt_id, is_default=True)
    db.scalar.return_value = 1

    service = PromptService(db)

    with pytest.raises(ServiceError, match="At least one prompt template is required"):
        await service.delete_prompt(prompt_id)

    db.delete.assert_not_awaited()
