# RAG 智慧問答開發者平台 — 設計規格

> **文件日期**: 2026-04-13  
> **狀態**: 已同步目前 repo 基線

## 1. 概覽

### 目標

打造一個 Self-hosted 的 RAG 開發者工具平台，讓開發者能夠快速建立、管理和部署自己的 RAG（Retrieval Augmented Generation）智慧問答應用。

### 定位

- **類型**: 開發者工具平台
- **部署模式**: Self-hosted / Local-first
- **LLM 引擎**: Ollama（本地模型）

### MVP 功能範圍

1. **知識庫管理** — 上傳文件、建立索引，可自訂 chunk size 和 overlap
2. **聊天對話介面** — 即時問答、SSE 串流回應、來源引用
3. **API 端點管理** — 開發者建立獨立的 RAG API 端點給其他應用呼叫
4. **模型管理** — 切換/拉取/刪除 Ollama 模型
5. **Prompt 模板管理** — 建立可重複使用的 system prompt 模板

### MVP 不包含

- 使用者認證 / 多租戶
- 使用分析儀表板
- 網頁爬取匯入
- 檢索策略進階配置（重排名等）

---

## 2. 架構

### 整體架構：前後端分離

```
┌─────────────────────────────┐
│ Next.js（純前端 SPA/SSR）    │
│  ├─ 知識庫管理 UI           │
│  ├─ 聊天對話 UI             │
│  ├─ API 管理 UI             │
│  ├─ 模型管理 UI             │
│  └─ Prompt 模板 UI          │
└──────────┬──────────────────┘
           │ REST + SSE
┌──────────▼──────────────────┐
│ FastAPI（模組化單體）        │
│  ├─ /api/knowledge/*        │
│  ├─ /api/chat/*  (SSE 串流) │
│  ├─ /api/endpoints/*        │
│  ├─ /api/models/*           │
│  └─ /api/prompts/*          │
└──────┬──────────┬───────────┘
       │          │
┌──────▼─────┐ ┌──▼──────────┐
│ PostgreSQL │ │ Ollama      │
│ + pgvector │ │ LLM/Embed   │
└────────────┘ └─────────────┘
```

### 架構決策理由

- **前後端分離**：FastAPI 直接暴露完整 REST API，符合「開發者工具平台」定位——開發者可直接呼叫 API，前端 UI 只是其中一個消費者。
- **模組化單體**：相比微服務，在 MVP 階段開發效率更高、部署更簡單，同時保持模組間的清晰邊界。
- **CORS 跨域**由 FastAPI middleware 處理。

---

## 3. 技術棧

### 前端

| 技術 | 用途 |
|------|------|
| **Next.js 14+** (App Router) | React 框架 |
| **TypeScript** | 型別安全 |
| **Tailwind CSS** + **shadcn/ui/Base UI** | 樣式與元件庫 |
| **React Query (TanStack Query)** | 伺服器狀態管理與快取 |
| **Zustand** | 客戶端狀態管理 |

> 備註：目前 repo 已有深色模式聊天導向的靜態前端骨架，後續任務是在既有 UI shell 上補齊 API 串接、狀態管理、SSE 與 CRUD，不重新定義整體視覺方向。

### 後端

| 技術 | 用途 |
|------|------|
| **Python 3.12** + **FastAPI** | API 框架 |
| **SQLAlchemy 2.0** | ORM |
| **Alembic** | 資料庫遷移 |
| **pgvector** | 向量搜尋擴展 |
| **LangChain** | RAG pipeline (text splitter, embeddings) |
| **Ollama SDK** | 模型管理與推論 |

### 基礎設施

| 技術 | 用途 |
|------|------|
| **PostgreSQL 16** + pgvector | 資料庫 + 向量儲存 |
| **Ollama** | 本地 LLM 與 Embedding |
| **Docker Compose** | 服務編排 |
| **uv** | Python 套件管理 |

### 開發工具

| 技術 | 用途 |
|------|------|
| **Ruff** | Python Lint |
| **ESLint + Prettier** | JavaScript/TypeScript Lint |
| **pytest** | 後端測試 |
| **Vitest** | 前端測試 |

---

## 4. 專案結構（Monorepo）

