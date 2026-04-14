# AGENTS.md

## 目的與範圍
本文件定義此儲存庫中人類與 agent 協作者的執行規範。
專案目標是交付一個 self-hosted、local-first 的 RAG 開發者平台 MVP。

包含範圍：
- 知識庫管理（文件上傳與索引）
- RAG 聊天與 SSE 串流回應
- 對外 API 端點管理
- Ollama 模型管理
- Prompt 模板管理

MVP 不包含：
- 使用者認證與多租戶
- 分析儀表板
- 網頁爬取匯入
- 進階檢索策略（例如 reranking）

## 系統邊界
- 採前後端分離架構：
  - 前端：Next.js 14+ UI
  - 後端：FastAPI REST/SSE API
  - 資料層：PostgreSQL + pgvector
  - LLM/Embedding：Ollama
- API 契約是前後端唯一的跨層整合介面。
- Monorepo 結構需維持與設計規格一致（`frontend/` + `backend/`）。

## 真相來源（Source of Truth）
- 產品與架構真相來源：`docs/design-spec.md`
- 任務拆解真相來源：`docs/implementation-plan.md`
- 若內容衝突：
1. 先遵循 `docs/design-spec.md`
2. 再遵循 `docs/implementation-plan.md`
3. 未更新 docs 前，不得引入文件未定義的行為

## 實作規則
- 依實作計畫 Task 順序執行：Task 1 到 Task 10。
- 變更需最小化且聚焦單一任務，不得夾帶無關修改。
- 不得實作超出 MVP 範圍的功能。
- 保持既有架構決策：
  - 後端維持模組化單體
  - 前端僅透過後端 API 存取能力
- 任何範圍或設計調整，必須先改 docs，再改程式碼。

## API 與資料契約
必要 API 群組：
- `/api/knowledge`
- `/api/chat`（POST 聊天流程必須支援 SSE 串流）
- `/api/endpoints`
- `/api/models`
- `/api/prompts`

必要核心資料實體：
- `knowledge_bases`
- `documents`
- `chunks`
- `ollama_models`
- `prompt_templates`
- `api_endpoints`
- `chat_sessions` 與 `chat_messages`

契約規則：
- 請求/回應行為需與 design spec 的 API 表格一致。
- 可用時，聊天來源引用需持久化於 `chat_messages.sources`。
- `chunk_size` 與 `chunk_overlap` 必須支援知識庫層級設定。

## 完成定義（Definition of Done）
每個完成的工作單元至少需包含：
1. 針對目標任務的程式或設定變更
2. 驗證命令與結果
3. 不影響已完成任務的既有行為

最低驗證檢查點：
- 健康檢查端點成功回應（`/api/health`）
- 資料庫 migration 成功執行
- 後端測試通過（pytest，至少涵蓋變更模組）
- 前端測試通過（Vitest，適用時至少涵蓋變更模組）
- Docker Compose smoke run 可驗證服務啟動與連線

## 運作限制
- 部署模式必須維持 self-hosted 與 local-first。
- 執行模型或聊天操作前，必須先檢查 Ollama 可用性。
- 以下錯誤情境必須有明確處理：
  - 不支援或超尺寸上傳
  - Embedding 產生失敗
  - 聊天串流時 SSE 中斷
  - 查詢時知識庫為空
- 錯誤回應需清楚且可執行，禁止靜默失敗。

## 變更控管
- 任何有意偏離 docs 的行為，必須先更新 `docs/`。
- PR 說明或 commit 訊息需標註對應實作計畫 Task 編號。
- Commit 範圍需與任務邊界一致。
- 未經明確 doc 更新，不得刪除或重定義既有 API 群組與資料實體。

## 執行回報範本
agent 執行回報請使用下列模板：

```md
### Task
Task X - <title>

### Goal
<此任務必須達成的目標>

### Changes
- <高訊號變更 1>
- <高訊號變更 2>

### Validation
- Command: `<command>`
- Result: <pass/fail + 關鍵輸出>

### Risks / Follow-ups
- <已知風險或下一步行動>
```
