# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.document import DocumentResponse
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdate,
)
from app.services.knowledge_service import KnowledgeService, ServiceError

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


def _to_http_exception(exc: ServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("", response_model=list[KnowledgeBaseResponse])
async def list_knowledge_bases(db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    return await service.list_knowledge_bases()


@router.post("", response_model=KnowledgeBaseResponse, status_code=201)
async def create_knowledge_base(data: KnowledgeBaseCreate, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    return await service.create_knowledge_base(data)


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(kb_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    kb = await service.get_knowledge_base(kb_id)
    if kb is None:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return kb


@router.put("/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_knowledge_base(
    kb_id: uuid.UUID,
    data: KnowledgeBaseUpdate,
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    kb = await service.update_knowledge_base(kb_id, data)
    if kb is None:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return kb


@router.delete("/{kb_id}", status_code=204)
async def delete_knowledge_base(kb_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    try:
        await service.delete_knowledge_base(kb_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/{kb_id}/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(kb_id: uuid.UUID, file: UploadFile, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    try:
        return await service.upload_document(kb_id, file)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.get("/{kb_id}/documents", response_model=list[DocumentResponse])
async def list_documents(kb_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    try:
        return await service.list_documents(kb_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.delete("/{kb_id}/documents/{doc_id}", status_code=204)
async def delete_document(
    kb_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    try:
        await service.delete_document(kb_id, doc_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/{kb_id}/documents/{doc_id}/reindex", response_model=DocumentResponse)
async def reindex_document(
    kb_id: uuid.UUID,
    doc_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
):
    service = KnowledgeService(db)
    try:
        return await service.reindex_document(kb_id, doc_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc
