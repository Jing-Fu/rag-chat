"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bot } from "lucide-react";
import { useEffect, useMemo } from "react";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { type ApiError, chatApi, knowledgeApi, modelApi, promptApi } from "@/lib/api";
import { useChatUiStore } from "@/stores";

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export default function Home() {
  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: modelApi.list,
  });
  const promptsQuery = useQuery({
    queryKey: ["prompts"],
    queryFn: promptApi.list,
  });
  const knowledgeBasesQuery = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: knowledgeApi.list,
  });
  const sessionsQuery = useQuery({
    queryKey: ["chat-sessions"],
    queryFn: chatApi.listSessions,
  });

  const {
    selectedModelName,
    selectedPromptId,
    selectedKnowledgeBaseId,
    selectedSessionId,
    setSelectedModelName,
    setSelectedPromptId,
    setSelectedKnowledgeBaseId,
    setSelectedSessionId,
    resetSessionSelection,
  } = useChatUiStore();

  useEffect(() => {
    if (!selectedModelName && modelsQuery.data && modelsQuery.data.length > 0) {
      setSelectedModelName(modelsQuery.data[0].name);
    }
  }, [modelsQuery.data, selectedModelName, setSelectedModelName]);

  useEffect(() => {
    if (!selectedPromptId && promptsQuery.data && promptsQuery.data.length > 0) {
      const defaultPrompt = promptsQuery.data.find((item) => item.is_default) ?? promptsQuery.data[0];
      setSelectedPromptId(defaultPrompt.id);
    }
  }, [promptsQuery.data, selectedPromptId, setSelectedPromptId]);

  useEffect(() => {
    if (!selectedKnowledgeBaseId && knowledgeBasesQuery.data && knowledgeBasesQuery.data.length > 0) {
      setSelectedKnowledgeBaseId(knowledgeBasesQuery.data[0].id);
    }
  }, [knowledgeBasesQuery.data, selectedKnowledgeBaseId, setSelectedKnowledgeBaseId]);

  const isDataLoading =
    modelsQuery.isPending || promptsQuery.isPending || knowledgeBasesQuery.isPending;

  const pageError = useMemo(() => {
    return (
      getErrorMessage(modelsQuery.error as ApiError | null) ??
      getErrorMessage(promptsQuery.error as ApiError | null) ??
      getErrorMessage(knowledgeBasesQuery.error as ApiError | null)
    );
  }, [knowledgeBasesQuery.error, modelsQuery.error, promptsQuery.error]);

  const sessionsError = getErrorMessage(sessionsQuery.error as ApiError | null);

  return (
    <DashboardShell
      sidebarProps={{
        sessions: sessionsQuery.data ?? [],
        isSessionsLoading: sessionsQuery.isPending,
        sessionsError,
        selectedSessionId,
        onSelectSession: setSelectedSessionId,
        onNewChat: resetSessionSelection,
      }}
      header={
        <ChatHeader
          models={modelsQuery.data ?? []}
          prompts={promptsQuery.data ?? []}
          knowledgeBases={knowledgeBasesQuery.data ?? []}
          selectedModelName={selectedModelName}
          selectedPromptId={selectedPromptId}
          selectedKnowledgeBaseId={selectedKnowledgeBaseId}
          isLoading={isDataLoading}
          hasError={Boolean(pageError)}
          onSelectModelName={setSelectedModelName}
          onSelectPromptId={setSelectedPromptId}
          onSelectKnowledgeBaseId={setSelectedKnowledgeBaseId}
        />
      }
      footer={
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-6 px-4">
          <ChatInput />
          <p className="text-center text-xs text-muted-foreground mt-3">
            RAG Platform generates answers locally. Responses may vary based on selected context.
          </p>
        </div>
      }
    >
      <div className="h-full flex flex-col items-center justify-center max-w-2xl mx-auto px-4 pt-12 pb-32">
        {pageError && (
          <div className="mb-8 w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            <p className="flex items-center gap-2 font-medium">
              <AlertTriangle className="w-4 h-4" />
              Failed to load required data
            </p>
            <p className="mt-1 text-red-100/80">{pageError}</p>
          </div>
        )}

        {!pageError && !isDataLoading && (knowledgeBasesQuery.data?.length ?? 0) === 0 && (
          <div className="mb-8 w-full rounded-xl border border-amber-500/30 bg-amber-500/10 p-4 text-sm text-amber-100">
            No knowledge bases found. Create one in the Knowledge page to enable grounded responses.
          </div>
        )}

        <div className="w-16 h-16 rounded-3xl bg-secondary flex items-center justify-center mb-6 shadow-sm border border-border">
          <Bot className="w-8 h-8 text-foreground" />
        </div>
        <h2 className="text-2xl font-semibold mb-3 text-foreground">How can I help you today?</h2>
        <p className="text-muted-foreground text-center text-[15px] max-w-md">
          Start typing to chat. To run a grounded RAG query, ensure you have selected a
          <strong className="text-foreground font-medium mx-1">Knowledge Base</strong>
          from the top menu.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-12 w-full">
          <button
            type="button"
            className="text-left px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm text-foreground/80"
          >
            <span className="block font-medium text-foreground mb-1">Summarize docs</span>
            Using {knowledgeBasesQuery.data?.[0]?.name ?? "your selected knowledge base"}
          </button>
          <button
            type="button"
            className="text-left px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm text-foreground/80"
          >
            <span className="block font-medium text-foreground mb-1">Explain vector search</span>
            Using {promptsQuery.data?.find((item) => item.id === selectedPromptId)?.name ?? "selected prompt"}
          </button>
        </div>
      </div>
    </DashboardShell>
  );
}
