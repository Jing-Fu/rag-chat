# RAG Chat Platform

這是一個自架、以本機優先為核心的 RAG 工作區，透過 Next.js 前端、FastAPI 後端、PostgreSQL + pgvector，以及本機 Ollama 模型，讓你能直接和自己的文件對話。

## 特色重點

- 以 SSE 串流回應的有依據聊天體驗，並提供每次回答的來源引用
- 結合向量相似度與 `pg_trgm` 文字相似度的混合檢索
- 用於本機文件匯入與檢索的知識庫管理介面
- 模型、提示詞模板與 API 端點管理介面，並自動維持可用的預設提示詞模板
- 檢索上下文注入格式由系統固定管理，不提供自訂檢索模板
- 同源 frontend `/api/*` proxy，支援 Docker 與本機開發流程
- 主要產品頁面已提供繁體中文 UI

## 架構

- `frontend/`：Next.js 14 App Router 介面，涵蓋聊天、知識庫、提示詞、模型與端點頁面
- `backend/`：FastAPI REST/SSE API、SQLAlchemy model、Alembic migration 與 RAG service
- `postgres`：PostgreSQL 16，並啟用 `pgvector`
- `ollama`：本機聊天模型與 embedding 模型執行環境
- `docs/`：設計 spec、實作計畫與目前使用中的前端改版文件

主要 API 群組：

- `/api/health`
- `/api/chat`
- `/api/knowledge`
- `/api/models`
- `/api/prompts`
- `/api/endpoints`

> [!NOTE]
> frontend 會透過同源 `/api/*` 路由與 backend 溝通。在 Docker Compose 中，這是由 `API_PROXY_TARGET=http://backend:8000` 串接；在本機開發時，如果沒有設定 `NEXT_PUBLIC_API_URL`，frontend 會從瀏覽器 hostname 推導 backend host，並預設連到 `8000` port。

## 先決條件

- Docker Desktop 或支援 Compose 的 Docker Engine
- 本機 backend 開發需要 Python 3.12 與 [`uv`](https://docs.astral.sh/uv/)
- 本機 frontend 開發需要 Node.js 20+

## 快速啟動

1. 複製環境變數範本。

```powershell
Copy-Item .env.example .env
```

2. 啟動整個 stack。

```powershell
docker compose up --build -d
```

3. 執行資料庫 migration。

```powershell
docker compose exec backend uv run alembic upgrade head
```

4. 拉取預設 Ollama 模型。

```powershell
docker compose exec ollama ollama pull gemma4:e4b
docker compose exec ollama ollama pull nomic-embed-text:latest
```

5. 開啟應用程式與 health endpoint。

- Frontend：[http://localhost:3000](http://localhost:3000)
- Backend health：[http://localhost:8000/api/health](http://localhost:8000/api/health)
- Ollama API：[http://localhost:11434](http://localhost:11434)

> [!IMPORTANT]
> Compose stack 不會自動套用 Alembic migration。第一次啟動後，以及每次 schema 有更新時，都需要在 backend 容器內手動執行 `uv run alembic upgrade head`。

## Ollama GPU 模式

如果你的環境已經完成 Docker GPU passthrough 設定，可以用 GPU override 啟動 Ollama：

```powershell
docker compose -f docker-compose.yml -f docker-compose.gpu.yml up --build -d
```

用下面的指令確認 Ollama 是否有正確偵測到 GPU：

```powershell
docker compose -f docker-compose.yml -f docker-compose.gpu.yml logs ollama --tail 50
```

GPU 需求：

- Windows：Docker Desktop 已啟用 WSL2 GPU 支援，且主機安裝可用的 NVIDIA driver
- Linux：已安裝 NVIDIA driver 與 `nvidia-container-toolkit`

## 本機開發

開始前，先還原 repo 上下文並執行共用驗證入口：

```powershell
.\init.ps1
```

只有在依賴尚未安裝時，才需要先補裝：

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

- Frontend：[http://localhost:3000](http://localhost:3000) 或 [http://127.0.0.1:3000](http://127.0.0.1:3000)
- Backend API：[http://localhost:8000](http://localhost:8000)

## 驗證

優先使用的 repo 根目錄入口：

```powershell
.\init.ps1
```

針對性的驗證指令：

```powershell
Set-Location frontend; npm run test
Set-Location frontend; npm run build
Set-Location frontend; npm run test:smoke
Set-Location backend; uv run pytest -q
Set-Location backend; uv run ruff check .
```

請優先執行和本次變更最相關、範圍最小的驗證集合。

## 設定

`.env.example` 中較重要的 backend 環境變數：

- `POSTGRES_HOST`, `POSTGRES_PORT`, `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD`
- `OLLAMA_BASE_URL`, `OLLAMA_MODEL`, `OLLAMA_EMBEDDING_MODEL`
- `CORS_ORIGINS`
- `UPLOAD_MAX_SIZE_MB`, `UPLOAD_DIR`

Compose 專用的 frontend 環境變數：

- `API_PROXY_TARGET`：容器環境中，提供給 Next.js proxy route 使用的 backend origin

## Repo 結構

- `frontend/`：Next.js 應用程式、共用 UI 元件、client store、Vitest 測試與 Playwright smoke script
- `backend/`：FastAPI 應用程式、service、schema、Alembic migration 與 pytest 測試
- `docs/`：產品 spec 與目前前端改版的參考文件
- `uploads/`：backend 使用的本機上傳儲存目錄
- `progress.md`：session 交接紀錄與驗證歷史
- `feature_list.json`：repo 功能狀態追蹤快照

## 目前產品範圍

- 以本機優先為主的單一使用者工作流程
- 目前 MVP 不包含 authentication 或 multi-tenant 功能
- 聊天、檢索與 endpoint query 功能都依賴可正常運作的 Ollama runtime
- 檢索品質會受已索引文件、所選提示詞模板與模型影響
- 提示詞模板目前只負責系統提示詞、溫度與預設設定；檢索訊息格式不提供自訂
- 新對話若未明確指定提示詞模板，後端會優先使用資料庫中的預設模板；若資料暫時缺少預設標記，則回退到第一筆可用模板
