"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Bot } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { ChatHeader } from "@/components/chat/chat-header";
import { ChatInput } from "@/components/chat/chat-input";
import { ChatMessageList } from "@/components/chat/chat-message-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  type ApiError,
  type ChatMessageItem,
  chatApi,
  knowledgeApi,
  modelApi,
  promptApi,
} from "@/lib/api";
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
  const queryClient = useQueryClient();
  const [composerValue, setComposerValue] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingRequestMessage, setPendingRequestMessage] = useState<string | null>(null);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessageItem[] | null>(null);

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
    selectedSessionId,
    selectedModelName,
    selectedPromptId,
    selectedKnowledgeBaseId,
    setSelectedModelName,
    setSelectedPromptId,
    setSelectedKnowledgeBaseId,
    setSelectedSessionId,
    resetSessionSelection,
  } = useChatUiStore();

  const messagesQuery = useQuery({
    queryKey: ["chat-messages", selectedSessionId],
    queryFn: () => chatApi.getMessages(selectedSessionId as string),
    enabled: Boolean(selectedSessionId),
  });

  const chatModels = useMemo(
    () => (modelsQuery.data ?? []).filter((model) => model.model_type === "llm"),
    [modelsQuery.data],
  );

  const messageList = useMemo(() => {
    const resolvedMessageList = optimisticMessages ?? messagesQuery.data ?? [];

    if (resolvedMessageList.length > 0 || !isStreaming || !pendingRequestMessage) {
      return resolvedMessageList;
    }

    const createdAt = new Date().toISOString();
    return [
      {
        id: "pending-user",
        session_id: selectedSessionId ?? "pending",
        role: "user",
        content: pendingRequestMessage,
        sources: null,
        created_at: createdAt,
      },
      {
        id: "pending-assistant",
        session_id: selectedSessionId ?? "pending",
        role: "assistant",
        content: "",
        sources: { items: [] },
        created_at: createdAt,
      },
    ] satisfies ChatMessageItem[];
  }, [isStreaming, messagesQuery.data, optimisticMessages, pendingRequestMessage, selectedSessionId]);

  useEffect(() => {
    if (chatModels.length === 0) {
      if (selectedModelName) {
        setSelectedModelName(null);
      }
      return;
    }

    const hasSelectedChatModel = chatModels.some((model) => model.name === selectedModelName);
    if (!hasSelectedChatModel) {
      setSelectedModelName(chatModels[0].name);
    }
  }, [chatModels, selectedModelName, setSelectedModelName]);

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
  const messagesError = getErrorMessage(messagesQuery.error as ApiError | null);
  const showEmptyState = messageList.length === 0 && !isStreaming;

  const canSend = Boolean(selectedKnowledgeBaseId && selectedModelName && !isDataLoading && !pageError);

  function handleSelectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setOptimisticMessages(null);
    setPendingRequestMessage(null);
    setStreamError(null);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!window.confirm("Delete this chat session? This action cannot be undone.")) {
      return;
    }

    setDeletingSessionId(sessionId);
    setStreamError(null);

    try {
      await chatApi.deleteSession(sessionId);
      queryClient.removeQueries({ queryKey: ["chat-messages", sessionId] });
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });

      if (selectedSessionId === sessionId) {
        resetSessionSelection();
        setOptimisticMessages(null);
        setPendingRequestMessage(null);
        setStreamError(null);
      }
    } catch (error) {
      setStreamError(getErrorMessage(error) ?? "Failed to delete chat session");
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function handleSendMessage() {
    const message = composerValue.trim();
    if (!message || !canSend || !selectedKnowledgeBaseId || !selectedModelName) {
      if (!selectedKnowledgeBaseId) {
        setStreamError("Select a knowledge base before sending a message.");
      }
      return;
    }

    const initialMessages = optimisticMessages ?? messagesQuery.data ?? [];
    const userMessage: ChatMessageItem = {
      id: `tmp-user-${Date.now()}`,
      session_id: selectedSessionId ?? "pending",
      role: "user",
      content: message,
      sources: null,
      created_at: new Date().toISOString(),
    };
    const assistantMessage: ChatMessageItem = {
      id: `tmp-assistant-${Date.now()}`,
      session_id: selectedSessionId ?? "pending",
      role: "assistant",
      content: "",
      sources: { items: [] },
      created_at: new Date().toISOString(),
    };

    setComposerValue("");
    setStreamError(null);
    setPendingRequestMessage(message);
    setIsStreaming(true);
    setOptimisticMessages([...initialMessages, userMessage, assistantMessage]);

    let resolvedSessionId: string | null = selectedSessionId;
    try {
      const result = await chatApi.streamChat(
        {
          message,
          kb_id: selectedKnowledgeBaseId,
          model_name: selectedModelName,
          prompt_id: selectedPromptId,
          session_id: selectedSessionId,
        },
        {
          onSession: (sessionId) => {
            resolvedSessionId = sessionId;
            setSelectedSessionId(sessionId);
          },
          onToken: (token) => {
            setOptimisticMessages((prev) => {
              if (!prev || prev.length === 0) {
                return prev;
              }
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, content: `${last.content}${token}` };
              return next;
            });
          },
          onDone: (payload) => {
            resolvedSessionId = payload.session_id;
            setOptimisticMessages((prev) => {
              if (!prev || prev.length === 0) {
                return prev;
              }
              const next = [...prev];
              const last = next[next.length - 1];
              next[next.length - 1] = { ...last, sources: { items: payload.sources } };
              return next;
            });
          },
          onError: (messageText) => {
            setStreamError(messageText);
          },
        },
      );

      if (result.fullText) {
        setOptimisticMessages((prev) => {
          if (!prev || prev.length === 0) {
            return prev;
          }
          const next = [...prev];
          const last = next[next.length - 1];
          next[next.length - 1] = {
            ...last,
            content: result.fullText,
            sources: { items: result.sources },
          };
          return next;
        });
      }

      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      if (resolvedSessionId) {
        await queryClient.invalidateQueries({ queryKey: ["chat-messages", resolvedSessionId] });
        setSelectedSessionId(resolvedSessionId);
      }
      setPendingRequestMessage(null);
      setOptimisticMessages(null);
    } catch (error) {
      const errorMessage = getErrorMessage(error) ?? "Failed to stream response";
      setStreamError(errorMessage);
      setOptimisticMessages((prev) => {
        if (!prev || prev.length === 0) {
          return prev;
        }
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = {
          ...last,
          content: last.content || "Response interrupted.",
        };
        return next;
      });
    } finally {
      setPendingRequestMessage(null);
      setIsStreaming(false);
    }
  }

  function handleNewChat() {
    resetSessionSelection();
    setComposerValue("");
    setStreamError(null);
    setPendingRequestMessage(null);
    setOptimisticMessages(null);
  }

  return (
    <DashboardShell
      sidebarProps={{
        sessions: sessionsQuery.data ?? [],
        isSessionsLoading: sessionsQuery.isPending,
        sessionsError,
        selectedSessionId,
        onSelectSession: handleSelectSession,
        onNewChat: handleNewChat,
        onDeleteSession: handleDeleteSession,
        deletingSessionId,
      }}
      header={
        <ChatHeader
          models={chatModels}
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
          <ChatInput
            value={composerValue}
            onChange={setComposerValue}
            onSubmit={handleSendMessage}
            disabled={!canSend}
            isSending={isStreaming}
            errorMessage={streamError}
            placeholder={
              selectedKnowledgeBaseId
                ? "Ask a grounded question based on the selected knowledge base..."
                : "Select a knowledge base before sending a message..."
            }
          />
          <p className="text-center text-xs text-muted-foreground mt-3">
            RAG Platform generates answers locally. Responses may vary based on selected context.
          </p>
        </div>
      }
    >
      {messageList.length > 0 && !messagesError && (
        <ChatMessageList messages={messageList} isStreaming={isStreaming} />
      )}

      {showEmptyState && (
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

          {messagesError && (
            <div className="mb-8 w-full rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
              <p className="flex items-center gap-2 font-medium">
                <AlertTriangle className="w-4 h-4" />
                Failed to load session messages
              </p>
              <p className="mt-1 text-red-100/80">{messagesError}</p>
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
              onClick={() => setComposerValue("請幫我總結這個知識庫的重要重點。")}
              className="text-left px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm text-foreground/80"
            >
              <span className="block font-medium text-foreground mb-1">Summarize docs</span>
              Using {knowledgeBasesQuery.data?.[0]?.name ?? "your selected knowledge base"}
            </button>
            <button
              type="button"
              onClick={() => setComposerValue("請解釋向量檢索在 RAG 流程中的角色。")}
              className="text-left px-4 py-3 rounded-2xl border border-border bg-card hover:bg-secondary/50 transition-colors text-sm text-foreground/80"
            >
              <span className="block font-medium text-foreground mb-1">Explain vector search</span>
              Using{" "}
              {promptsQuery.data?.find((item) => item.id === selectedPromptId)?.name ?? "selected prompt"}
            </button>
          </div>
        </div>
      )}
    </DashboardShell>
  );
}
