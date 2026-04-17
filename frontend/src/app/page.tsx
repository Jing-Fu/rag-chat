"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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
    title: "總結知識庫重點",
    description: "從目前選定的知識庫中整理最重要的主題與觀點。",
    prompt: "請幫我總結這個知識庫的重要重點。",
  },
  {
    title: "說明混合檢索",
    description: "解釋向量與關鍵字檢索如何一起影響這個工作區的回答品質。",
    prompt: "請解釋混合檢索在這個 RAG 工作區中的作用。",
  },
];

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return "未知錯誤";
}

export default function Home() {
  const queryClient = useQueryClient();
  const messageViewportRef = useRef<HTMLDivElement | null>(null);
  const [composerValue, setComposerValue] = useState("");
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [pendingRequestMessage, setPendingRequestMessage] = useState<string | null>(null);
  const [isDeletingAllSessions, setIsDeletingAllSessions] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null);
  const [optimisticMessages, setOptimisticMessages] = useState<ChatMessageItem[] | null>(null);
  const [shouldStickToBottom, setShouldStickToBottom] = useState(true);

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

  useEffect(() => {
    if (
      isStreaming ||
      !selectedSessionId ||
      !sessionsQuery.data ||
      sessionsQuery.isPending ||
      sessionsQuery.isFetching
    ) {
      return;
    }

    const hasSelectedSession = sessionsQuery.data.some((session) => session.id === selectedSessionId);
    if (hasSelectedSession) {
      return;
    }

    queryClient.removeQueries({ queryKey: ["chat-messages", selectedSessionId] });
    resetSessionSelection();
    setOptimisticMessages(null);
    setPendingRequestMessage(null);
    setStreamError(null);
  }, [
    isStreaming,
    queryClient,
    resetSessionSelection,
    selectedSessionId,
    sessionsQuery.data,
    sessionsQuery.isFetching,
    sessionsQuery.isPending,
  ]);

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

  useEffect(() => {
    setShouldStickToBottom(true);
  }, [selectedSessionId]);

  useEffect(() => {
    const viewport = messageViewportRef.current;

    if (!viewport) {
      return;
    }

    const handleScroll = () => {
      const distanceFromBottom = viewport.scrollHeight - viewport.scrollTop - viewport.clientHeight;
      setShouldStickToBottom(distanceFromBottom <= 96);
    };

    handleScroll();
    viewport.addEventListener("scroll", handleScroll, { passive: true });

    return () => {
      viewport.removeEventListener("scroll", handleScroll);
    };
  }, []);

  useEffect(() => {
    const viewport = messageViewportRef.current;

    if (!viewport || !shouldStickToBottom) {
      return;
    }

    viewport.scrollTo({
      top: viewport.scrollHeight,
      behavior: isStreaming ? "auto" : "smooth",
    });
  }, [isStreaming, messageList, shouldStickToBottom]);

  function handleSelectSession(sessionId: string) {
    setSelectedSessionId(sessionId);
    setOptimisticMessages(null);
    setPendingRequestMessage(null);
    setStreamError(null);
  }

  async function handleDeleteSession(sessionId: string) {
    if (!window.confirm("要刪除這筆聊天紀錄嗎？此操作無法復原。")) {
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
      setStreamError(getErrorMessage(error) ?? "刪除聊天紀錄失敗");
    } finally {
      setDeletingSessionId(null);
    }
  }

  async function handleDeleteAllSessions() {
    if (!sessionsQuery.data || sessionsQuery.data.length === 0) {
      return;
    }
    if (!window.confirm("要刪除所有聊天紀錄嗎？此操作無法復原。")) {
      return;
    }

    setIsDeletingAllSessions(true);
    setStreamError(null);

    try {
      await chatApi.deleteAllSessions();
      queryClient.removeQueries({ queryKey: ["chat-messages"] });
      await queryClient.invalidateQueries({ queryKey: ["chat-sessions"] });
      resetSessionSelection();
      setOptimisticMessages(null);
      setPendingRequestMessage(null);
      setStreamError(null);
    } catch (error) {
      setStreamError(getErrorMessage(error) ?? "刪除全部聊天紀錄失敗");
    } finally {
      setIsDeletingAllSessions(false);
    }
  }

  async function handleSendMessage() {
    const message = composerValue.trim();
    if (!message || !canSend || !selectedKnowledgeBaseId || !selectedModelName) {
      if (!selectedKnowledgeBaseId) {
        setStreamError("送出訊息前請先選擇知識庫。");
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

    setShouldStickToBottom(true);
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
      const errorMessage = getErrorMessage(error) ?? "串流回應失敗";
      setStreamError(errorMessage);
      setOptimisticMessages((prev) => {
        if (!prev || prev.length === 0) {
          return prev;
        }
        const next = [...prev];
        const last = next[next.length - 1];
        next[next.length - 1] = {
          ...last,
          content: last.content || "回應已中斷。",
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
      mainClassName="flex min-h-0 flex-1 flex-col overflow-hidden px-5 pt-0 sm:px-8 lg:px-10"
      sidebarProps={{
        sessions: sessionsQuery.data ?? [],
        isSessionsLoading: sessionsQuery.isPending,
        sessionsError,
        selectedSessionId,
        onSelectSession: handleSelectSession,
        onNewChat: handleNewChat,
        onDeleteAllSessions: handleDeleteAllSessions,
        onDeleteSession: handleDeleteSession,
        isDeletingAllSessions,
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
        <div className="shrink-0 border-t border-border bg-white px-5 py-5 sm:px-8 lg:px-10">
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
                  ? "根據目前選定的知識庫提出有依據的問題"
                  : "送出訊息前請先選擇知識庫"
              }
            />
            <p className="mt-3 text-center text-xs text-muted-foreground">
              回應會在本機產生，並依賴目前選擇的模型、提示詞與知識庫。
            </p>
          </div>
        </div>
      }
    >
      <div className="mx-auto flex min-h-0 w-full max-w-5xl flex-1 flex-col">
        {(pageError || messagesError || (!pageError && !isDataLoading && (knowledgeBasesQuery.data?.length ?? 0) === 0)) && (
          <div className="shrink-0 space-y-3 pt-6">
            {pageError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  載入必要資料失敗
                </p>
                <p className="mt-1">{pageError}</p>
              </div>
            ) : null}
            {messagesError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                <p className="flex items-center gap-2 font-medium">
                  <AlertTriangle className="h-4 w-4" />
                  載入對話訊息失敗
                </p>
                <p className="mt-1">{messagesError}</p>
              </div>
            ) : null}
            {!pageError && !isDataLoading && (knowledgeBasesQuery.data?.length ?? 0) === 0 ? (
              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                目前沒有知識庫。請先到知識庫頁面建立資料，才能使用有依據的回答。
              </div>
            ) : null}
          </div>
        )}
        <div
          ref={messageViewportRef}
          data-testid="chat-message-viewport"
          className="min-h-0 flex-1 overflow-y-auto"
        >
          {messageList.length > 0 && !messagesError ? (
            <div className="min-h-full pt-8">
              <ChatMessageList messages={messageList} isStreaming={isStreaming} />
            </div>
          ) : null}

          {showEmptyState ? (
            <div className="flex min-h-full flex-col items-center justify-center px-0 py-12 text-center sm:px-4">
              <p className="mono-label">本機 rag 工作區</p>
              <h2 className="display-title mt-5 max-w-3xl text-4xl leading-none text-foreground sm:text-5xl">
                用自己的資料問出更有依據的答案。
              </h2>
              <p className="mt-4 max-w-xl text-[15px] leading-7 text-muted-foreground">
                先選擇模型、提示詞與知識庫。介面會保持簡潔，讓檢索到的上下文真正發揮作用。
              </p>

              <div className="mt-10 grid w-full max-w-3xl grid-cols-1 gap-3 sm:grid-cols-2">
                {EMPTY_STATE_PROMPTS.map((item) => (
                  <button
                    key={item.title}
                    type="button"
                    onClick={() => setComposerValue(item.prompt)}
                    className="surface-panel p-5 text-left transition-colors hover:bg-neutral-50"
                  >
                    <span className="mono-label text-neutral-400">範例提問</span>
                    <span className="mt-3 block text-base font-medium text-foreground">{item.title}</span>
                    <span className="mt-2 block text-sm leading-6 text-muted-foreground">{item.description}</span>
                  </button>
                ))}
              </div>

              <p className="mt-8 text-xs text-muted-foreground">
                目前知識庫：
                {" "}
                {knowledgeBasesQuery.data?.find((item) => item.id === selectedKnowledgeBaseId)?.name ?? "尚未選擇"}
              </p>
            </div>
          ) : null}
        </div>
      </div>
    </DashboardShell>
  );
}