```
rag-chat/
├── frontend/                    # Next.js 應用
│   ├── src/
│   │   ├── app/                 # App Router 路由
│   │   │   ├── page.tsx         # 首頁聊天入口（正式聊天工作區）
│   │   │   ├── knowledge/       # 知識庫管理
│   │   │   ├── prompts/         # Prompt 模板
│   │   │   ├── models/          # 模型管理（待補齊）
│   │   │   └── endpoints/       # API 端點管理（待補齊）
│   │   ├── components/
│   │   │   ├── chat/            # ChatHeader / ChatInput 等聊天元件
│   │   │   ├── layout/          # AppSidebar 與共用 shell
│   │   │   └── ui/              # UI primitives
│   │   ├── lib/                 # API client, static dashboard data, utils
│   │   ├── stores/              # Zustand stores（Task 8 新增）
│   │   └── test/                # Vitest setup（Task 8 補齊）
│   ├── package.json
│   └── tailwind.config.ts
│
├── backend/                     # FastAPI 應用
│   ├── app/
│   │   ├── api/                 # API 路由
│   │   │   ├── knowledge.py     # 知識庫 CRUD
│   │   │   ├── chat.py          # 聊天 + SSE 串流
│   │   │   ├── endpoints.py     # API 端點管理
│   │   │   ├── models.py        # 模型管理
│   │   │   └── prompts.py       # Prompt 模板
│   │   ├── core/                # 核心邏輯
│   │   │   ├── rag.py           # RAG pipeline
│   │   │   ├── ingestion.py     # 文件匯入
│   │   │   ├── embeddings.py    # Embedding
│   │   │   └── retrieval.py     # 檢索策略
│   │   ├── models/              # SQLAlchemy 模型
│   │   ├── schemas/             # Pydantic schemas
│   │   ├── services/            # 業務邏輯
│   │   └── config.py            # 設定
│   ├── alembic/                 # DB migrations
│   ├── tests/
│   └── pyproject.toml
│
├── docker-compose.yml           # 全服務編排
├── .env.example
└── README.md
```

---

## 5. 資料模型

### 5.1 knowledge_bases — 知識庫

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| name | VARCHAR | 知識庫名稱 |
| description | TEXT | 說明 |
| chunk_size | INT | 文本切分大小（字元數） |
| chunk_overlap | INT | 切分重疊（字元數） |
| embedding_model | VARCHAR | Ollama embedding 模型名稱 |
| status | VARCHAR | 狀態（active / indexing / error） |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

### 5.2 documents — 文件

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| kb_id | UUID (FK → knowledge_bases) | 所屬知識庫 |
| filename | VARCHAR | 檔名 |
| file_type | VARCHAR | 檔案類型 (.pdf, .txt, .md 等) |
| file_size | BIGINT | 檔案大小（bytes） |
| chunk_count | INT | 切分後的 chunk 數量 |
| status | VARCHAR | 狀態（processing / ready / error） |
| created_at | TIMESTAMP | 建立時間 |

### 5.3 chunks — 文件片段

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| doc_id | UUID (FK → documents) | 所屬文件 |
| content | TEXT | 文本內容 |
| embedding | VECTOR | pgvector 向量 |
| metadata | JSONB | 額外元資料（頁碼等） |
| chunk_index | INT | 在文件中的順序 |
| created_at | TIMESTAMP | 建立時間 |

### 5.4 ollama_models — 模型

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| model_name | VARCHAR | Ollama 模型名稱 |
| model_type | VARCHAR | llm 或 embed |
| parameters | JSONB | 模型參數（大小等） |
| is_available | BOOLEAN | 是否可用 |
| created_at | TIMESTAMP | 建立時間 |

### 5.5 prompt_templates — Prompt 模板

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| name | VARCHAR | 模板名稱 |
| system_prompt | TEXT | 系統 prompt |
| user_prompt_template | TEXT | 使用者 prompt 模板（含 `{context}`, `{question}` 佔位符） |
| temperature | FLOAT | LLM 溫度參數 |
| is_default | BOOLEAN | 是否為預設模板 |
| created_at | TIMESTAMP | 建立時間 |

### 5.6 api_endpoints — API 端點

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| name | VARCHAR | 端點名稱 |
| api_key | VARCHAR | API 金鑰（自動產生） |
| kb_id | UUID (FK → knowledge_bases) | 綁定的知識庫 |
| prompt_id | UUID (FK → prompt_templates) | 綁定的 Prompt 模板 |
| model_name | VARCHAR | 使用的 LLM 模型 |
| is_active | BOOLEAN | 是否啟用 |
| created_at | TIMESTAMP | 建立時間 |

### 5.7 chat_sessions / chat_messages — 對話

**chat_sessions:**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| kb_id | UUID (FK) | 使用的知識庫 |
| prompt_id | UUID (FK) | 使用的 Prompt 模板 |
| model_name | VARCHAR | 使用的模型 |
| created_at | TIMESTAMP | 建立時間 |
| updated_at | TIMESTAMP | 更新時間 |

**chat_messages:**

| 欄位 | 型別 | 說明 |
|------|------|------|
| id | UUID (PK) | 主鍵 |
| session_id | UUID (FK → chat_sessions) | 所屬 session |
| role | VARCHAR | user 或 assistant |
| content | TEXT | 訊息內容 |
| sources | JSONB | 來源引用（document_id, chunk_index, relevance_score） |
| created_at | TIMESTAMP | 建立時間 |

---

## 6. API 設計

### 6.1 知識庫管理 `/api/knowledge`

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/knowledge` | 列出全部知識庫 |
| POST | `/api/knowledge` | 建立知識庫（含 chunk_size, chunk_overlap, embedding_model） |
| GET | `/api/knowledge/{id}` | 知識庫詳情（含文件統計） |
| PUT | `/api/knowledge/{id}` | 更新知識庫設定 |
| DELETE | `/api/knowledge/{id}` | 刪除知識庫（含所有文件和 chunks） |
| POST | `/api/knowledge/{id}/upload` | 上傳文件（multipart/form-data） |
| GET | `/api/knowledge/{id}/documents` | 列出知識庫的文件 |
| DELETE | `/api/knowledge/{id}/documents/{doc_id}` | 刪除文件 |
| POST | `/api/knowledge/{id}/documents/{doc_id}/reindex` | 重新索引文件 |

### 6.2 聊天 `/api/chat`

| 方法 | 路由 | 功能 |
|------|------|------|
| POST | `/api/chat` | 發送訊息，回應為 SSE 串流（含 kb_id, prompt_id, model_name, session_id） |
| GET | `/api/chat/sessions` | 列出對話 session |
| GET | `/api/chat/sessions/{id}/messages` | 取得歷史訊息 |
| DELETE | `/api/chat/sessions/{id}` | 刪除對話 |

### 6.3 API 端點 `/api/endpoints`

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/endpoints` | 列出全部端點 |
| POST | `/api/endpoints` | 建立新端點（綁定 KB + Prompt + Model） |
| POST | `/api/endpoints/{id}/query` | 透過端點發送 RAG 查詢（需 API Key） |
| POST | `/api/endpoints/{id}/regenerate-key` | 重新產生 API Key |

