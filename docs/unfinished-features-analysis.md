# 目前專案未完成功能盤點

更新日期：2026-04-20

整體判斷：這個 repo 的 MVP 主體其實大多已經落地，真正還沒收尾的部分，主要集中在少數功能流程沒有完整打通，以及文件與驗證狀態沒有同步。

## 高信心尚未完成的功能

### 1. 知識庫設定編輯 UI 尚未完成

- 後端已經提供 `PUT /api/knowledge/{id}` 更新知識庫設定。
- 前端 API client 也已經有 `knowledgeApi.update`。
- 但知識庫頁目前只有建立、刪除、上傳文件、重新索引、刪除文件，沒有任何「編輯既有知識庫」的 UI 或操作流程。
- 目前影響：知識庫建立後，`chunk_size`、`chunk_overlap`、`embedding_model` 只能在建立時決定，無法從前端修改。

依據：

- `backend/app/api/knowledge.py`
- `frontend/src/lib/api.ts`
- `frontend/src/app/knowledge/page.tsx`
- `docs/design-spec.md`

### 2. 聊天 session 的設定回填與一致性尚未完成

- `ChatSession` 資料模型明確保存了 `kb_id`、`prompt_id`、`model_name`。
- 前端在切換既有 session 時，只會切換 `selectedSessionId`，沒有把該 session 綁定的知識庫、提示詞、模型回填到 header 狀態。
- 前端續聊時送出的 payload，使用的是「目前 UI 上選到的」`selectedKnowledgeBaseId`、`selectedPromptId`、`selectedModelName`，不是從 session 本身還原。
- 後端在既有 session 續聊時，也只更新 `updated_at`，沒有同步更新 `ChatSession` 上保存的 `kb_id`、`prompt_id`、`model_name`。
- 目前影響：重新開啟舊對話後，有可能在不同知識庫、模型或提示詞下繼續對話，造成 session metadata 與實際執行條件漂移。

依據：

- `backend/app/models/chat.py`
- `backend/app/schemas/chat.py`
- `backend/app/services/chat_service.py`
- `frontend/src/app/page.tsx`
- `frontend/src/components/chat/chat-header.tsx`

### 3. API 端點的啟用/停用管理流程尚未完成

- `ApiEndpoint` 模型與 schema 都有 `is_active` 欄位。
- 後端查詢流程也明確會阻擋已停用端點。
- 但目前 router 只提供：列出、建立、查詢、重新產生 key，沒有任何啟用/停用或更新端點狀態的 API。
- 前端頁面會顯示「啟用中 / 已停用」，但沒有任何對應操作按鈕。
- 目前影響：端點狀態被設成停用後，缺少正常的管理入口把它重新啟用，`is_active` 只剩資料層與判斷層，沒有完整管理流程。

依據：

- `backend/app/models/api_endpoint.py`
- `backend/app/schemas/api_endpoint.py`
- `backend/app/services/endpoint_service.py`
- `backend/app/api/endpoints.py`
- `frontend/src/app/endpoints/page.tsx`

## 文件與驗證層未完成

### 1. `docs/design-spec.md` 仍保留過時的未完成描述

- 文件中仍把 `models/`、`endpoints/` 標成「待補齊」。
- 文件中仍寫「前端尚未完成 API client、React Query、Zustand、SSE 串流、CRUD 與完整測試」。
- 但從目前程式碼來看，以上大多已經完成，因此這份設計文件沒有反映現況。

依據：

- `docs/design-spec.md`
- `frontend/src/app/models/page.tsx`
- `frontend/src/app/endpoints/page.tsx`
- `frontend/src/lib/api.ts`
- `frontend/src/stores/chat-ui-store.ts`
- `frontend/src/app/page.test.tsx`

### 2. `docs/implementation-plan.md` 仍有未勾選項目

- 文件中的未勾選項目主要是 commit 與最終手動 E2E 驗證。
- 其中明確還留有 `Task 10 - Step 4: End-to-end functional test` 未完成。
- 代表功能本身多半已經存在，但最終收尾與結案驗證沒有完全完成。

依據：

- `docs/implementation-plan.md`

### 3. README 提到的狀態追蹤檔不存在

- README 仍列出 `progress.md` 與 `feature_list.json`。
- 目前 repo 根目錄查無這兩個檔案。
- 這不是產品功能缺口，但屬於明確的文件與交接資訊未同步。

依據：

- `README.md`

## 不列入正式未完成功能，但建議清理的殘留項

### 1. `frontend/src/lib/dashboard-data.ts` 是未接線的舊草稿資料

- 這個檔案目前沒有被任何 source code 引用。
- 內容仍保留 `/chat` 路徑與 `Ollama check pending` 等舊文案。
- 現在實際聊天入口是 `/`，所以這比較像遺留草稿，不是正式未完成功能，但容易誤導後續維護者。

依據：

- `frontend/src/lib/dashboard-data.ts`
- `frontend/src/app/page.tsx`

## 總結

- 如果只看「核心 MVP 能不能用」，目前答案偏向可以。
- 如果看「功能是否完整收尾」，目前最明顯的缺口是：知識庫編輯、聊天 session 設定一致性、端點啟用/停用管理。
- 如果看「專案狀態是否可被正確理解」，則還有文件過時、E2E 驗證未結案、README 追蹤檔缺失等問題。