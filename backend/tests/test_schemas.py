import pytest
from pydantic import ValidationError

from app.schemas.chat import ChatRequest
from app.schemas.knowledge_base import KnowledgeBaseCreate
from app.schemas.prompt_template import PromptTemplateCreate


def test_knowledge_base_create_defaults() -> None:
    schema = KnowledgeBaseCreate(name="kb")
    assert schema.chunk_size == 1000
    assert schema.chunk_overlap == 200
    assert schema.embedding_model == "nomic-embed-text"


def test_knowledge_base_create_rejects_invalid_chunk_size() -> None:
    with pytest.raises(ValidationError):
        KnowledgeBaseCreate(name="kb", chunk_size=50)


def test_chat_request_requires_non_empty_message() -> None:
    with pytest.raises(ValidationError):
        ChatRequest(message="", kb_id="0c7f74f2-00a8-4af6-a6f6-a909ff7f4909")


def test_prompt_template_create_temperature_range() -> None:
    with pytest.raises(ValidationError):
        PromptTemplateCreate(name="default", system_prompt="sys", temperature=2.5)
