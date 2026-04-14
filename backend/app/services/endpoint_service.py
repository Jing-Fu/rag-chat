from __future__ import annotations

import secrets
import uuid

import ollama as ollama_client
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import get_settings
from app.core.rag import stream_rag_response
from app.models.api_endpoint import ApiEndpoint
from app.models.prompt_template import PromptTemplate
from app.schemas.api_endpoint import ApiEndpointCreate, ApiEndpointResponse
from app.schemas.chat import ChatRequest
from app.schemas.prompt_template import PromptTemplateResponse
from app.services.knowledge_service import ServiceError


class EndpointService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.settings = get_settings()

    async def list_endpoints(self) -> list[ApiEndpointResponse]:
        stmt = select(ApiEndpoint).order_by(ApiEndpoint.created_at.desc())
        endpoints = (await self.db.execute(stmt)).scalars().all()
        return [ApiEndpointResponse.model_validate(item) for item in endpoints]

    async def create_endpoint(self, data: ApiEndpointCreate) -> ApiEndpointResponse:
        endpoint = ApiEndpoint(**data.model_dump())
        self.db.add(endpoint)
        await self.db.commit()
        await self.db.refresh(endpoint)
        return ApiEndpointResponse.model_validate(endpoint)

    async def query_endpoint(
        self,
        endpoint_id: uuid.UUID,
        question: str,
        api_key: str,
    ) -> dict:
        endpoint = await self.db.get(ApiEndpoint, endpoint_id)
        if endpoint is None:
            raise ServiceError("API endpoint not found", status_code=404)
        if not endpoint.is_active:
            raise ServiceError("API endpoint is disabled", status_code=403)
        if endpoint.api_key != api_key:
            raise ServiceError("Invalid API key", status_code=401)

        try:
            client = ollama_client.AsyncClient(host=self.settings.ollama_base_url)
            await client.list()
        except Exception as exc:
            raise ServiceError(f"Ollama is unavailable: {exc}", status_code=503) from exc

        prompt_model = await self.db.get(PromptTemplate, endpoint.prompt_id)
        if prompt_model is None:
            raise ServiceError("Prompt template not found", status_code=404)
        prompt_template = PromptTemplateResponse.model_validate(prompt_model)

        request = ChatRequest(
            message=question,
            kb_id=endpoint.kb_id,
            prompt_id=endpoint.prompt_id,
            model_name=endpoint.model_name,
        )

        answer = ""
        sources: list[dict] = []
        async for item in stream_rag_response(
            db=self.db,
            request=request,
            prompt_template=prompt_template,
            chat_history=[],
        ):
            if item["type"] == "token":
                answer += item["token"]
                continue
            answer = item["content"]
            sources = item["sources"]

        return {
            "endpoint_id": str(endpoint.id),
            "answer": answer,
            "sources": sources,
            "model_name": endpoint.model_name,
        }

    async def regenerate_key(self, endpoint_id: uuid.UUID) -> ApiEndpointResponse:
        endpoint = await self.db.get(ApiEndpoint, endpoint_id)
        if endpoint is None:
            raise ServiceError("API endpoint not found", status_code=404)

        endpoint.api_key = secrets.token_urlsafe(32)
        await self.db.commit()
        await self.db.refresh(endpoint)
        return ApiEndpointResponse.model_validate(endpoint)
