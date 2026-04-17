from __future__ import annotations

import uuid

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.api_endpoint import ApiEndpoint
from app.models.chat import ChatSession
from app.models.prompt_template import PromptTemplate
from app.schemas.prompt_template import (
    PromptTemplateCreate,
    PromptTemplateResponse,
    PromptTemplateUpdate,
)
from app.services.knowledge_service import ServiceError


class PromptService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def list_prompts(self) -> list[PromptTemplateResponse]:
        stmt = select(PromptTemplate).order_by(
            PromptTemplate.is_default.desc(),
            PromptTemplate.created_at.asc(),
        )
        rows = (await self.db.execute(stmt)).scalars().all()
        return [PromptTemplateResponse.model_validate(row) for row in rows]

    async def create_prompt(self, data: PromptTemplateCreate) -> PromptTemplateResponse:
        should_be_default = data.is_default or not await self._has_default_prompt()
        if should_be_default:
            await self._clear_default_flags()

        prompt = PromptTemplate(**(data.model_dump() | {"is_default": should_be_default}))
        self.db.add(prompt)
        await self.db.commit()
        await self.db.refresh(prompt)
        return PromptTemplateResponse.model_validate(prompt)

    async def get_prompt(self, prompt_id: uuid.UUID) -> PromptTemplateResponse:
        prompt = await self.db.get(PromptTemplate, prompt_id)
        if prompt is None:
            raise ServiceError("Prompt template not found", status_code=404)
        return PromptTemplateResponse.model_validate(prompt)

    async def update_prompt(
        self,
        prompt_id: uuid.UUID,
        data: PromptTemplateUpdate,
    ) -> PromptTemplateResponse:
        prompt = await self.db.get(PromptTemplate, prompt_id)
        if prompt is None:
            raise ServiceError("Prompt template not found", status_code=404)

        updates = data.model_dump(exclude_unset=True)
        if updates.get("is_default") is True:
            await self._clear_default_flags(exclude_prompt_id=prompt_id)
        elif updates.get("is_default") is False and prompt.is_default:
            replacement_prompt = await self._get_replacement_prompt(prompt_id)
            if replacement_prompt is None:
                updates["is_default"] = True
            else:
                replacement_prompt.is_default = True

        for key, value in updates.items():
            setattr(prompt, key, value)

        await self.db.commit()
        await self.db.refresh(prompt)
        return PromptTemplateResponse.model_validate(prompt)

    async def delete_prompt(self, prompt_id: uuid.UUID) -> None:
        prompt = await self.db.get(PromptTemplate, prompt_id)
        if prompt is None:
            raise ServiceError("Prompt template not found", status_code=404)

        prompt_count = await self.db.scalar(select(func.count(PromptTemplate.id)))
        if (prompt_count or 0) <= 1:
            raise ServiceError(
                (
                    "At least one prompt template is required. "
                    "Create another template before deleting this one."
                ),
                status_code=409,
            )

        replacement_prompt = await self.db.scalar(
            select(PromptTemplate)
            .where(PromptTemplate.id != prompt_id)
            .order_by(PromptTemplate.is_default.desc(), PromptTemplate.created_at.asc())
        )
        if replacement_prompt is None:
            raise ServiceError(
                "No replacement prompt template is available for deletion.",
                status_code=409,
            )

        await self.db.execute(
            update(ChatSession)
            .where(ChatSession.prompt_id == prompt_id)
            .values(prompt_id=None)
        )
        await self.db.execute(
            update(ApiEndpoint)
            .where(ApiEndpoint.prompt_id == prompt_id)
            .values(prompt_id=replacement_prompt.id)
        )
        if prompt.is_default and not replacement_prompt.is_default:
            replacement_prompt.is_default = True

        await self.db.delete(prompt)
        await self.db.commit()

    async def _has_default_prompt(self) -> bool:
        default_prompt_count = await self.db.scalar(
            select(func.count(PromptTemplate.id)).where(PromptTemplate.is_default.is_(True))
        )
        return (default_prompt_count or 0) > 0

    async def _clear_default_flags(self, exclude_prompt_id: uuid.UUID | None = None) -> None:
        stmt = update(PromptTemplate).values(is_default=False)
        if exclude_prompt_id is not None:
            stmt = stmt.where(PromptTemplate.id != exclude_prompt_id)
        await self.db.execute(stmt)

    async def _get_replacement_prompt(self, prompt_id: uuid.UUID) -> PromptTemplate | None:
        return await self.db.scalar(
            select(PromptTemplate)
            .where(PromptTemplate.id != prompt_id)
            .order_by(PromptTemplate.is_default.desc(), PromptTemplate.created_at.asc())
        )
