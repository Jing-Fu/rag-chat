# RAG 智慧問答開發者平台 — 實作計畫

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 建立一個 Self-hosted 的 RAG 開發者工具平台，讓開發者能快速建立、管理和部署 RAG 智慧問答應用。

**Architecture:** 前後端分離 — Next.js 14 純前端 + FastAPI 模組化後端，PostgreSQL + pgvector 做資料與向量儲存，Ollama 做本地 LLM。Monorepo 結構（`frontend/` + `backend/`）。

**Tech Stack:** Python 3.12, FastAPI, SQLAlchemy 2.0, Alembic, pgvector, LangChain, Ollama SDK, Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, React Query, Zustand, Docker Compose

**Design Spec:** [design-spec.md](file:///D:/workspace/playground/rag-chat/docs/design-spec.md)

**Current Frontend Baseline:** `frontend/` 已存在，且目前包含首頁 `/` 聊天入口、`/knowledge`、`/prompts` 的靜態 UI 骨架，以及 `AppSidebar`、`ChatHeader`、`ChatInput` 等共用元件。前端任務應在此基線上補齊資料層與功能，不重新初始化專案。

---

## Task 1: 專案初始化與基礎設施

**Files:**
- Create: `backend/pyproject.toml`
- Create: `backend/app/__init__.py`
- Create: `backend/app/main.py`
- Create: `backend/app/config.py`
- Create: `backend/app/database.py`
- Create: `.env.example`
- Create: `docker-compose.yml`
- Create: `README.md`

- [x] **Step 1: 建立 Monorepo 根目錄**

```powershell
New-Item -ItemType Directory -Force -Path "D:\workspace\playground\rag-chat\backend\app"
```

- [x] **Step 2: 建立 backend/pyproject.toml**

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

- [x] **Step 3: 建立 backend/app/config.py**

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

- [x] **Step 4: 建立 backend/app/database.py**

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

- [x] **Step 5: 建立 backend/app/main.py**

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
    description="RAG 智慧問答開發者平台 API",
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

- [x] **Step 6: 建立 .env.example**

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

- [x] **Step 7: 建立 docker-compose.yml**

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

- [x] **Step 8: 安裝依賴並驗證啟動**

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

## Task 2: 資料庫模型與 Migration

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

- [ ] **Step 1: 建立 backend/app/models/knowledge_base.py**

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

- [ ] **Step 2: 建立 backend/app/models/document.py**

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

- [ ] **Step 3: 建立 backend/app/models/chunk.py**

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
    embedding = mapped_column(Vector(768), nullable=True)  # nomic-embed-text 預設 768 維
    metadata_: Mapped[dict | None] = mapped_column("metadata", JSONB, nullable=True)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    document: Mapped["Document"] = relationship(back_populates="chunks")
```

- [ ] **Step 4: 建立其餘 models（prompt_template, api_endpoint, chat, ollama_model）**

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
    user_prompt_template: Mapped[str] = mapped_column(Text, nullable=False, default="根據以下資料回答問題：\n\n{context}\n\n問題：{question}")
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

- [ ] **Step 5: 建立 backend/app/models/__init__.py**

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

- [ ] **Step 6: 初始化 Alembic**

```powershell
cd D:\workspace\playground\rag-chat\backend
uv run alembic init alembic
```

修改 `alembic/env.py`，將 `target_metadata` 設為 `Base.metadata`，並使用 async engine。

修改 `alembic.ini`，將 `sqlalchemy.url` 設為空，改由 `env.py` 動態讀取 `settings.database_url`。

- [ ] **Step 7: 產生初始 migration**

```powershell
uv run alembic revision --autogenerate -m "initial_tables"
```

- [ ] **Step 8: 啟動 Postgres 並執行 migration**

```powershell
cd D:\workspace\playground\rag-chat
docker compose up postgres -d
cd backend
uv run alembic upgrade head
```

Expected: 所有 7 張表已建立在 `rag_platform` 資料庫中。

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

- [ ] **Step 1: 建立所有 schemas**

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

- [ ] **Step 2: 建立 schemas/__init__.py 匯出全部**

- [ ] **Step 3: Commit**

```powershell
git add .
git commit -m "feat: pydantic schemas for all API endpoints"
```

---

## Task 4: 知識庫管理 API + 文件匯入

**Files:**
- Create: `backend/app/core/ingestion.py`
- Create: `backend/app/core/embeddings.py`
- Create: `backend/app/services/knowledge_service.py`
- Create: `backend/app/api/knowledge.py`
- Create: `backend/tests/test_knowledge_api.py`
- Modify: `backend/app/main.py` — 註冊 router

- [ ] **Step 1: 建立 backend/app/core/embeddings.py**

```python
import ollama as ollama_client

from app.config import settings


async def generate_embeddings(texts: list[str], model: str | None = None) -> list[list[float]]:
    """使用 Ollama 產生文本的 embedding 向量。"""
    model = model or settings.ollama_embedding_model
    client = ollama_client.AsyncClient(host=settings.ollama_base_url)
    embeddings = []
    for text in texts:
        response = await client.embed(model=model, input=text)
        embeddings.append(response["embeddings"][0])
    return embeddings
```

- [ ] **Step 2: 建立 backend/app/core/ingestion.py**

```python
from pathlib import Path

from docx import Document as DocxDoc
from langchain_text_splitters import RecursiveCharacterTextSplitter
from pypdf import PdfReader


def extract_text(file_path: str, file_type: str) -> str:
    """從檔案中擷取純文字。"""
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
    """將文本切分為 chunks。"""
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", "。", "！", "？", " ", ""],
    )
    return splitter.split_text(text)
