from pydantic import BaseModel


class ModelPullRequest(BaseModel):
    model_name: str


class ModelInfo(BaseModel):
    name: str
    size: int | None = None
    model_type: str = "llm"
    modified_at: str | None = None
