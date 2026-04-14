from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "rag_platform"
    postgres_user: str = "rag_user"
    postgres_password: str = "change_me"

    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_embedding_model: str = "nomic-embed-text"

    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    upload_max_size_mb: int = 50
    upload_dir: Path = Field(default=Path("./uploads"))

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    @property
    def cors_origin_list(self) -> list[str]:
        origins = {origin.strip() for origin in self.cors_origins.split(",") if origin.strip()}
        origins.update({"http://localhost:3000", "http://127.0.0.1:3000"})
        return sorted(origins)


@lru_cache
def get_settings() -> Settings:
    return Settings()