```

- [ ] **Step 3: 建立 backend/app/services/knowledge_service.py**

實作知識庫 CRUD 和文件上傳邏輯，包含：

- `list_knowledge_bases()` — 查詢全部 KB，附帶文件數量
- `create_knowledge_base(data)` — 建立 KB
- `get_knowledge_base(kb_id)` — 取得單一 KB
- `update_knowledge_base(kb_id, data)` — 更新 KB
- `delete_knowledge_base(kb_id)` — 刪除 KB 及其所有文件
- `upload_document(kb_id, file)` — 上傳文件、擷取文字、切分、embedding、儲存
- `list_documents(kb_id)` — 列出 KB 下的文件
- `delete_document(kb_id, doc_id)` — 刪除文件及其 chunks
- `reindex_document(kb_id, doc_id)` — 重新切分和 embedding

每個方法使用 `AsyncSession` 進行非同步 DB 操作。

- [ ] **Step 4: 建立 backend/app/api/knowledge.py — Router**

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

- [ ] **Step 5: 在 main.py 註冊 knowledge router**

在 `app/main.py` 加入：
```python
from app.api.knowledge import router as knowledge_router
app.include_router(knowledge_router)
```

- [ ] **Step 6: 寫測試並執行**

Run: `uv run pytest tests/test_knowledge_api.py -v`
Expected: 所有知識庫 CRUD 和文件上傳測試通過。

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: knowledge base API with document upload, ingestion, and embedding"
```

---

## Task 5: 聊天 API（SSE 串流）

**Files:**
- Create: `backend/app/core/rag.py`
- Create: `backend/app/core/retrieval.py`
- Create: `backend/app/services/chat_service.py`
- Create: `backend/app/api/chat.py`
- Create: `backend/tests/test_chat_api.py`
- Modify: `backend/app/main.py` — 註冊 router

- [ ] **Step 1: 建立 backend/app/core/retrieval.py**

實作向量檢索邏輯：
- `retrieve_relevant_chunks(db, kb_id, query_embedding, top_k=5)` — 使用 pgvector cosine similarity 從指定知識庫檢索 Top-K chunks

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
    """從知識庫檢索最相關的 chunks。"""
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

- [ ] **Step 2: 建立 backend/app/core/rag.py**

實作 RAG pipeline 核心邏輯：
- `build_rag_prompt(system_prompt, user_template, context_chunks, question, chat_history)` — 組裝完整 prompt
- `stream_rag_response(db, request)` — 完整的 RAG 流程（向量化查詢 → 檢索 → 組裝 prompt → Ollama 串流生成）

- [ ] **Step 3: 建立 backend/app/api/chat.py — 含 SSE 串流**

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

- [ ] **Step 4: 在 main.py 註冊 chat router**

- [ ] **Step 5: 測試 SSE 串流**

Run: `uv run pytest tests/test_chat_api.py -v`
Expected: 聊天 API 測試通過，含 SSE 串流回應驗證。

- [ ] **Step 6: Commit**

```powershell
git add .
git commit -m "feat: chat API with RAG pipeline and SSE streaming"
```

---

## Task 6: API 端點管理

**Files:**
- Create: `backend/app/services/endpoint_service.py`
- Create: `backend/app/api/endpoints.py`
- Create: `backend/tests/test_endpoints_api.py`
- Modify: `backend/app/main.py` — 註冊 router

- [ ] **Step 1: 建立 endpoint_service.py**

