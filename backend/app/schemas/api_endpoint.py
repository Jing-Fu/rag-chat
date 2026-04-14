import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ApiEndpointCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    kb_id: uuid.UUID
    prompt_id: uuid.UUID
    model_name: str


class ApiEndpointResponse(BaseModel):
    id: uuid.UUID
    name: str
    api_key: str
    kb_id: uuid.UUID
    prompt_id: uuid.UUID
    model_name: str
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}


class ApiEndpointQuery(BaseModel):
    question: str = Field(..., min_length=1)
    api_key: str
