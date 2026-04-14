from app import models  # noqa: F401
from app.database import Base


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
