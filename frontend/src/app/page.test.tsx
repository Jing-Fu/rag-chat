import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import Home from "@/app/page";
import { useChatUiStore } from "@/stores";

const apiMocks = vi.hoisted(() => ({
  listModels: vi.fn(),
  listPrompts: vi.fn(),
  listKnowledgeBases: vi.fn(),
  listSessions: vi.fn(),
  getMessages: vi.fn(),
  streamChat: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  modelApi: {
    list: apiMocks.listModels,
  },
  promptApi: {
    list: apiMocks.listPrompts,
  },
  knowledgeApi: {
    list: apiMocks.listKnowledgeBases,
  },
  chatApi: {
    listSessions: apiMocks.listSessions,
    getMessages: apiMocks.getMessages,
    streamChat: apiMocks.streamChat,
    deleteSession: vi.fn(),
    deleteAllSessions: vi.fn(),
  },
}));

vi.mock("@/components/layout/dashboard-shell", () => ({
  DashboardShell: ({ header, children, footer }: { header?: React.ReactNode; children: React.ReactNode; footer?: React.ReactNode }) => (
    <div>
      {header}
      {children}
      {footer}
    </div>
  ),
}));

vi.mock("@/components/chat/chat-header", () => ({
  ChatHeader: () => <div>chat-header</div>,
}));

vi.mock("@/components/chat/chat-message-list", () => ({
  ChatMessageList: ({ messages }: { messages: Array<{ id: string; content: string }> }) => (
    <div>
      {messages.map((message) => (
        <p key={message.id}>{message.content || "streaming"}</p>
      ))}
    </div>
  ),
}));

vi.mock("@/components/chat/chat-input", () => ({
  ChatInput: ({
    value,
    onChange,
    onSubmit,
    disabled,
  }: {
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    disabled?: boolean;
  }) => (
    <div>
      <textarea
        aria-label="chat-input"
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="button" onClick={onSubmit} disabled={disabled}>
        send
      </button>
    </div>
  ),
}));

function renderHome() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <Home />
    </QueryClientProvider>,
  );
}

describe("Home chat viewport", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    Object.defineProperty(HTMLElement.prototype, "scrollTo", {
      configurable: true,
      writable: true,
      value: vi.fn(),
    });

    useChatUiStore.setState({
      selectedModelName: "llama3.2",
      selectedPromptId: "prompt-1",
      selectedKnowledgeBaseId: "kb-1",
      selectedSessionId: "session-1",
    });

    apiMocks.listModels.mockResolvedValue([
      {
        name: "llama3.2",
        size: null,
        model_type: "llm",
        modified_at: null,
      },
    ]);
    apiMocks.listPrompts.mockResolvedValue([
      {
        id: "prompt-1",
        name: "default",
        system_prompt: "",
        temperature: 0,
        is_default: true,
        created_at: new Date().toISOString(),
      },
    ]);
    apiMocks.listKnowledgeBases.mockResolvedValue([
      {
        id: "kb-1",
        name: "KB",
        description: null,
        chunk_size: 800,
        chunk_overlap: 120,
        embedding_model: "nomic-embed-text",
        status: "ready",
        document_count: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    apiMocks.listSessions.mockResolvedValue([
      {
        id: "session-1",
        kb_id: "kb-1",
        prompt_id: "prompt-1",
        model_name: "llama3.2",
        message_count: 2,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ]);
    apiMocks.getMessages.mockResolvedValue([
      {
        id: "message-1",
        session_id: "session-1",
        role: "user",
        content: "舊訊息",
        sources: null,
        created_at: new Date().toISOString(),
      },
      {
        id: "message-2",
        session_id: "session-1",
        role: "assistant",
        content: "舊回答",
        sources: { items: [] },
        created_at: new Date().toISOString(),
      },
    ]);
    apiMocks.streamChat.mockImplementation(() => new Promise(() => {}));
  });

  it("scrolls to the bottom when sending a message after scrolling up", async () => {
    renderHome();

    await waitFor(() => {
      expect(apiMocks.getMessages).toHaveBeenCalledWith("session-1");
    });

    const viewport = await screen.findByTestId("chat-message-viewport");
    const scrollTo = vi.mocked(viewport.scrollTo);

    Object.defineProperty(viewport, "scrollHeight", {
      configurable: true,
      value: 1000,
    });
    Object.defineProperty(viewport, "clientHeight", {
      configurable: true,
      value: 300,
    });
    Object.defineProperty(viewport, "scrollTop", {
      configurable: true,
      writable: true,
      value: 100,
    });
    fireEvent.scroll(viewport);
    scrollTo.mockClear();

    fireEvent.change(screen.getByLabelText("chat-input"), {
      target: { value: "新的問題" },
    });
    fireEvent.click(screen.getByRole("button", { name: "send" }));

    await waitFor(() => {
      expect(scrollTo).toHaveBeenCalledWith({
        top: 1000,
        behavior: "auto",
      });
    });
  });
});
