import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PromptTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    system_prompt: str
    user_prompt_template: str = "根據以下資料回答問題：\n\n{context}\n\n問題：{question}"
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