實作 API 端點 CRUD + 查詢邏輯：
- `list_endpoints()` — 列出全部端點
- `create_endpoint(data)` — 建立端點（自動產生 API Key）
- `query_endpoint(endpoint_id, question, api_key)` — 驗證 API Key，執行 RAG 查詢
- `regenerate_key(endpoint_id)` — 重新產生 API Key

- [ ] **Step 2: 建立 backend/app/api/endpoints.py — Router**

包含 4 個端點：GET list, POST create, POST query, POST regenerate-key

- [ ] **Step 3: 在 main.py 註冊 router，測試，Commit**

```powershell
git add .
git commit -m "feat: API endpoint management with key-based authentication"
```

---

## Task 7: 模型管理 + Prompt 模板 API

**Files:**
- Create: `backend/app/services/model_service.py`
- Create: `backend/app/api/models.py`
- Create: `backend/app/services/prompt_service.py`
- Create: `backend/app/api/prompts.py`
- Create: `backend/tests/test_models_api.py`
- Create: `backend/tests/test_prompts_api.py`
- Modify: `backend/app/main.py` — 註冊 routers

- [ ] **Step 1: 建立 model_service.py**

```python
import ollama as ollama_client

from app.config import settings


class ModelService:
    def __init__(self):
        self.client = ollama_client.AsyncClient(host=settings.ollama_base_url)

    async def list_models(self) -> list[dict]:
        """列出 Ollama 本地可用的模型。"""
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
        """拉取新模型（generator 串流進度）。"""
        async for progress in await self.client.pull(model_name, stream=True):
            yield progress

    async def delete_model(self, model_name: str):
        """刪除本地模型。"""
        await self.client.delete(model_name)
```

- [ ] **Step 2: 建立 backend/app/api/models.py**

- [ ] **Step 3: 建立 prompt_service.py — CRUD 操作**

- [ ] **Step 4: 建立 backend/app/api/prompts.py**

- [ ] **Step 5: 在 main.py 註冊兩個 router，測試，Commit**

```powershell
git add .
git commit -m "feat: model management and prompt template CRUD APIs"
```

---

## Task 8: 前端骨架校準與資料層接線

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

- [ ] **Step 1: 盤點並保留既有前端骨架**

確認 `frontend/` 既有頁面與元件為開發基線，保留現有深色 dashboard / chat shell 風格，不重新 scaffold Next.js 專案，不重做首頁 `/` 的整體資訊架構。

- [ ] **Step 2: 補齊前端資料層依賴**

```powershell
cd frontend
npm install @tanstack/react-query zustand
```

- [ ] **Step 3: 建立 providers 與 query client**

建立 `frontend/src/app/providers.tsx` 與 `frontend/src/lib/query-client.ts`，在 `layout.tsx` 掛入 React Query provider，讓首頁 `/`、`/knowledge`、`/prompts` 與後續頁面可以共用快取與錯誤邊界。

- [ ] **Step 4: 建立 API client (frontend/src/lib/api.ts)**

使用 `fetch` 封裝所有後端 API 呼叫的 client，包含：
- `knowledgeApi` — 知識庫 CRUD + 文件上傳
- `chatApi` — 聊天（含 SSE 串流解析）
- `endpointApi` — API 端點管理
- `modelApi` — 模型管理
- `promptApi` — Prompt 模板 CRUD

- [ ] **Step 5: 建立共用 dashboard shell，避免頁面重複佈局**

抽出 `frontend/src/components/layout/dashboard-shell.tsx`，讓現有首頁 `/`、`/knowledge`、`/prompts` 可以共用 Sidebar + content shell，同時保留目前的視覺風格與導覽配置。

- [ ] **Step 6: 補齊 client state 與測試基線**

建立 `frontend/src/stores/` 下的基礎 store（例如目前選取的模型、Prompt、知識庫、聊天 session UI state），並補上 `frontend/src/test/setup.ts`，讓 Vitest 設定可正常執行。

- [ ] **Step 7: 讓既有頁面進入可接資料狀態**

調整 `/`、`/knowledge`、`/prompts` 頁面，將目前的 mock 版面接到共用 shell，並補上 loading / empty / error 狀態的資料邊界；此階段不必完成全部 CRUD，但要完成資料流接入準備。

- [ ] **Step 8: 驗證前端骨架與資料層接線**

Run: `npm run dev`
Expected: `http://localhost:3000` 顯示首頁 `/` 聊天入口與 Sidebar 導航，`/knowledge`、`/prompts` 可正常進入，Vitest 不再因缺少 `src/test/setup.ts` 失敗。

- [ ] **Step 9: Commit**

```powershell
git add .
git commit -m "feat: wire frontend data layer onto existing UI shell"
```

