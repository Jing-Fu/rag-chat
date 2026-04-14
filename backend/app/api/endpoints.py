# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.api_endpoint import ApiEndpointCreate, ApiEndpointQuery, ApiEndpointResponse
from app.services.endpoint_service import EndpointService
from app.services.knowledge_service import ServiceError

router = APIRouter(prefix="/api/endpoints", tags=["endpoints"])


def _to_http_exception(exc: ServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("", response_model=list[ApiEndpointResponse])
async def list_endpoints(db: AsyncSession = Depends(get_db)):
    service = EndpointService(db)
    return await service.list_endpoints()


@router.post("", response_model=ApiEndpointResponse, status_code=201)
async def create_endpoint(data: ApiEndpointCreate, db: AsyncSession = Depends(get_db)):
    service = EndpointService(db)
    return await service.create_endpoint(data)


@router.post("/{endpoint_id}/query")
async def query_endpoint(
    endpoint_id: uuid.UUID,
    data: ApiEndpointQuery,
    db: AsyncSession = Depends(get_db),
):
    service = EndpointService(db)
    try:
        return await service.query_endpoint(endpoint_id, data.question, data.api_key)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/{endpoint_id}/regenerate-key", response_model=ApiEndpointResponse)
async def regenerate_key(endpoint_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = EndpointService(db)
    try:
        return await service.regenerate_key(endpoint_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc
