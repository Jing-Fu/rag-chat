<div align="center">

<img src="./frontend/src/app/favicon.ico" alt="RAG Chat Platform icon" width="72" height="72" />

# RAG Chat Platform

本機優先的自架 RAG 工作區，結合 Next.js、FastAPI、PostgreSQL + pgvector 與 Ollama，讓你可以匯入文件、建立知識庫，並用本機模型做可追溯的問答與 API 查詢。

<p>
	<img src="https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=next.js" alt="Next.js 14" />
	<img src="https://img.shields.io/badge/FastAPI-0.115-009688?style=flat-square&logo=fastapi&logoColor=white" alt="FastAPI" />
	<img src="https://img.shields.io/badge/PostgreSQL-16-336791?style=flat-square&logo=postgresql&logoColor=white" alt="PostgreSQL 16" />
	<img src="https://img.shields.io/badge/Ollama-Local%20Models-111111?style=flat-square" alt="Ollama" />
</p>

[功能](#功能) • [快速開始](#快速開始) • [本機開發](#本機開發) • [設定](#設定) • [驗證](#驗證)

</div>

## 概覽

這個 monorepo 提供一套完整的 local-first RAG 工作流：

- 用聊天介面與知識庫互動，回應以 SSE 串流輸出並附來源片段
- 管理知識庫、文件、提示詞模板、本機模型與對外查詢端點
- 以 PostgreSQL + pgvector 儲存向量與文件切塊，並結合文字相似度做混合檢索
- 透過 frontend 同源 `/api/*` proxy 與 backend 溝通，保留乾淨的瀏覽器存取體驗

> [!NOTE]
> 專案目前聚焦在單一工作區、local-first 的使用情境，不包含 authentication 或 multi-tenant 功能。

## 功能

- **Grounded chat**：聊天介面可選擇模型、提示詞與知識庫，回應支援串流、Markdown 顯示與來源引用
- **Knowledge base management**：建立知識庫、上傳文件、查看索引狀態、重新索引與刪除文件；建立時會從已安裝的 embedding model 下拉選擇，並驗證模型確實可用
- **Prompt templates**：管理系統提示詞與溫度設定，並維持可用的預設模板
- **Local model inventory**：列出本機模型、串流下載模型進度，並刪除不需要的模型
- **API endpoints**：把知識庫、提示詞與模型組合成可重複使用的查詢端點，支援 API key 輪替與查詢測試
- **Hybrid retrieval**：結合 pgvector 向量相似度與 `pg_trgm` 文字相似度，提高文件召回品質
- **SSE-friendly proxying**：frontend 的同源 proxy 會正確透傳聊天與模型下載串流，不會在完成後額外卡住

### 支援的文件格式

可匯入並建立索引的文件類型：`.txt`、`.md`、`.csv`、`.pdf`、`.docx`。

## 架構

| 元件 | 說明 |
| --- | --- |
| `frontend/` | Next.js 14 App Router 介面，提供聊天、知識庫、模型、提示詞與端點管理頁面 |
| `backend/` | FastAPI API、SQLAlchemy model、Alembic migration、RAG service 與 pytest 測試 |
| `postgres` | PostgreSQL 16，搭配 `pgvector` 儲存向量資料 |
| `ollama` | 本機 LLM 與 embedding 模型執行環境 |
| `docs/` | 規格、設計與尚未收尾功能盤點 |

主要 API 群組：

- `/api/health`
- `/api/chat`
- `/api/knowledge`
- `/api/models`
- `/api/prompts`
- `/api/endpoints`

## 快速開始

### 先決條件

- Docker Desktop 或支援 Compose 的 Docker Engine
- 若要本機開發 backend：Python 3.12+ 與 `uv`
- 若要本機開發 frontend：Node.js 20+

### 用 Docker Compose 啟動

1. 複製環境變數範本。

```powershell
Copy-Item .env.example .env
```

2. 啟動整個 stack。

```powershell
docker compose up --build -d
```

3. 套用資料庫 migration。

```powershell
docker compose exec backend uv run alembic upgrade head
```

4. 拉取至少一個聊天模型與一個 embedding 模型。

```powershell
docker compose exec ollama ollama pull gemma4:e4b
docker compose exec ollama ollama pull qwen3.5:4b
docker compose exec ollama ollama pull nomic-embed-text:latest
```

5. 開啟服務。

- Frontend：http://localhost:3000
- Backend health：http://localhost:8000/api/health
- Ollama API：http://localhost:11434

> [!IMPORTANT]
> `docker compose up` 不會自動執行 Alembic migration。第一次啟動、更新 schema 之後，或切換到新資料庫時，都要手動執行 `uv run alembic upgrade head`。

> [!TIP]
> Compose 中 frontend 會透過 `API_PROXY_TARGET=http://backend:8000` 使用同源 `/api/*` proxy。瀏覽器只需要打 `http://localhost:3000`，不需要另外設定 API base URL。

## 本機開發

開始前，建議先用 repo 內建入口檢查依賴與驗證流程：

```powershell
.\init.ps1
```

如果依賴尚未安裝，再執行：

```powershell
.\init.ps1 -Install
```

### Backend

```powershell
Set-Location backend
uv sync --extra dev
uv run alembic upgrade head
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Frontend

```powershell
Set-Location frontend
npm install
npm run dev
```

本機開發常用網址：

- Frontend：http://localhost:3000
- Backend API：http://localhost:8000

## 介面一覽

- `/`：聊天工作區，支援 session 歷史、模型／提示詞／知識庫切換與串流回應
- `/knowledge`：知識庫與文件管理
- `/models`：本機模型列表、下載與刪除
- `/prompts`：提示詞模板管理
- `/endpoints`：API 端點建立、API key 輪替與查詢測試

## 設定

`.env.example` 中常用的環境變數如下：

| 變數 | 用途 |
| --- | --- |
| `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` | PostgreSQL 連線設定 |
| `OLLAMA_BASE_URL` | Ollama API 位址 |
| `OLLAMA_MODEL` | 預設聊天模型名稱 |
| `OLLAMA_EMBEDDING_MODEL` | 預設 embedding 模型名稱 |
| `CORS_ORIGINS` | backend 允許的前端來源 |
| `UPLOAD_MAX_SIZE_MB` | 單檔上傳大小上限 |
| `UPLOAD_DIR` | 文件上傳儲存目錄 |

Compose 專用的 frontend 環境變數：

| 變數 | 用途 |
| --- | --- |
| `API_PROXY_TARGET` | Next.js proxy 轉送 backend 時使用的目標 origin |

## 驗證

優先使用 repo 根目錄的共用入口：

```powershell
.\init.ps1
```

針對單一區域時，可用下列最小驗證集合：

```powershell
Set-Location frontend; npm run test
Set-Location frontend; npm run build
Set-Location frontend; npm run test:smoke
Set-Location backend; uv run pytest -q
Set-Location backend; uv run ruff check .
```

## 專案結構

```text
.
|-- frontend/        # Next.js 介面與 Vitest 測試
|-- backend/         # FastAPI API、RAG service、Alembic、pytest
|-- docs/            # 規格、設計與盤點文件
|-- docker-compose.yml
|-- init.ps1         # 共用安裝 / 驗證入口
|-- .env.example
```

> [!NOTE]
> 上傳檔案的實際儲存位置由 `UPLOAD_DIR` 決定；在 Docker Compose 中會掛載到 backend 容器的 `/app/uploads`。
