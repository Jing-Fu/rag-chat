# RAG Chat Platform

Self-hosted, local-first RAG developer platform MVP.

## Stack

- Frontend: Next.js 14 + TypeScript + React Query + Zustand
- Backend: FastAPI + SQLAlchemy + Alembic
- Data: PostgreSQL 16 + pgvector
- LLM/Embedding: Ollama

## Monorepo

- `frontend/`: Web UI (`/`, `/knowledge`, `/prompts`, `/models`, `/endpoints`)
- `backend/`: REST/SSE API and RAG pipeline
- `docs/`: Product and implementation specs

## API Groups

- `/api/health`
- `/api/knowledge`
- `/api/chat` (SSE streaming)
- `/api/endpoints`
- `/api/models`
- `/api/prompts`

## Prerequisites

- Docker + Docker Compose
- (Local dev) Python 3.12 + `uv`
- (Local dev) Node.js 20+

## Quick Start (Docker Compose)

1. Copy environment template:

```powershell
cp .env.example .env
```

2. Build and start all services:

```powershell
docker compose up --build
```

Optional: if your machine has Docker GPU passthrough configured for Ollama, start with the GPU override:

```powershell
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build -d
```

3. Access services:

- Frontend: [http://localhost:3000](http://localhost:3000)
- Backend health: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- Ollama API: [http://localhost:11434](http://localhost:11434)

Local development also supports opening the frontend from [http://127.0.0.1:3000](http://127.0.0.1:3000). When `NEXT_PUBLIC_API_URL` is unset, the frontend now derives the backend host from the current browser hostname and targets port `8000`.

4. (First run) pull required Ollama models:

```powershell
docker compose exec ollama ollama pull llama3.2
docker compose exec ollama ollama pull nomic-embed-text
```

## Ollama GPU Mode

Use [docker-compose.gpu.yml](docker-compose.gpu.yml) as an override when you want Ollama to run with NVIDIA GPU access.

Requirements:

- Windows: Docker Desktop with WSL2 GPU support enabled and a working NVIDIA driver on the host
- Linux: NVIDIA driver + `nvidia-container-toolkit`
- Docker must support `--gpus` / Compose `gpus: all`

Start the stack in GPU mode:

```powershell
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build -d
```

Verify Ollama is actually using GPU instead of CPU:

```powershell
docker compose -f docker-compose.yml -f docker-compose.gpu.yml logs ollama --tail 50
```

If GPU is active, Ollama logs should mention a detected GPU device instead of CPU-only inference.

## Local Development

### Backend

```powershell
cd backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```powershell
cd frontend
npm install
npm run dev
```

## Testing

### Backend

```powershell
cd backend
uv run pytest -q
```

### Frontend

```powershell
cd frontend
npm run test
npm run build
```

## Docker Images

- `backend/Dockerfile`: Python 3.12 + `uv`, runs `uvicorn app.main:app`
- `frontend/Dockerfile`: Next.js standalone production image

## Notes

- The app is local-first and does not include authentication or multi-tenant features in MVP.
- Chat and model operations depend on Ollama availability.
- File uploads are validated by backend type/size constraints.
