import uuid
from datetime import datetime

from pydantic import BaseModel, Field


DEFAULT_USER_PROMPT_TEMPLATE = """請只根據提供的知識庫內容回答問題。

如果內容不足以支持答案，請明確說不知道，不要自行捏造細節。
請優先提供精簡、可驗證且重點明確的回答。

知識庫內容：
{context}

對話歷史：
{history}

問題：
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
