from __future__ import annotations

import uuid

from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

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
        stmt = select(PromptTemplate).order_by(PromptTemplate.created_at.desc())
        rows = (await self.db.execute(stmt)).scalars().all()
        return [PromptTemplateResponse.model_validate(row) for row in rows]

    async def create_prompt(self, data: PromptTemplateCreate) -> PromptTemplateResponse:
        if data.is_default:
            await self.db.execute(update(PromptTemplate).values(is_default=False))

        prompt = PromptTemplate(**data.model_dump())
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
        if updates.get("is_default"):
            await self.db.execute(update(PromptTemplate).values(is_default=False))

        for key, value in updates.items():
            setattr(prompt, key, value)

        await self.db.commit()
        await self.db.refresh(prompt)
        return PromptTemplateResponse.model_validate(prompt)

    async def delete_prompt(self, prompt_id: uuid.UUID) -> None:
        prompt = await self.db.get(PromptTemplate, prompt_id)
        if prompt is None:
            raise ServiceError("Prompt template not found", status_code=404)
        await self.db.delete(prompt)
        await self.db.commit()
