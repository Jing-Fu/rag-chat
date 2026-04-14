# RAG Chat

Self-hosted, local-first RAG developer platform MVP.

## Structure

- `frontend/`: Next.js 14 UI shell
- `backend/`: FastAPI backend scaffold
- `docs/`: design spec and implementation plan

## Backend Quick Start

1. Install Python 3.12 and `uv`.
2. Copy `.env.example` to `.env` if you need local overrides.
3. Install backend dependencies:

```powershell
cd backend
uv sync --extra dev
```

4. Start the API:

```powershell
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000
```

5. Verify health:

```text
GET http://localhost:8000/api/health
```

Expected response:

```json
{"status":"ok"}
```

## Infrastructure

- PostgreSQL 16 + pgvector
- Ollama
- Docker Compose orchestration scaffold in `docker-compose.yml`

## Status

Task 1 scaffolds the backend runtime, configuration, and compose definition. API routes, models, migrations, and RAG workflows are still pending the later tasks in `docs/implementation-plan.md`.
