import uuid
from datetime import UTC, datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, Mock

import pytest

from app.schemas.prompt_template import PromptTemplateCreate, PromptTemplateUpdate
from app.services.knowledge_service import ServiceError
from app.services.prompt_service import PromptService


@pytest.mark.asyncio
async def test_create_first_prompt_auto_marks_default() -> None:
    db = AsyncMock()
    db.add = Mock()
    db.scalar.return_value = 0

    service = PromptService(db)

    async def _refresh_prompt(prompt) -> None:
        prompt.id = uuid.uuid4()
        prompt.created_at = datetime.now(UTC)

    db.refresh.side_effect = _refresh_prompt

    await service.create_prompt(PromptTemplateCreate(name="default", system_prompt="sys"))

    inserted_prompt = db.add.call_args.args[0]

    assert inserted_prompt.is_default is True
    assert db.execute.await_count == 1
    assert "UPDATE prompt_templates" in str(db.execute.await_args.args[0])


@pytest.mark.asyncio
async def test_update_default_prompt_promotes_replacement_when_unchecked() -> None:
    prompt_id = uuid.uuid4()
    replacement = SimpleNamespace(id=uuid.uuid4(), is_default=False)

    db = AsyncMock()
    db.get.return_value = SimpleNamespace(
        id=prompt_id,
        name="default",
        system_prompt="sys",
        user_prompt_template="{question}",
        temperature=0.7,
        is_default=True,
        created_at=datetime.now(UTC),
    )
    db.scalar.return_value = replacement

    service = PromptService(db)

    await service.update_prompt(prompt_id, PromptTemplateUpdate(is_default=False))

    assert replacement.is_default is True
    assert db.get.return_value.is_default is False
    db.commit.assert_awaited_once()


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
