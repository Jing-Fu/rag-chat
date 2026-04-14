function resolveApiBaseUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }

  return "http://localhost:8000";
}

const API_BASE_URL = resolveApiBaseUrl();

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

export class ApiError extends Error {
  status: number;
  detail: string;

  constructor(status: number, detail: string) {
    super(detail);
    this.name = "ApiError";
    this.status = status;
    this.detail = detail;
  }
}

async function toApiError(response: Response): Promise<ApiError> {
  let detail = `${response.status} ${response.statusText}`;

  try {
    const data = await response.json();
    if (typeof data?.detail === "string") {
      detail = data.detail;
    }
  } catch {
    // Keep HTTP status text when response body is not JSON.
  }

  return new ApiError(response.status, detail);
}

async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    throw await toApiError(response);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

async function apiRequestJson<T>(
  path: string,
  method: HttpMethod,
  body?: unknown,
): Promise<T> {
  return apiRequest<T>(path, {
    method,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
}

type SseHandler = (event: string, data: string) => void;

function parseSseBlock(block: string, onEvent: SseHandler) {
  let event = "message";
  const dataParts: string[] = [];

  for (const line of block.split("\n")) {
    if (!line || line.startsWith(":")) {
      continue;
    }
    if (line.startsWith("event:")) {
      event = line.slice("event:".length).trim();
      continue;
    }
    if (line.startsWith("data:")) {
      dataParts.push(line.slice("data:".length).trimStart());
    }
  }

  if (dataParts.length > 0) {
    onEvent(event, dataParts.join("\n"));
  }
}

async function consumeSse(
  response: Response,
  onEvent: SseHandler,
): Promise<void> {
  if (!response.body) {
    throw new ApiError(500, "SSE response body is missing");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      break;
    }

    buffer += decoder.decode(value, { stream: true }).replaceAll("\r\n", "\n");

    while (true) {
      const boundary = buffer.indexOf("\n\n");
      if (boundary < 0) {
        break;
      }

      const block = buffer.slice(0, boundary).trim();
      buffer = buffer.slice(boundary + 2);

      if (block) {
        parseSseBlock(block, onEvent);
      }
    }
  }

  const finalBlock = buffer.trim();
  if (finalBlock) {
    parseSseBlock(finalBlock, onEvent);
  }
}

export type KnowledgeBase = {
  id: string;
  name: string;
  description: string | null;
  chunk_size: number;
  chunk_overlap: number;
  embedding_model: string;
  status: string;
  document_count: number;
  created_at: string;
  updated_at: string;
};

export type KnowledgeBaseCreateInput = {
  name: string;
  description?: string | null;
  chunk_size?: number;
  chunk_overlap?: number;
  embedding_model?: string;
};

export type KnowledgeBaseUpdateInput = Partial<KnowledgeBaseCreateInput>;

export type DocumentItem = {
  id: string;
  kb_id: string;
  filename: string;
  file_type: string;
  file_size: number;
  chunk_count: number;
  status: string;
  created_at: string;
};

export type PromptTemplate = {
  id: string;
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  temperature: number;
  is_default: boolean;
  created_at: string;
};

export type PromptTemplateCreateInput = {
  name: string;
  system_prompt: string;
  user_prompt_template?: string;
  temperature?: number;
  is_default?: boolean;
};

export type PromptTemplateUpdateInput = Partial<PromptTemplateCreateInput>;

export type ModelInfo = {
  name: string;
  size: number | null;
  model_type: string;
  modified_at: string | null;
};

export type ChatSessionSummary = {
  id: string;
  kb_id: string;
  prompt_id: string | null;
  model_name: string;
  message_count: number;
  created_at: string;
  updated_at: string;
};

export type ChatMessageItem = {
  id: string;
  session_id: string;
  role: "user" | "assistant";
  content: string;
  sources: { items?: ChatSourceItem[] } | null;
  created_at: string;
};

export type ChatSourceItem = {
  chunk_id: string;
  content: string;
  chunk_index: number;
  metadata: Record<string, unknown> | null;
  filename: string;
  relevance_score: number;
};

export type ChatRequestPayload = {
  message: string;
  kb_id: string;
  model_name?: string;
  prompt_id?: string | null;
  session_id?: string | null;
};

export type ChatStreamHandlers = {
  onSession?: (sessionId: string) => void;
  onToken?: (token: string) => void;
  onDone?: (payload: { session_id: string; sources: ChatSourceItem[] }) => void;
  onError?: (message: string) => void;
};

export type EndpointItem = {
  id: string;
  name: string;
  api_key: string;
  kb_id: string;
  prompt_id: string;
  model_name: string;
  is_active: boolean;
  created_at: string;
};

export type EndpointCreateInput = {
  name: string;
  kb_id: string;
  prompt_id: string;
  model_name: string;
};

export type EndpointQueryResult = {
  endpoint_id: string;
  answer: string;
  sources: ChatSourceItem[];
  model_name: string;
};

export type ModelPullProgress = {
  status?: string;
  digest?: string;
  total?: number;
  completed?: number;
};

export type ModelPullHandlers = {
  onProgress?: (progress: ModelPullProgress) => void;
  onDone?: (modelName: string) => void;
  onError?: (message: string) => void;
};

export const knowledgeApi = {
  list: () => apiRequest<KnowledgeBase[]>("/api/knowledge"),
  create: (input: KnowledgeBaseCreateInput) =>
    apiRequestJson<KnowledgeBase>("/api/knowledge", "POST", input),
  get: (id: string) => apiRequest<KnowledgeBase>(`/api/knowledge/${id}`),
  update: (id: string, input: KnowledgeBaseUpdateInput) =>
    apiRequestJson<KnowledgeBase>(`/api/knowledge/${id}`, "PUT", input),
  delete: (id: string) => apiRequest<void>(`/api/knowledge/${id}`, { method: "DELETE" }),
  listDocuments: (kbId: string) =>
    apiRequest<DocumentItem[]>(`/api/knowledge/${kbId}/documents`),
  async upload(kbId: string, file: File) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await fetch(`${API_BASE_URL}/api/knowledge/${kbId}/upload`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    return (await response.json()) as DocumentItem;
  },
  deleteDocument: (kbId: string, docId: string) =>
    apiRequest<void>(`/api/knowledge/${kbId}/documents/${docId}`, { method: "DELETE" }),
  reindexDocument: (kbId: string, docId: string) =>
    apiRequestJson<DocumentItem>(
      `/api/knowledge/${kbId}/documents/${docId}/reindex`,
      "POST",
    ),
};

export const chatApi = {
  listSessions: () => apiRequest<ChatSessionSummary[]>("/api/chat/sessions"),
  getMessages: (sessionId: string) =>
    apiRequest<ChatMessageItem[]>(`/api/chat/sessions/${sessionId}/messages`),
  deleteSession: (sessionId: string) =>
    apiRequest<void>(`/api/chat/sessions/${sessionId}`, { method: "DELETE" }),
  async streamChat(
    payload: ChatRequestPayload,
    handlers: ChatStreamHandlers = {},
  ): Promise<{ sessionId: string | null; fullText: string; sources: ChatSourceItem[] }> {
    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    let sessionId = payload.session_id ?? null;
    const tokens: string[] = [];
    let sources: ChatSourceItem[] = [];

    await consumeSse(response, (event, data) => {
      if (event === "session") {
        sessionId = data;
        handlers.onSession?.(data);
        return;
      }

      if (event === "token") {
        tokens.push(data);
        handlers.onToken?.(data);
        return;
      }

      if (event === "done") {
        try {
          const parsed = JSON.parse(data) as { session_id: string; sources: ChatSourceItem[] };
          sessionId = parsed.session_id;
          sources = parsed.sources ?? [];
          handlers.onDone?.(parsed);
        } catch {
          // Ignore malformed done payload but preserve rendered text.
        }
        return;
      }

      if (event === "error") {
        handlers.onError?.(data);
      }
    });

    return {
      sessionId,
      fullText: tokens.join(""),
      sources,
    };
  },
};

export const endpointApi = {
  list: () => apiRequest<EndpointItem[]>("/api/endpoints"),
  create: (input: EndpointCreateInput) =>
    apiRequestJson<EndpointItem>("/api/endpoints", "POST", input),
  query: (id: string, question: string, apiKey: string) =>
    apiRequestJson<EndpointQueryResult>(`/api/endpoints/${id}/query`, "POST", {
      question,
      api_key: apiKey,
    }),
  regenerateKey: (id: string) =>
    apiRequestJson<EndpointItem>(`/api/endpoints/${id}/regenerate-key`, "POST"),
};

export const modelApi = {
  list: () => apiRequest<ModelInfo[]>("/api/models"),
  delete: (modelName: string) =>
    apiRequest<void>(`/api/models/${encodeURIComponent(modelName)}`, { method: "DELETE" }),
  async pull(modelName: string, handlers: ModelPullHandlers = {}) {
    const response = await fetch(`${API_BASE_URL}/api/models/pull`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({ model_name: modelName }),
    });

    if (!response.ok) {
      throw await toApiError(response);
    }

    await consumeSse(response, (event, data) => {
      if (event === "progress") {
        try {
          const parsed = JSON.parse(data) as ModelPullProgress;
          handlers.onProgress?.(parsed);
        } catch {
          handlers.onProgress?.({ status: data });
        }
        return;
      }

      if (event === "done") {
        handlers.onDone?.(data);
        return;
      }

      if (event === "error") {
        handlers.onError?.(data);
      }
    });
  },
};

export const promptApi = {
  list: () => apiRequest<PromptTemplate[]>("/api/prompts"),
  create: (input: PromptTemplateCreateInput) =>
    apiRequestJson<PromptTemplate>("/api/prompts", "POST", input),
  get: (id: string) => apiRequest<PromptTemplate>(`/api/prompts/${id}`),
  update: (id: string, input: PromptTemplateUpdateInput) =>
    apiRequestJson<PromptTemplate>(`/api/prompts/${id}`, "PUT", input),
  delete: (id: string) => apiRequest<void>(`/api/prompts/${id}`, { method: "DELETE" }),
};
