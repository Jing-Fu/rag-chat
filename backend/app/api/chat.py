# ruff: noqa: B008

import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.schemas.chat import ChatMessageResponse, ChatRequest, ChatSessionResponse
from app.services.chat_service import ChatService
from app.services.knowledge_service import ServiceError

router = APIRouter(prefix="/api/chat", tags=["chat"])


def _to_http_exception(exc: ServiceError) -> HTTPException:
    return HTTPException(status_code=exc.status_code, detail=exc.detail)


@router.post("")
async def send_message(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    service = ChatService(db)

    async def _event_stream():
        try:
            async for event in service.stream_response(request):
                yield event
        except ServiceError as exc:
            yield {"event": "error", "data": exc.detail}

    return EventSourceResponse(_event_stream())


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    return await service.list_sessions()


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    try:
        return await service.get_messages(session_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc


@router.delete("/sessions", status_code=204)
async def delete_all_sessions(db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    await service.delete_all_sessions()


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    try:
        await service.delete_session(session_id)
    except ServiceError as exc:
        raise _to_http_exception(exc) from exc
