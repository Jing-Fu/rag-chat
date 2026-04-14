from datetime import UTC, datetime
from types import SimpleNamespace

from app import models  # noqa: F401
from app.database import Base
from app.services.model_service import ModelService


def test_all_required_tables_are_registered() -> None:
    expected_tables = {
        "knowledge_bases",
        "documents",
        "chunks",
        "ollama_models",
        "prompt_templates",
        "api_endpoints",
        "chat_sessions",
        "chat_messages",
    }
    assert expected_tables.issubset(set(Base.metadata.tables.keys()))


def test_chunk_model_uses_metadata_column_name() -> None:
    chunk_table = Base.metadata.tables["chunks"]
    assert "metadata" in chunk_table.columns
    assert "metadata_" not in chunk_table.columns


async def test_model_service_supports_typed_ollama_models() -> None:
    service = ModelService()

    async def _mock_list():
        return SimpleNamespace(
            models=[
                SimpleNamespace(
                    model="nomic-embed-text:latest",
                    size=10,
                    modified_at=datetime(2026, 4, 14, 0, 0, tzinfo=UTC),
                )
            ]
        )

    service.client = SimpleNamespace(list=_mock_list)

    response = await service.list_models()

    assert response == [
        {
            "name": "nomic-embed-text:latest",
            "size": 10,
            "modified_at": "2026-04-14T00:00:00+00:00",
            "model_type": "embed",
        }
    ]


async def test_model_service_marks_bert_family_models_as_embeddings() -> None:
    service = ModelService()

    async def _mock_list():
        return {
            "models": [
                {
                    "model": "bge-m3:latest",
                    "size": 10,
                    "modified_at": "2026-04-14T00:00:00+00:00",
                    "details": {
                        "family": "bert",
                        "families": ["bert"],
                    },
                },
                {
                    "model": "qwen3.5:4b",
                    "size": 20,
                    "modified_at": "2026-04-14T00:00:00+00:00",
                    "details": {
                        "family": "qwen35",
                        "families": ["qwen35"],
                    },
                },
            ]
        }

    service.client = SimpleNamespace(list=_mock_list)

    response = await service.list_models()

    assert response == [
        {
            "name": "bge-m3:latest",
            "size": 10,
            "modified_at": "2026-04-14T00:00:00+00:00",
            "model_type": "embed",
        },
        {
            "name": "qwen3.5:4b",
            "size": 20,
            "modified_at": "2026-04-14T00:00:00+00:00",
            "model_type": "llm",
        },
    ]
