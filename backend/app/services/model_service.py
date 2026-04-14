from __future__ import annotations

from datetime import datetime

import ollama as ollama_client

from app.config import get_settings
from app.services.knowledge_service import ServiceError


class ModelService:
    def __init__(self):
        settings = get_settings()
        self.client = ollama_client.AsyncClient(host=settings.ollama_base_url)

    @staticmethod
    def _get_value(payload, *keys: str):
        for key in keys:
            if isinstance(payload, dict) and key in payload:
                value = payload[key]
            else:
                value = getattr(payload, key, None)

            if value is not None:
                return value

        return None

    @classmethod
    def _get_models(cls, response) -> list:
        models = cls._get_value(response, "models")
        if isinstance(models, list):
            return models
        if models is None:
            return []
        return list(models)

    @staticmethod
    def _serialize_modified_at(value: datetime | str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, datetime):
            return value.isoformat()
        return str(value)

    @classmethod
    def _infer_model_type(cls, model) -> str:
        model_name = str(cls._get_value(model, "model", "name") or "").lower()
        details = cls._get_value(model, "details")
        family = str(cls._get_value(details, "family") or "").lower()
        raw_families = cls._get_value(details, "families")
        families = []

        if isinstance(raw_families, list):
            families = [str(item).lower() for item in raw_families]

        identifiers = [model_name, family, *families]
        if any(
            "embed" in identifier or "bert" in identifier or identifier.startswith("bge")
            for identifier in identifiers
            if identifier
        ):
            return "embed"

        return "llm"

    async def list_models(self) -> list[dict]:
        try:
            response = await self.client.list()
        except Exception as exc:
            raise ServiceError(f"Ollama is unavailable: {exc}", status_code=503) from exc

        models: list[dict] = []
        for model in self._get_models(response):
            model_name = self._get_value(model, "model", "name")
            if not isinstance(model_name, str) or not model_name:
                raise ServiceError("Unexpected Ollama model payload", status_code=502)

            models.append(
                {
                    "name": model_name,
                    "size": self._get_value(model, "size"),
                    "modified_at": self._serialize_modified_at(
                        self._get_value(model, "modified_at")
                    ),
                    "model_type": self._infer_model_type(model),
                }
            )

        return models

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
