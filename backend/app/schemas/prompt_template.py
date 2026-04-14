import uuid
from datetime import datetime

from pydantic import BaseModel, Field


DEFAULT_USER_PROMPT_TEMPLATE = """Please answer the question using only the provided knowledge base content.

If the content is insufficient to support an answer, say that you do not know and do not fabricate details.
Prefer concise, grounded answers that summarize the most relevant points.

Knowledge base content:
{context}

Conversation history:
{history}

Question:
{question}"""


class PromptTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    system_prompt: str
    user_prompt_template: str = DEFAULT_USER_PROMPT_TEMPLATE
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    is_default: bool = False


class PromptTemplateUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    system_prompt: str | None = None
    user_prompt_template: str | None = None
    temperature: float | None = Field(default=None, ge=0.0, le=2.0)
    is_default: bool | None = None


class PromptTemplateResponse(BaseModel):
    id: uuid.UUID
    name: str
    system_prompt: str
    user_prompt_template: str
    temperature: float
    is_default: bool
    created_at: datetime

    model_config = {"from_attributes": True}
