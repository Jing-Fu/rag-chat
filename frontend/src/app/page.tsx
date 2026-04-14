"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
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

const EMPTY_STATE_PROMPTS = [
  {
    title: "Summarize docs",
    description: "Pull out the most important themes from the selected knowledge base.",
    prompt: "請幫我總結這個知識庫的重要重點。",
  },
  {
    title: "Explain retrieval",
    description: "Describe how vector retrieval influences grounded answers in this workspace.",
    prompt: "請解釋向量檢索在 RAG 流程中的角色。",
  },
];

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
      mainClassName="flex flex-1 flex-col px-5 pt-0 sm:px-8 lg:px-10"
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
        <div className="border-t border-border bg-white px-5 py-5 sm:px-8 lg:px-10">
          <div className="mx-auto max-w-5xl">
            <ChatInput
              value={composerValue}
              onChange={setComposerValue}
              onSubmit={handleSendMessage}
              disabled={!canSend}
              isSending={isStreaming}
              errorMessage={streamError}
              placeholder={
                selectedKnowledgeBaseId
                  ? "Ask a grounded question based on the selected knowledge base"
                  : "Select a knowledge base before sending a message"
              }
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Responses are generated locally and depend on the selected model, prompt, and knowledge base.
            </p>
          </div>
        </div>
      }
    >
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col">
        {(pageError || messagesError || (!pageError && !isDataLoading && (knowledgeBasesQuery.data?.length ?? 0) === 0)) && (
          <div className="space-y-3 pt-6">
            {pageError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Failed to load required data
                </p>
                <p className="mt-1">{pageError}</p>
              </div>
            ) : null}
            {messagesError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  Failed to load session messages
                </p>
                <p className="mt-1">{messagesError}</p>
              </div>
            ) : null}
            {!pageError && !isDataLoading && (knowledgeBasesQuery.data?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                No knowledge bases found. Create one in the Knowledge page to enable grounded responses.
              </div>
            ) : null}
          </div>
        )}

        {messageList.length > 0 && !messagesError ? (
          <div className="flex-1 pt-8">
            <ChatMessageList messages={messageList} isStreaming={isStreaming} />
          </div>
        ) : null}

        {showEmptyState ? (
          <div className="flex flex-1 flex-col items-center justify-center px-0 py-12 text-center sm:px-4">
            <p className="mono-label">local rag workspace</p>
            <h2 className="display-title mt-5 max-w-3xl text-4xl leading-none text-foreground sm:text-5xl">
              Ask better questions of your own data.
            </h2>
            <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
              Pick a model, prompt, and knowledge base above. The interface stays out of the way so the retrieved context can do the work.
            </p>

            <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
              {EMPTY_STATE_PROMPTS.map((item) => (
                <button
                  key={item.title}
                  type="button"
                  onClick={() => setComposerValue(item.prompt)}
                  className="surface-panel p-5 text-left transition-colors hover:bg-neutral-50"
                >
                  <span className="mono-label text-neutral-400">prompt</span>
                  <span className="mt-3 block text-base font-medium text-foreground">{item.title}</span>
                  <span className="mt-2 block text-sm leading-6 text-muted-foreground">{item.description}</span>
                </button>
              ))}
            </div>

            <p className="mt-8 text-xs text-muted-foreground">
              Current knowledge base: {knowledgeBasesQuery.data?.find((item) => item.id === selectedKnowledgeBaseId)?.name ?? "none selected"}
            </p>
          </div>
        ) : null}
      </div>
    </DashboardShell>
  );
}
