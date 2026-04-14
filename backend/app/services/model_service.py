from __future__ import annotations

import ollama as ollama_client

from app.config import get_settings
from app.services.knowledge_service import ServiceError


class ModelService:
    def __init__(self):
        settings = get_settings()
        self.client = ollama_client.AsyncClient(host=settings.ollama_base_url)

    async def list_models(self) -> list[dict]:
        try:
            response = await self.client.list()
        except Exception as exc:
            raise ServiceError(f"Ollama is unavailable: {exc}", status_code=503) from exc

        return [
            {
                "name": model["name"],
                "size": model.get("size"),
                "modified_at": model.get("modified_at"),
                "model_type": "embed" if "embed" in model["name"].lower() else "llm",
            }
            for model in response.get("models", [])
        ]

    async def pull_model(self, model_name: str):
        try:
            progress = await self.client.pull(model_name, stream=True)
            async for chunk in progress:
                yield chunk
        except Exception as exc:
            raise ServiceError(
                f"Failed to pull model '{model_name}': {exc}",
                status_code=502,
            ) from exc

    async def delete_model(self, model_name: str) -> None:
        try:
            await self.client.delete(model_name)
        except Exception as exc:
            raise ServiceError(
                f"Failed to delete model '{model_name}': {exc}",
                status_code=502,
            ) from exc