### 6.4 模型管理 `/api/models`

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/models` | 列出 Ollama 可用模型（同步本地清單） |
| POST | `/api/models/pull` | 拉取新模型（串流進度） |
| DELETE | `/api/models/{name}` | 刪除模型 |

### 6.5 Prompt 模板 `/api/prompts`

| 方法 | 路由 | 功能 |
|------|------|------|
| GET | `/api/prompts` | 列出全部模板 |
| POST | `/api/prompts` | 建立模板 |
| PUT | `/api/prompts/{id}` | 更新模板 |
| DELETE | `/api/prompts/{id}` | 刪除模板 |

---

## 7. 核心流程

### 7.1 文件匯入流程

1. **檔案驗證** — 檢查格式（.txt, .pdf, .md, .docx, .csv）與大小限制
2. **文字擷取** — 使用對應的 parser（PyPDF2, python-docx 等）將文件轉為純文字
3. **文本切分** — 使用 LangChain `RecursiveCharacterTextSplitter`，chunk_size 和 chunk_overlap 取自知識庫設定
4. **向量化** — 呼叫 Ollama embedding model 產生每個 chunk 的向量
5. **儲存** — 將 chunks 和 embedding 向量寫入 PostgreSQL（pgvector）

### 7.2 RAG 問答流程

1. **查詢向量化** — 使用 Ollama embedding model 將使用者提問向量化
2. **向量檢索** — 使用 pgvector similarity search 從對應知識庫檢索 Top-K 相關 chunks
3. **Prompt 組裝** — 將 system_prompt + 檢索到的 context + 對話歷史 + 使用者提問組合
4. **LLM 生成** — 呼叫 Ollama chat API，透過 SSE（Server-Sent Events）逐 token 串流回前端
5. **回應儲存** — 完整回應 + 來源引用（document_id, chunk_index, relevance_score）存入 chat_messages

---

## 8. 前端頁面

### 佈局

整體介面採用 **Open WebUI 風格（沈浸式聊天導向）**，預設深色模式：

### 目前已建立的前端基線

- `frontend/` 已存在，且目前採深色 dashboard / chat shell 風格。
- `/` 已實作為聊天入口頁，包含 `AppSidebar`、`ChatHeader`、`ChatInput` 與聊天空狀態版面。
- `/knowledge` 與 `/prompts` 已有靜態頁面骨架，但目前仍以 mock data / prototype 方式呈現。
- Sidebar 已暴露 `models` 與 `endpoints` 的導覽入口，但兩個頁面尚未補齊。
- 目前前端尚未完成 API client、React Query、Zustand、SSE 串流、CRUD 與完整測試；後續開發應在既有骨架上補功能，而非重做 UI 結構。

### 目標頁面與行為

1. **首頁 即 聊天對話工作區** (`/`)
   - **頂部控制列**：並排三個下拉選擇器 —— 選擇 Ollama 模型、選擇 Prompt 模板、選擇外掛的知識庫。
   - **中央主畫面**：對話訊息串、markdown 呈現、來源引用與空狀態。
   - **底部輸入框**：大型輸入區與送出按鈕，支援 SSE 串流中的逐步回應顯示。
2. **左側 Sidebar**
   - 上半部：`+ New Chat` 快速開啟新對話、依時序排列的歷史對話清單。
   - 下半部（管理區）：導向知識庫、模型、Prompt、API 端點等管理頁。
3. **知識庫管理** (`/knowledge`) — 列表、建立知識庫、文件上傳、文件列表、刪除與重新索引。
4. **API 端點** (`/endpoints`) — 管理與複製 API Key，顯示 curl 使用範例。
5. **模型管理** (`/models`) — 拉取、同步、刪除本地模型，並顯示模型大小與類型。
6. **Prompt 模板** (`/prompts`) — 編輯專屬系統提示詞、user prompt 模板與 temperature。

---

## 9. Docker 部署

### docker-compose.yml 服務定義

| 服務 | Image | Port | 說明 |
|------|-------|------|------|
| `frontend` | 自建 (Next.js) | 3000 | 前端應用 |
| `backend` | 自建 (FastAPI) | 8000 | 後端 API |
| `postgres` | pgvector/pgvector:pg16 | 5432 | 資料庫 |
| `ollama` | ollama/ollama | 11434 | LLM 引擎 |

### 持久化

- `pg_data` volume — PostgreSQL 資料
- `ollama_data` volume — Ollama 模型檔案
- `upload_data` volume — 上傳的原始文件

### 環境變數（.env.example）

```env
# Database
POSTGRES_HOST=postgres
POSTGRES_PORT=5432
POSTGRES_DB=rag_platform
POSTGRES_USER=rag_user
POSTGRES_PASSWORD=change_me

# Ollama
OLLAMA_BASE_URL=http://ollama:11434
OLLAMA_MODEL=llama3.2
OLLAMA_EMBEDDING_MODEL=nomic-embed-text

# Backend
BACKEND_URL=http://backend:8000
CORS_ORIGINS=http://localhost:3000

# Upload
UPLOAD_MAX_SIZE_MB=50
UPLOAD_DIR=/app/uploads
```

---

## 10. 錯誤處理

- **文件上傳失敗** — 格式不支援、檔案過大、解析失敗時回傳 400 + 明確錯誤訊息
- **Embedding 失敗** — Ollama 不可用時，文件狀態設為 error，前端顯示重試按鈕
- **LLM 串流中斷** — 前端偵測 SSE 連線斷開，顯示「回應中斷」並提供重試
- **模型不存在** — 呼叫 Ollama API 前先驗證模型可用性
- **知識庫為空** — 聊天時知識庫無文件，回傳提示訊息而非空回應
