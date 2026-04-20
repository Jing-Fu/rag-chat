import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import KnowledgePage from "@/app/knowledge/page";

const apiMocks = vi.hoisted(() => ({
  listKnowledgeBases: vi.fn(),
  listDocuments: vi.fn(),
  createKnowledgeBase: vi.fn(),
  deleteKnowledgeBase: vi.fn(),
  uploadDocument: vi.fn(),
  reindexDocument: vi.fn(),
  deleteDocument: vi.fn(),
  listModels: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  ApiError: class ApiError extends Error {},
  knowledgeApi: {
    list: apiMocks.listKnowledgeBases,
    listDocuments: apiMocks.listDocuments,
    create: apiMocks.createKnowledgeBase,
    delete: apiMocks.deleteKnowledgeBase,
    upload: apiMocks.uploadDocument,
    reindexDocument: apiMocks.reindexDocument,
    deleteDocument: apiMocks.deleteDocument,
  },
  modelApi: {
    list: apiMocks.listModels,
  },
}));

vi.mock("@/components/layout/dashboard-shell", () => ({
  DashboardShell: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/layout/page-header", () => ({
  PageHeader: ({ title, actions }: { title: string; actions?: React.ReactNode }) => (
    <header>
      <h1>{title}</h1>
      {actions}
    </header>
  ),
}));

vi.mock("@/components/layout/page-section", () => ({
  PageSection: ({
    title,
    description,
    actions,
    children,
  }: {
    title: string;
    description?: string;
    actions?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <section>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
      {actions}
      {children}
    </section>
  ),
}));

vi.mock("@/components/layout/pill-panel", () => ({
  PillPanel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button {...props}>{children}</button>
  ),
}));

function createModel(name: string, modelType: "llm" | "embed") {
  return {
    name,
    size: null,
    model_type: modelType,
    modified_at: null,
  };
}

function createKnowledgeBase() {
  return {
    id: "kb-1",
    name: "產品手冊",
    description: null,
    chunk_size: 1000,
    chunk_overlap: 200,
    embedding_model: "nomic-embed-text",
    status: "ready",
    document_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}

function renderKnowledgePage() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <KnowledgePage />
    </QueryClientProvider>,
  );
}

describe("KnowledgePage", () => {
  beforeEach(() => {
    vi.clearAllMocks();

    apiMocks.listKnowledgeBases.mockResolvedValue([]);
    apiMocks.listDocuments.mockResolvedValue([]);
    apiMocks.createKnowledgeBase.mockResolvedValue(createKnowledgeBase());
    apiMocks.deleteKnowledgeBase.mockResolvedValue(undefined);
    apiMocks.uploadDocument.mockResolvedValue(undefined);
    apiMocks.reindexDocument.mockResolvedValue(undefined);
    apiMocks.deleteDocument.mockResolvedValue(undefined);
    apiMocks.listModels.mockResolvedValue([
      createModel("llama3.2", "llm"),
      createModel("nomic-embed-text", "embed"),
      createModel("bge-m3", "embed"),
    ]);
  });

  it("shows only embedding models in the knowledge base form", async () => {
    renderKnowledgePage();

    fireEvent.click(screen.getByRole("button", { name: "新增知識庫" }));

    const embeddingSelect = await screen.findByRole("combobox", { name: "嵌入模型" });

    await waitFor(() => {
      expect(embeddingSelect).toHaveValue("nomic-embed-text");
    });

    expect(screen.getByRole("option", { name: "nomic-embed-text" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "bge-m3" })).toBeInTheDocument();
    expect(screen.queryByRole("option", { name: "llama3.2" })).not.toBeInTheDocument();
  });

  it("disables knowledge base creation when no embedding models are available", async () => {
    apiMocks.listModels.mockResolvedValue([createModel("llama3.2", "llm")]);

    renderKnowledgePage();

    fireEvent.click(screen.getByRole("button", { name: "新增知識庫" }));

    expect(
      await screen.findByText("目前沒有可用的嵌入模型，請先到模型頁面下載至少一個 embedding model。"),
    ).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "嵌入模型" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "建立" })).toBeDisabled();
  });

  it("submits the selected embedding model when creating a knowledge base", async () => {
    renderKnowledgePage();

    fireEvent.click(screen.getByRole("button", { name: "新增知識庫" }));

    const embeddingSelect = await screen.findByRole("combobox", { name: "嵌入模型" });

    await waitFor(() => {
      expect(embeddingSelect).toHaveValue("nomic-embed-text");
    });

    fireEvent.change(screen.getByPlaceholderText("名稱"), {
      target: { value: "產品手冊" },
    });
    fireEvent.change(embeddingSelect, {
      target: { value: "bge-m3" },
    });
    fireEvent.click(screen.getByRole("button", { name: "建立" }));

    await waitFor(() => {
      expect(apiMocks.createKnowledgeBase).toHaveBeenCalled();
      expect(apiMocks.createKnowledgeBase.mock.calls[0][0]).toEqual({
        name: "產品手冊",
        description: null,
        chunk_size: 1000,
        chunk_overlap: 200,
        embedding_model: "bge-m3",
      });
    });
  });
});