---

## Task 9: 前端功能頁完成

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/knowledge/page.tsx`
- Modify: `frontend/src/app/prompts/page.tsx`
- Create: `frontend/src/app/endpoints/page.tsx`
- Create: `frontend/src/app/models/page.tsx`
- Create: 各頁面的子元件

- [ ] **Step 1: 首頁 `/` 聊天工作區功能化**

功能：
- 左側歷史對話列表接入 chat sessions API
- 主對話區顯示訊息氣泡與 markdown 渲染
- 頂部模型 / Prompt / 知識庫選擇器接入實際資料
- 底部輸入框串接 `/api/chat` SSE 串流
- 顯示來源引用與中斷 / 空知識庫錯誤處理

- [ ] **Step 2: 知識庫管理頁面**

功能：
- 知識庫列表與搜尋
- 建立知識庫對話框（設定名稱、chunk_size、chunk_overlap、embedding_model）
- 文件列表、上傳、刪除、重新索引
- 顯示 ready / indexing / error 狀態

- [ ] **Step 3: Prompt 模板頁面**

功能：
- 模板列表與搜尋
- 建立 / 編輯模板
- system prompt 編輯器 + user prompt template + temperature slider
- 顯示 `{context}`、`{question}` 佔位符說明與 default template 狀態

- [ ] **Step 4: API 端點管理頁面**

功能：
- 端點列表（卡片形式，顯示名稱、API Key、狀態）
- 建立端點對話框（選擇知識庫、Prompt 模板、模型）
- API Key 複製按鈕
- 使用範例程式碼顯示（curl）

- [ ] **Step 5: 模型管理頁面**

功能：
- Ollama 模型列表（顯示名稱、大小、類型）
- 拉取新模型（輸入模型名稱 + 進度條）
- 刪除模型

- [ ] **Step 6: 全頁面功能驗證**

在瀏覽器中逐一測試首頁 `/`、`/knowledge`、`/prompts`、`/models`、`/endpoints` 的 CRUD 功能與互動；適用的頁面補 Vitest 測試，至少涵蓋 API helper、關鍵 UI state 與互動流程。

- [ ] **Step 7: Commit**

```powershell
git add .
git commit -m "feat: complete frontend functionality on existing chat-first shell"
```

---

## Task 10: Docker 部署與最終驗證

**Files:**
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`
- Modify: `docker-compose.yml` — 最終調整
- Create: `README.md` — 完整文件

- [ ] **Step 1: 建立 backend/Dockerfile**

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

- [ ] **Step 2: 建立 frontend/Dockerfile**

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

- [ ] **Step 3: 全服務 Docker Compose 啟動測試**

```powershell
cd D:\workspace\playground\rag-chat
docker compose up --build
```

Expected: 4 個服務全部啟動，`http://localhost:3000` 顯示前端，`http://localhost:8000/api/health` 返回 OK。

- [ ] **Step 4: 端對端功能測試**

1. 在模型管理頁面確認 Ollama 模型可用（必要時拉取 llama3.2 和 nomic-embed-text）
2. 建立知識庫（設定 chunk_size=1000, overlap=200）
3. 上傳一個測試 .txt 文件
4. 在首頁 `/` 聊天頁選擇該知識庫，發送問題，確認 SSE 串流回應正常
5. 建立 API 端點，使用 curl 呼叫查詢 API

- [ ] **Step 5: 撰寫 README.md**

包含：專案介紹、功能清單、快速開始指南、開發指南、API 文件連結、技術棧說明。

- [ ] **Step 6: Final Commit**

```powershell
git add .
git commit -m "feat: docker deployment, README, and final integration"
```

---

## 驗證計畫摘要

| Task | 驗證方式 |
|------|---------|
| Task 1 | `GET /api/health` 返回 200 |
| Task 2 | Alembic migration 成功，7 張表已建立 |
| Task 3 | Schema 匯入無錯誤 |
| Task 4 | 知識庫 CRUD + 文件上傳測試通過 |
| Task 5 | 聊天 SSE 串流測試通過 |
| Task 6 | API 端點查詢 + Key 驗證測試通過 |
| Task 7 | 模型列表 + Prompt CRUD 測試通過 |
| Task 8 | 既有前端骨架已接上 API client / providers / store，首頁 `/` 與現有頁面可正常導航與載入 |
| Task 9 | 首頁 `/`、`/knowledge`、`/prompts`、`/models`、`/endpoints` 功能與手動驗證通過 |
| Task 10 | Docker Compose 全服務啟動 + 端對端測試通過 |
