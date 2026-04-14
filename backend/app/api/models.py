# ruff: noqa: B008

import json

from fastapi import APIRouter, HTTPException
from sse_starlette.sse import EventSourceResponse

from app.schemas.model import ModelPullRequest
from app.services.knowledge_service import ServiceError
from app.services.model_service import ModelService

router = APIRouter(prefix="/api/models", tags=["models"])


def _to_http_exception(exc: ServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.get("")
async def list_models():
    service = ModelService()
    try:
        return await service.list_models()
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.post("/pull")
async def pull_model(data: ModelPullRequest):
    service = ModelService()

    async def _event_stream():
        try:
            async for progress in service.pull_model(data.model_name):
                yield {"event": "progress", "data": json.dumps(progress, ensure_ascii=False)}
            yield {"event": "done", "data": data.model_name}
        except ServiceError as exc:
            yield {"event": "error", "data": exc.detail}

    return EventSourceResponse(_event_stream())


@router.delete("/{model_name}", status_code=204)
async def delete_model(model_name: str):
    service = ModelService()
    try:
        await service.delete_model(model_name)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc
