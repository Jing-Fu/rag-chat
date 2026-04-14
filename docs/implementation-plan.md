# RAG ?箸????像????撖虫?閮

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 撱箇?銝??Self-hosted ??RAG ??極?瑕像?堆?霈??潸敹恍遣蝡恣???函蔡 RAG ?箸?????
**Architecture:** ??蝡臬?????Next.js 14 蝝?蝡?+ FastAPI 璅∠???蝡荔?PostgreSQL + pgvector ???????脣?嚗llama ???LLM?onorepo 蝯?嚗frontend/` + `backend/`嚗?
**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, pgvector, LangChain, Ollama SDK, Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand, Docker Compose

**Design Spec:** [design-spec.md](file:///D:/workspace/playground/rag-chat/docs/design-spec.md)

**Current Frontend Baseline:** `frontend/` 撌脣??剁?銝???恍???`/` ?予?亙?/knowledge`?/prompts` ????UI 撉冽嚗誑??`AppSidebar`?ChatHeader`?ChatInput` 蝑?典?隞嗚?蝡臭遙???冽迨?箇?銝?朣??惜???踝?銝??啣?憪?撠???
---

## Status Snapshot (2026-04-14)

- Checked completed implementation and verification steps across Task 1 to Task 10.
- Kept commit-related steps unchecked because commits were not executed as part of this update.
- Kept Task 10 Step 4 unchecked because the full manual E2E scenario (model pull + upload + chat/query flow) was not fully exercised end-to-end in this update.

### Remaining Unchecked Steps

- Task 1 - Step 9: Commit
- Task 2 - Step 9: Commit
- Task 3 - Step 3: Commit
- Task 4 - Step 7: Commit
- Task 5 - Step 6: Commit
- Task 6 - Step 3: Register router, test, and commit
- Task 7 - Step 5: Register routers, test, and commit
- Task 8 - Step 9: Commit
- Task 9 - Step 7: Commit
- Task 10 - Step 4: End-to-end functional test
- Task 10 - Step 6: Final Commit
## Task 1: 撠??????箇?閮剜

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `README.md`

- [x] **Step 1: 撱箇? Monorepo ?寧??*

```powershell
New-Item -ItemType Directory -Force -Path "D:\workspace\playground\rag-chat\backend\app"
```

- [x] **Step 2: 撱箇? backend/pyproject.toml**

```toml
[project]
name = "rag-chat-backend"
version = "0.1.0"
requires-python = ">=3.12"
dependencies = [
    "fastapi>=0.115.0",
    "uvicorn[standard]>=0.30.0",
    "sqlalchemy>=2.0.0",
    "alembic>=1.13.0",
    "asyncpg>=0.30.0",
    "pgvector>=0.3.0",
    "python-dotenv>=1.0.0",
    "python-multipart>=0.0.9",
    "langchain>=0.3.0",
    "langchain-community>=0.3.0",
    "langchain-text-splitters>=0.3.0",
    "ollama>=0.4.0",
    "pypdf>=4.0.0",
    "python-docx>=1.1.0",
    "pydantic>=2.0.0",
    "pydantic-settings>=2.0.0",
    "httpx>=0.27.0",
    "sse-starlette>=2.0.0",
]

[project.optional-dependencies]
dev = [
    "pytest>=8.0.0",
    "pytest-asyncio>=0.24.0",
    "pytest-httpx>=0.30.0",
    "ruff>=0.6.0",
    "httpx>=0.27.0",
]

[tool.ruff]
line-length = 100
target-version = "py312"

[tool.ruff.lint]
select = ["B", "E", "F", "I", "UP"]

[tool.pytest.ini_options]
asyncio_mode = "auto"
```

- [x] **Step 3: 撱箇? backend/app/config.py**

```python
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Database
    postgres_host: str = "localhost"
    postgres_port: int = 5432
    postgres_db: str = "rag_platform"
    postgres_user: str = "rag_user"
    postgres_password: str = "change_me"

    # Ollama
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.2"
    ollama_embedding_model: str = "nomic-embed-text"

    # Upload
    upload_max_size_mb: int = 50
    upload_dir: str = "./uploads"

    # CORS
    cors_origins: str = "http://localhost:3000"

    @property
    def database_url(self) -> str:
        return (
            f"postgresql+asyncpg://{self.postgres_user}:{self.postgres_password}"
            f"@{self.postgres_host}:{self.postgres_port}/{self.postgres_db}"
        )

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}


settings = Settings()
```

- [x] **Step 4: 撱箇? backend/app/database.py**

```python
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from app.config import settings

engine = create_async_engine(settings.database_url, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


class Base(DeclarativeBase):
    pass


async def get_db() -> AsyncSession:
    async with async_session() as session:
        try:
            yield session
        finally:
            await session.close()
```

- [x] **Step 5: 撱箇? backend/app/main.py**

```python
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    yield
    # Shutdown


app = FastAPI(
    title="RAG Platform API",
    description="RAG ?箸????像??API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
```

- [x] **Step 6: 撱箇? .env.example**

```env
# Database
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=rag_platform
POSTGRES_USER=rag_user
POSTGRES_PASSWORD=change_me

# Ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Backend
CORS_ORIGINS=http://localhost:3000

# Upload
UPLOAD_MAX_SIZE_MB=50
UPLOAD_DIR=./uploads
```

- [x] **Step 7: 撱箇? docker-compose.yml**

```yaml
services:
  postgres:
    image: pgvector/pgvector:pg16
    environment:
      POSTGRES_DB: rag_platform
      POSTGRES_USER: rag_user
      POSTGRES_PASSWORD: change_me
    ports:
      - "5432:5432"
    volumes:
      - pg_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U rag_user -d rag_platform"]
      interval: 5s
      timeout: 5s
      retries: 5

  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    ports:
      - "8000:8000"
    env_file:
      - .env
    environment:
      POSTGRES_HOST: postgres
      OLLAMA_BASE_URL: http://ollama:11434
    depends_on:
      postgres:
        condition: service_healthy
    volumes:
      - upload_data:/app/uploads

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on:
      - backend

volumes:
  pg_data:
  ollama_data:
  upload_data:
```

- [x] **Step 8: 摰?靘陷銝阡?霅???*

```powershell
cd D:\workspace\playground\rag-chat\backend
uv sync
```

Run: `uv run uvicorn app.main:app --host 0.0.0.0 --port 8000`
Expected: Server starts, `http://localhost:8000/api/health` returns `{"status":"ok"}`

- [ ] **Step 9: Commit**

```powershell
cd D:\workspace\playground\rag-chat
git init
git add .
git commit -m "feat: project scaffolding with FastAPI, config, and docker-compose"
```

---

## Task 2: 鞈?摨急芋?? Migration

**Files:**
- Create: `backend/app/models/__init__.py`
- Create: `backend/app/models/knowledge_base.py`
- Create: `backend/app/models/document.py`
- Create: `backend/app/models/chunk.py`
- Create: `backend/app/models/prompt_template.py`
- Create: `backend/app/models/api_endpoint.py`
- Create: `backend/app/models/chat.py`
- Create: `backend/app/models/ollama_model.py`
- Create: `backend/alembic/`
- Create: `backend/tests/test_models.py`

- [x] **Step 1: 撱箇? backend/app/models/knowledge_base.py**

```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class KnowledgeBase(Base):
    __tablename__ = "knowledge_bases"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    chunk_size: Mapped[int] = mapped_column(Integer, default=1000)
    chunk_overlap: Mapped[int] = mapped_column(Integer, default=200)
    embedding_model: Mapped[str] = mapped_column(String(255), default="nomic-embed-text")
    status: Mapped[str] = mapped_column(String(50), default="active")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )

    documents: Mapped[list["Document"]] = relationship(back_populates="knowledge_base", cascade="all, delete-orphan")
```

- [x] **Step 2: 撱箇? backend/app/models/document.py**

```python
import uuid
from datetime import datetime

from sqlalchemy import BigInteger, DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Document(Base):
    __tablename__ = "documents"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kb_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_bases.id", ondelete="CASCADE"))
    filename: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(50), nullable=False)
    file_size: Mapped[int] = mapped_column(BigInteger, nullable=False)
    chunk_count: Mapped[int] = mapped_column(Integer, default=0)
    status: Mapped[str] = mapped_column(String(50), default="processing")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    knowledge_base: Mapped["KnowledgeBase"] = relationship(back_populates="documents")
    chunks: Mapped[list["Chunk"]] = relationship(back_populates="document", cascade="all, delete-orphan")
```

- [x] **Step 3: 撱箇? backend/app/models/chunk.py**

```python
import uuid
from datetime import datetime

from pgvector.sqlalchemy import Vector
from sqlalchemy import DateTime, ForeignKey, Integer, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Chunk(Base):
    __tablename__ = "chunks"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    doc_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"))
    content: Mapped[str] = mapped_column(Text, nullable=False)
    embedding = mapped_column(Vector(768), nullable=True)  # nomic-embed-text ?身 768 蝬?    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship(back_populates="chunks")
```

- [x] **Step 4: 撱箇??園? models嚗rompt_template, api_endpoint, chat, ollama_model嚗?*

**backend/app/models/prompt_template.py:**
```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, Float, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class PromptTemplate(Base):
    __tablename__ = "prompt_templates"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    system_prompt: Mapped[str] = mapped_column(Text, nullable=False)
    user_prompt_template: Mapped[str] = mapped_column(Text, nullable=False, default="?寞?隞乩?鞈?????嚗n\n{context}\n\n??嚗question}")
    temperature: Mapped[float] = mapped_column(Float, default=0.7)
    is_default: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

**backend/app/models/api_endpoint.py:**
```python
import secrets
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ApiEndpoint(Base):
    __tablename__ = "api_endpoints"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    api_key: Mapped[str] = mapped_column(String(64), default=lambda: secrets.token_urlsafe(32))
    kb_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_bases.id"))
    prompt_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("prompt_templates.id"))
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    knowledge_base: Mapped["KnowledgeBase"] = relationship()
    prompt_template: Mapped["PromptTemplate"] = relationship()
```

**backend/app/models/chat.py:**
```python
import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, Text, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class ChatSession(Base):
    __tablename__ = "chat_sessions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    kb_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("knowledge_bases.id"))
    prompt_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("prompt_templates.id"), nullable=True)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())

    messages: Mapped[list["ChatMessage"]] = relationship(back_populates="session", cascade="all, delete-orphan")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    session_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("chat_sessions.id", ondelete="CASCADE"))
    role: Mapped[str] = mapped_column(String(20), nullable=False)  # "user" or "assistant"
    content: Mapped[str] = mapped_column(Text, nullable=False)
    sources: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    session: Mapped["ChatSession"] = relationship(back_populates="messages")
```

**backend/app/models/ollama_model.py:**
```python
import uuid
from datetime import datetime

from sqlalchemy import Boolean, DateTime, String, func
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database import Base


class OllamaModel(Base):
    __tablename__ = "ollama_models"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    model_name: Mapped[str] = mapped_column(String(255), nullable=False, unique=True)
    model_type: Mapped[str] = mapped_column(String(50), nullable=False)  # "llm" or "embed"
    parameters: Mapped[dict | None] = mapped_column(JSONB, nullable=True)
    is_available: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
```

- [x] **Step 5: 撱箇? backend/app/models/__init__.py**

```python
from app.models.api_endpoint import ApiEndpoint
from app.models.chat import ChatMessage, ChatSession
from app.models.chunk import Chunk
from app.models.document import Document
from app.models.knowledge_base import KnowledgeBase
from app.models.ollama_model import OllamaModel
from app.models.prompt_template import PromptTemplate

__all__ = [
    "ApiEndpoint",
    "ChatMessage",
    "ChatSession",
    "Chunk",
    "Document",
    "KnowledgeBase",
    "OllamaModel",
    "PromptTemplate",
]
```

- [x] **Step 6: ????Alembic**

```powershell
cd D:\workspace\playground\rag-chat\backend
uv run alembic init alembic
```

靽格 `alembic/env.py`嚗? `target_metadata` 閮剔 `Base.metadata`嚗蒂雿輻 async engine??
靽格 `alembic.ini`嚗? `sqlalchemy.url` 閮剔蝛綽??寧 `env.py` ??霈??`settings.database_url`??
- [x] **Step 7: ?Ｙ??? migration**

```powershell
uv run alembic revision --autogenerate -m "initial_tables"
```

- [x] **Step 8: ?? Postgres 銝血銵?migration**

```powershell
cd D:\workspace\playground\rag-chat
docker compose up postgres -d
cd backend
uv run alembic upgrade head
```

Expected: ???7 撘菔”撌脣遣蝡 `rag_platform` 鞈?摨思葉??
- [ ] **Step 9: Commit**

```powershell
git add .
git commit -m "feat: database models and initial migration for all 7 tables"
```

---

## Task 3: Pydantic Schemas

**Files:**
- Create: `backend/app/schemas/__init__.py`
- Create: `backend/app/schemas/knowledge_base.py`
- Create: `backend/app/schemas/document.py`
- Create: `backend/app/schemas/prompt_template.py`
- Create: `backend/app/schemas/api_endpoint.py`
- Create: `backend/app/schemas/chat.py`
- Create: `backend/app/schemas/model.py`

- [x] **Step 1: 撱箇????schemas**

**backend/app/schemas/knowledge_base.py:**
```python
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class KnowledgeBaseCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    description: str | None = None
    chunk_size: int = Field(default=1000, ge=100, le=10000)
    chunk_overlap: int = Field(default=200, ge=0, le=5000)
    embedding_model: str = "nomic-embed-text"


class KnowledgeBaseUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    chunk_size: int | None = Field(default=None, ge=100, le=10000)
    chunk_overlap: int | None = Field(default=None, ge=0, le=5000)
    embedding_model: str | None = None


class KnowledgeBaseResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None
    chunk_size: int
    chunk_overlap: int
    embedding_model: str
    status: str
    document_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

**backend/app/schemas/document.py:**
```python
import uuid
from datetime import datetime

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    id: uuid.UUID
    kb_id: uuid.UUID
    filename: str
    file_type: str
    file_size: int
    chunk_count: int
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}
```

**backend/app/schemas/prompt_template.py:**
```python
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class PromptTemplateCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    system_prompt: str
    user_prompt_template: str = "?寞?隞乩?鞈?????嚗n\n{context}\n\n??嚗question}"
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
```

**backend/app/schemas/api_endpoint.py:**
```python
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
```

**backend/app/schemas/chat.py:**
```python
import uuid
from datetime import datetime

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    message: str = Field(..., min_length=1)
    kb_id: uuid.UUID
    model_name: str = "llama3.2"
    prompt_id: uuid.UUID | None = None
    session_id: uuid.UUID | None = None


class ChatMessageResponse(BaseModel):
    id: uuid.UUID
    session_id: uuid.UUID
    role: str
    content: str
    sources: dict | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ChatSessionResponse(BaseModel):
    id: uuid.UUID
    kb_id: uuid.UUID
    prompt_id: uuid.UUID | None
    model_name: str
    message_count: int = 0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
```

**backend/app/schemas/model.py:**
```python
from pydantic import BaseModel


class ModelPullRequest(BaseModel):
    model_name: str


class ModelInfo(BaseModel):
    name: str
    size: int | None = None
    model_type: str = "llm"  # "llm" or "embed"
    modified_at: str | None = None
```

- [x] **Step 2: 撱箇? schemas/__init__.py ?臬?券**

- [ ] **Step 3: Commit**

```powershell
git add .
git commit -m "feat: pydantic schemas for all API endpoints"
```

---

## Task 4: ?亥?摨怎恣??API + ?辣?臬

**Files:**
- Create: `backend/app/core/ingestion.py`
- Create: `backend/app/core/embeddings.py`
- Create: `backend/app/services/knowledge_service.py`
- Create: `backend/app/api/knowledge.py`
- Create: `backend/tests/test_knowledge_api.py`
- Modify: `backend/app/main.py` ??閮餃? router

- [x] **Step 1: 撱箇? backend/app/core/embeddings.py**

```python
import ollama as ollama_client

from app.config import settings


async def generate_embeddings(texts: list[str], model: str | None = None) -> list[list[float]]:
    """雿輻 Ollama ?Ｙ????embedding ????""
    model = model or settings.ollama_embedding_model
    client = ollama_client.AsyncClient(host=settings.ollama_base_url)
    embeddings = []
    for text in texts:
        response = await client.embed(model=model, input=text)
        embeddings.append(response["embeddings"][0])
    return embeddings
```

- [x] **Step 2: 撱箇? backend/app/core/ingestion.py**

```python
from pathlib import Path

from docx import Document as DocxDoc
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader


def extract_text(file_path: str, file_type: str) -> str:
    """敺?獢葉?瑕?蝝?摮?""
    if file_type in (".txt", ".md", ".csv"):
        return Path(file_path).read_text(encoding="utf-8")
    elif file_type == ".pdf":
        reader = PdfReader(file_path)
        return "\n\n".join(page.extract_text() or "" for page in reader.pages)
    elif file_type == ".docx":
        doc = DocxDoc(file_path)
        return "\n\n".join(p.text for p in doc.paragraphs if p.text.strip())
    else:
        raise ValueError(f"Unsupported file type: {file_type}")


def split_text(text: str, chunk_size: int, chunk_overlap: int) -> list[str]:
    """撠??砍?? chunks??""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "??, "嚗?, "嚗?, " ", ""],
    )
    return splitter.split_text(text)
```

- [x] **Step 3: 撱箇? backend/app/services/knowledge_service.py**

撖虫??亥?摨?CRUD ??隞嗡??喲?頛荔??嚗?
- `list_knowledge_bases()` ???亥岷?券 KB嚗?撣嗆?隞嗆??- `create_knowledge_base(data)` ??撱箇? KB
- `get_knowledge_base(kb_id)` ?????桐? KB
- `update_knowledge_base(kb_id, data)` ???湔 KB
- `delete_knowledge_base(kb_id)` ???芷 KB ????隞?- `upload_document(kb_id, file)` ??銝?辣???摮??mbedding?摮?- `list_documents(kb_id)` ??? KB 銝??辣
- `delete_document(kb_id, doc_id)` ???芷?辣? chunks
- `reindex_document(kb_id, doc_id)` ???????embedding

瘥瘜蝙??`AsyncSession` ?脰???甇?DB ????
- [x] **Step 4: 撱箇? backend/app/api/knowledge.py ??Router**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.schemas.knowledge_base import (
    KnowledgeBaseCreate,
    KnowledgeBaseResponse,
    KnowledgeBaseUpdate,
)
from app.schemas.document import DocumentResponse
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/api/knowledge", tags=["knowledge"])


@router.get("", response_model=list[KnowledgeBaseResponse])
async def list_knowledge_bases(db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    return await service.list_knowledge_bases()


@router.post("", response_model=KnowledgeBaseResponse, status_code=201)
async def create_knowledge_base(data: KnowledgeBaseCreate, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    return await service.create_knowledge_base(data)


@router.get("/{kb_id}", response_model=KnowledgeBaseResponse)
async def get_knowledge_base(kb_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    kb = await service.get_knowledge_base(kb_id)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return kb


@router.put("/{kb_id}", response_model=KnowledgeBaseResponse)
async def update_knowledge_base(
    kb_id: uuid.UUID, data: KnowledgeBaseUpdate, db: AsyncSession = Depends(get_db)
):
    service = KnowledgeService(db)
    kb = await service.update_knowledge_base(kb_id, data)
    if not kb:
        raise HTTPException(status_code=404, detail="Knowledge base not found")
    return kb


@router.delete("/{kb_id}", status_code=204)
async def delete_knowledge_base(kb_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    await service.delete_knowledge_base(kb_id)


@router.post("/{kb_id}/upload", response_model=DocumentResponse, status_code=201)
async def upload_document(kb_id: uuid.UUID, file: UploadFile, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    return await service.upload_document(kb_id, file)


@router.get("/{kb_id}/documents", response_model=list[DocumentResponse])
async def list_documents(kb_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = KnowledgeService(db)
    return await service.list_documents(kb_id)


@router.delete("/{kb_id}/documents/{doc_id}", status_code=204)
async def delete_document(
    kb_id: uuid.UUID, doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    service = KnowledgeService(db)
    await service.delete_document(kb_id, doc_id)


@router.post("/{kb_id}/documents/{doc_id}/reindex", response_model=DocumentResponse)
async def reindex_document(
    kb_id: uuid.UUID, doc_id: uuid.UUID, db: AsyncSession = Depends(get_db)
):
    service = KnowledgeService(db)
    return await service.reindex_document(kb_id, doc_id)
```

- [x] **Step 5: ??main.py 閮餃? knowledge router**

??`app/main.py` ?嚗?```python
from app.api.knowledge import router as knowledge_router
app.include_router(knowledge_router)
```

- [x] **Step 6: 撖急葫閰虫蒂?瑁?**

Run: `uv run pytest tests/test_knowledge_api.py -v`
Expected: ??霅澈 CRUD ??隞嗡??單葫閰阡???
- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: knowledge base API with document upload, ingestion, and embedding"
```

---

## Task 5: ?予 API嚗SE 銝脫?嚗?
**Files:**
- Create: `backend/app/core/rag.py`
- Create: `backend/app/core/retrieval.py`
- Create: `backend/app/services/chat_service.py`
- Create: `backend/app/api/chat.py`
- Create: `backend/tests/test_chat_api.py`
- Modify: `backend/app/main.py` ??閮餃? router

- [x] **Step 1: 撱箇? backend/app/core/retrieval.py**

撖虫???瑼Ｙ揣?摩嚗?- `retrieve_relevant_chunks(db, kb_id, query_embedding, top_k=5)` ??雿輻 pgvector cosine similarity 敺?摰霅澈瑼Ｙ揣 Top-K chunks

```python
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.chunk import Chunk
from app.models.document import Document


async def retrieve_relevant_chunks(
    db: AsyncSession,
    kb_id,
    query_embedding: list[float],
    top_k: int = 5,
) -> list[dict]:
    """敺霅澈瑼Ｙ揣??賊???chunks??""
    embedding_str = "[" + ",".join(str(x) for x in query_embedding) + "]"

    stmt = (
        select(
            Chunk.id,
            Chunk.content,
            Chunk.chunk_index,
            Chunk.metadata_,
            Document.filename,
            (1 - Chunk.embedding.cosine_distance(embedding_str)).label("relevance_score"),
        )
        .join(Document, Chunk.doc_id == Document.id)
        .where(Document.kb_id == kb_id)
        .where(Chunk.embedding.isnot(None))
        .order_by(Chunk.embedding.cosine_distance(embedding_str))
        .limit(top_k)
    )

    result = await db.execute(stmt)
    rows = result.all()

    return [
        {
            "chunk_id": str(row.id),
            "content": row.content,
            "chunk_index": row.chunk_index,
            "metadata": row.metadata_,
            "filename": row.filename,
            "relevance_score": float(row.relevance_score) if row.relevance_score else 0.0,
        }
        for row in rows
    ]
```

- [x] **Step 2: 撱箇? backend/app/core/rag.py**

撖虫? RAG pipeline ?詨??摩嚗?- `build_rag_prompt(system_prompt, user_template, context_chunks, question, chat_history)` ??蝯?摰 prompt
- `stream_rag_response(db, request)` ??摰??RAG 瘚?嚗????亥岷 ??瑼Ｙ揣 ??蝯? prompt ??Ollama 銝脫???嚗?
- [x] **Step 3: 撱箇? backend/app/api/chat.py ????SSE 銝脫?**

```python
import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sse_starlette.sse import EventSourceResponse

from app.database import get_db
from app.schemas.chat import ChatRequest, ChatMessageResponse, ChatSessionResponse
from app.services.chat_service import ChatService

router = APIRouter(prefix="/api/chat", tags=["chat"])


@router.post("")
async def send_message(request: ChatRequest, db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    return EventSourceResponse(service.stream_response(request))


@router.get("/sessions", response_model=list[ChatSessionResponse])
async def list_sessions(db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    return await service.list_sessions()


@router.get("/sessions/{session_id}/messages", response_model=list[ChatMessageResponse])
async def get_messages(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    return await service.get_messages(session_id)


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(session_id: uuid.UUID, db: AsyncSession = Depends(get_db)):
    service = ChatService(db)
    await service.delete_session(session_id)
```

- [x] **Step 4: ??main.py 閮餃? chat router**

- [x] **Step 5: 皜祈岫 SSE 銝脫?**

Run: `uv run pytest tests/test_chat_api.py -v`
Expected: ?予 API 皜祈岫??嚗 SSE 銝脫???撽???
- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat: chat API with RAG pipeline and SSE streaming"
```

---

## Task 6: API 蝡舫?蝞∠?

**Files:**
- Create: `backend/app/services/endpoint_service.py`
- Create: `backend/app/api/endpoints.py`
- Create: `backend/tests/test_endpoints_api.py`
- Modify: `backend/app/main.py` ??閮餃? router

- [x] **Step 1: 撱箇? endpoint_service.py**

撖虫? API 蝡舫? CRUD + ?亥岷?摩嚗?- `list_endpoints()` ????券蝡舫?
- `create_endpoint(data)` ??撱箇?蝡舫?嚗???API Key嚗?- `query_endpoint(endpoint_id, question, api_key)` ??撽? API Key嚗銵?RAG ?亥岷
- `regenerate_key(endpoint_id)` ????Ｙ? API Key

- [x] **Step 2: 撱箇? backend/app/api/endpoints.py ??Router**

? 4 ?垢暺?GET list, POST create, POST query, POST regenerate-key

- [ ] **Step 3: ??main.py 閮餃? router嚗葫閰佗?Commit**

```powershell
git add .
git commit -m "feat: API endpoint management with key-based authentication"
```

---

## Task 7: 璅∪?蝞∠? + Prompt 璅⊥ API

**Files:**
- Create: `backend/app/services/model_service.py`
- Create: `backend/app/api/models.py`
- Create: `backend/app/services/prompt_service.py`
- Create: `backend/app/api/prompts.py`
- Create: `backend/tests/test_models_api.py`
- Create: `backend/tests/test_prompts_api.py`
- Modify: `backend/app/main.py` ??閮餃? routers

- [x] **Step 1: 撱箇? model_service.py**

```python
import ollama as ollama_client

from app.config import settings


class ModelService:
    def __init__(self):
        self.client = ollama_client.AsyncClient(host=settings.ollama_base_url)

    async def list_models(self) -> list[dict]:
        """? Ollama ?砍?舐?芋??""
        response = await self.client.list()
        return [
            {
                "name": m["name"],
                "size": m.get("size"),
                "modified_at": m.get("modified_at"),
                "model_type": "embed" if "embed" in m["name"].lower() else "llm",
            }
            for m in response.get("models", [])
        ]

    async def pull_model(self, model_name: str):
        """???唳芋??generator 銝脫??脣漲嚗?""
        async for progress in await self.client.pull(model_name, stream=True):
            yield progress

    async def delete_model(self, model_name: str):
        """?芷?砍璅∪???""
        await self.client.delete(model_name)
```

- [x] **Step 2: 撱箇? backend/app/api/models.py**

- [x] **Step 3: 撱箇? prompt_service.py ??CRUD ??**

- [x] **Step 4: 撱箇? backend/app/api/prompts.py**

- [ ] **Step 5: ??main.py 閮餃??拙?router嚗葫閰佗?Commit**

```powershell
git add .
git commit -m "feat: model management and prompt template CRUD APIs"
```

---

## Task 8: ?垢撉冽?⊥????惜?亦?

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/providers.tsx`
- Create: `frontend/src/lib/api.ts`
- Create: `frontend/src/lib/query-client.ts`
- Create: `frontend/src/components/layout/dashboard-shell.tsx`
- Modify: `frontend/src/components/layout/app-sidebar.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/knowledge/page.tsx`
- Modify: `frontend/src/app/prompts/page.tsx`
- Create: `frontend/src/stores/`
- Create: `frontend/src/test/setup.ts`

- [x] **Step 1: ?日?銝虫????蝡舫爸??*

蝣箄? `frontend/` ?Ｘ????隞嗥??箇?嚗???楛??dashboard / chat shell 憸冽嚗?? scaffold Next.js 撠?嚗???擐? `/` ?擃?閮瑽?
- [x] **Step 2: 鋆??垢鞈?撅支?鞈?*

```powershell
cd frontend
npm install @tanstack/react-query zustand
```

- [x] **Step 3: 撱箇? providers ??query client**

撱箇? `frontend/src/app/providers.tsx` ??`frontend/src/lib/query-client.ts`嚗 `layout.tsx` ? React Query provider嚗?擐? `/`?/knowledge`?/prompts` ??蝥??Ｗ隞亙?典翰???航炊????
- [x] **Step 4: 撱箇? API client (frontend/src/lib/api.ts)**

雿輻 `fetch` 撠????蝡?API ?澆??client嚗??恬?
- `knowledgeApi` ???亥?摨?CRUD + ?辣銝
- `chatApi` ???予嚗 SSE 銝脫?閫??嚗?- `endpointApi` ??API 蝡舫?蝞∠?
- `modelApi` ??璅∪?蝞∠?
- `promptApi` ??Prompt 璅⊥ CRUD

- [x] **Step 5: 撱箇??梁 dashboard shell嚗???ａ?銴?撅**

?賢 `frontend/src/components/layout/dashboard-shell.tsx`嚗??暹?擐? `/`?/knowledge`?/prompts` ?臭誑?梁 Sidebar + content shell嚗??????閬死憸冽??閬賡?蝵柴?
- [x] **Step 6: 鋆? client state ?葫閰血蝺?*

撱箇? `frontend/src/stores/` 銝??箇? store嚗?憒???璅∪??rompt?霅澈??憭?session UI state嚗?銝西?銝?`frontend/src/test/setup.ts`嚗? Vitest 閮剖??舀迤撣詨銵?
- [x] **Step 7: 霈???ａ脣?舀鞈????*

隤踵 `/`?/knowledge`?/prompts` ?嚗??桀???mock ??亙?梁 shell嚗蒂鋆? loading / empty / error ???鞈???嚗迨?挾銝?摰??券 CRUD嚗?閬??????亙皞???
- [x] **Step 8: 撽??垢撉冽???惜?亦?**

Run: `npm run dev`
Expected: `http://localhost:3000` 憿舐內擐? `/` ?予?亙??Sidebar 撠嚗/knowledge`?/prompts` ?舀迤撣賊脣嚗itest 銝??撩撠?`src/test/setup.ts` 憭望???
- [ ] **Step 9: Commit**

```powershell
git add .
git commit -m "feat: wire frontend data layer onto existing UI shell"
```

---

## Task 9: ?垢?????
**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/knowledge/page.tsx`
- Modify: `frontend/src/app/prompts/page.tsx`
- Create: `frontend/src/app/endpoints/page.tsx`
- Create: `frontend/src/app/models/page.tsx`
- Create: ???Ｙ?摮?隞?
- [x] **Step 1: 擐? `/` ?予撌乩?????*

?嚗?- 撌血甇瑕撠店?”?亙 chat sessions API
- 銝餃?閰勗?憿舐內閮瘞?部??markdown 皜脫?
- ?璅∪? / Prompt / ?亥?摨恍??亙撖阡?鞈?
- 摨頛詨獢葡??`/api/chat` SSE 銝脫?
- 憿舐內靘?撘?葉??/ 蝛箇霅澈?航炊??

- [x] **Step 2: ?亥?摨怎恣????*

?嚗?- ?亥?摨怠?銵刻???
- 撱箇??亥?摨怠?閰望?嚗身摰?蝔晞hunk_size?hunk_overlap?mbedding_model嚗?- ?辣?”???喋?扎??啁揣撘?- 憿舐內 ready / indexing / error ???
- [x] **Step 3: Prompt 璅⊥?**

?嚗?- 璅⊥?”??撠?- 撱箇? / 蝺刻摩璅⊥
- system prompt 蝺刻摩??+ user prompt template + temperature slider
- 憿舐內 `{context}`?{question}` 雿?蝚西牧?? default template ???
- [x] **Step 4: API 蝡舫?蝞∠??**

?嚗?- 蝡舫??”嚗?耦撘?憿舐內?迂?PI Key????
- 撱箇?蝡舫?撠店獢??豢??亥?摨怒rompt 璅⊥?芋??
- API Key 銴ˊ??
- 雿輻蝭?蝔?蝣潮＊蝷綽?curl嚗?
- [x] **Step 5: 璅∪?蝞∠??**

?嚗?- Ollama 璅∪??”嚗＊蝷箏?蝔晞之撠???
- ???唳芋??頛詨璅∪??迂 + ?脣漲璇?
- ?芷璅∪?

- [x] **Step 6: ?券??Ｗ??賡?霅?*

?函汗?其葉??皜祈岫擐? `/`?/knowledge`?/prompts`?/models`?/endpoints` ??CRUD ??????拍???Ｚ? Vitest 皜祈岫嚗撠項??API helper????UI state ????蝔?
- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: complete frontend functionality on existing chat-first shell"
```

---

## Task 10: Docker ?函蔡??蝯?霅?
**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Modify: `docker-compose.yml` ???蝯矽??- Create: `README.md` ??摰?辣

- [x] **Step 1: 撱箇? backend/Dockerfile**

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /usr/local/bin/uv

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-dev

COPY . .

EXPOSE 8000
CMD ["uv", "run", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

- [x] **Step 2: 撱箇? frontend/Dockerfile**

```dockerfile
FROM node:20-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

- [x] **Step 3: ?冽???Docker Compose ??皜祈岫**

```powershell
cd D:\workspace\playground\rag-chat
docker compose up --build
```

Expected: 4 ????典???`http://localhost:3000` 憿舐內?垢嚗http://localhost:8000/api/health` 餈? OK??
- [ ] **Step 4: 蝡臬?蝡臬??賣葫閰?*

1. ?冽芋?恣???ＹⅡ隤?Ollama 璅∪??舐嚗?閬??? llama3.2 ??nomic-embed-text嚗?2. 撱箇??亥?摨恬?閮剖? chunk_size=1000, overlap=200嚗?3. 銝銝?葫閰?.txt ?辣
4. ?券???`/` ?予??府?亥?摨恬??潮?憿?蝣箄? SSE 銝脫???甇?虜
5. 撱箇? API 蝡舫?嚗蝙??curl ?澆?亥岷 API

- [x] **Step 5: ?啣神 README.md**

?嚗?獢?蝝嫘??賣??柴翰??憪????潭??PI ?辣?????銵ㄖ隤芣???
- [ ] **Step 6: Final Commit**

```powershell
git add .
git commit -m "feat: docker deployment, README, and final integration"
```

---

## 撽?閮??

| Task | 撽??孵? |
|------|---------|
| Task 1 | `GET /api/health` 餈? 200 |
| Task 2 | Alembic migration ??嚗? 撘菔”撌脣遣蝡?|
| Task 3 | Schema ?臬?⊿隤?|
| Task 4 | ?亥?摨?CRUD + ?辣銝皜祈岫?? |
| Task 5 | ?予 SSE 銝脫?皜祈岫?? |
| Task 6 | API 蝡舫??亥岷 + Key 撽?皜祈岫?? |
| Task 7 | 璅∪??” + Prompt CRUD 皜祈岫?? |
| Task 8 | ?Ｘ??垢撉冽撌脫銝?API client / providers / store嚗???`/` ????Ｗ甇?虜撠????|
| Task 9 | 擐? `/`?/knowledge`?/prompts`?/models`?/endpoints` ?????霅? |
| Task 10 | Docker Compose ?冽?????+ 蝡臬?蝡舀葫閰阡? |




