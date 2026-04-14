# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.prompt_template import (
    PromptTemplateCreate,
    PromptTemplateResponse,
    PromptTemplateUpdate,
)
from app.services.knowledge_service import ServiceError
from app.services.prompt_service import PromptService

router = APIRouter(prefix="/api/prompts", tags=["prompts"])


def _to_http_exception(exc: ServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("", response_model=list[PromptTemplateResponse])
async def list_prompts(db: AsyncSession = Depends(get_db)):
    service = PromptService(db)
    return await service.list_prompts()


@router.post("", response_model=PromptTemplateResponse, status_code=201)
async def create_prompt(data: PromptTemplateCreate, db: AsyncSession = Depends(get_db)):
    service = PromptService(db)
    return await service.create_prompt(data)


@router.get("/{prompt_id}", response_model=PromptTemplateResponse)
async def get_prompt(prompt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = PromptService(db)
    try:
        return await service.get_prompt(prompt_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.put("/{prompt_id}", response_model=PromptTemplateResponse)
async def update_prompt(
    prompt_id: uuid.UUID,
    data: PromptTemplateUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = PromptService(db)
    try:
        return await service.update_prompt(prompt_id, data)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.delete("/{prompt_id}", status_code=204)
async def delete_prompt(prompt_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = PromptService(db)
    try:
        await service.delete_prompt(prompt_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc
