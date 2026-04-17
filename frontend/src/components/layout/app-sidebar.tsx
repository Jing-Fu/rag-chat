"use client";

import {
  Cpu,
  Database,
  Menu,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  PenTool,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

import { ScrollArea } from "@/components/ui/scroll-area";
import type { ChatSessionSummary } from "@/lib/api";
import { useChatUiStore } from "@/stores";

export type AppSidebarProps = {
  sessions?: ChatSessionSummary[];
  isSessionsLoading?: boolean;
  sessionsError?: string | null;
  selectedSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
  onDeleteAllSessions?: () => void;
  onDeleteSession?: (sessionId: string) => void;
  isDeletingAllSessions?: boolean;
  deletingSessionId?: string | null;
};

const routeItems = [
  { href: "/", label: "聊天", icon: MessageSquare },
  { href: "/knowledge", label: "知識庫", icon: Database },
  { href: "/models", label: "模型", icon: Cpu },
  { href: "/prompts", label: "提示詞模板", icon: PenTool },
  { href: "/endpoints", label: "API 端點", icon: LinkIcon },
];

function getRouteLabel(pathname: string) {
  return routeItems.find((item) => item.href === pathname)?.label ?? "RAG 工作區";
}

function getSessionLabel(session: ChatSessionSummary) {
  return session.message_count > 0
    ? `對話 ${session.id.slice(0, 8)} · ${session.message_count} 則訊息`
    : `對話 ${session.id.slice(0, 8)}`;
}

export function AppSidebar({
  sessions = [],
  isSessionsLoading = false,
  sessionsError = null,
  selectedSessionId = null,
  onSelectSession,
  onNewChat,
  onDeleteAllSessions,
  onDeleteSession,
  isDeletingAllSessions = false,
  deletingSessionId = null,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasSessions = sessions.length > 0;
  const sessionCountLabel = `${sessions.length} 筆`;
  const resetSessionSelection = useChatUiStore((state) => state.resetSessionSelection);

  function handleNewChatClick() {
    if (onNewChat) {
      onNewChat();
    } else {
      resetSessionSelection();
    }

    if (pathname !== "/") {
      router.push("/");
    }

    setMobileMenuOpen(false);
  }

  function handleNavigate() {
    setMobileMenuOpen(false);
  }

  return (
    <>
      <div className="sticky top-0 z-30 flex items-center justify-between border-b border-border bg-white/95 px-5 py-4 backdrop-blur lg:hidden">
        <div>
          <p className="mono-label">本機 rag</p>
          <p className="display-title mt-1 text-lg text-foreground">{getRouteLabel(pathname)}</p>
        </div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? "關閉導覽" : "開啟導覽"}
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          className="inline-flex size-10 items-center justify-center rounded-full border border-input bg-card text-foreground"
        >
          {mobileMenuOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
        </button>
      </div>

      {mobileMenuOpen ? (
        <div className="fixed inset-0 z-40 bg-white px-5 py-5 lg:hidden">
          <div className="flex h-full flex-col gap-6">
            <div className="flex items-start justify-between border-b border-border pb-5">
              <div>
                <p className="mono-label">工作區</p>
                <p className="display-title mt-2 text-2xl text-foreground">RAG 工作區</p>
              </div>
              <button
                type="button"
                aria-label="關閉導覽"
                onClick={() => setMobileMenuOpen(false)}
                className="inline-flex size-10 items-center justify-center rounded-full border border-input bg-card text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleNewChatClick}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900"
            >
              <Plus className="h-4 w-4" />
              新對話
            </button>

            <div className="space-y-2">
              {routeItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={handleNavigate}
                    className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm transition-colors ${
                      isActive ? "bg-neutral-200 text-neutral-900" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex min-h-0 flex-1 flex-col border-t border-border pt-5">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div>
                  <p className="mono-label">對話紀錄</p>
                  <p className="mt-1 text-xs text-muted-foreground">{sessionCountLabel}</p>
                </div>
                {onDeleteAllSessions && hasSessions ? (
                  <button
                    type="button"
                    onClick={onDeleteAllSessions}
                    disabled={isDeletingAllSessions}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isDeletingAllSessions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                    全部刪除
                  </button>
                ) : null}
              </div>
              <ScrollArea data-testid="mobile-session-scroll-area" className="h-0 flex-1 pr-1">
                <div className="space-y-2 pb-6">
                  {isSessionsLoading ? <p className="muted-copy px-1">載入聊天紀錄中...</p> : null}
                  {!isSessionsLoading && sessionsError ? <p className="text-sm text-red-600">{sessionsError}</p> : null}
                  {!isSessionsLoading && !sessionsError && !hasSessions ? (
                    <p className="muted-copy px-1">目前還沒有聊天紀錄。</p>
                  ) : null}
                  {!isSessionsLoading && !sessionsError && sessions.map((session) => (
                    <div key={session.id} className="flex items-center gap-2 rounded-full border border-border px-3 py-2">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSession?.(session.id);
                          setMobileMenuOpen(false);
                        }}
                        className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                      >
                        <MessageSquare className="h-4 w-4 shrink-0 text-neutral-400" />
                        <span className="truncate text-neutral-700">{getSessionLabel(session)}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>
          </div>
        </div>
      ) : null}

      <aside className="hidden h-full min-h-0 w-[280px] shrink-0 border-r border-border bg-white lg:flex">
        <div className="flex h-full min-h-0 w-full flex-col px-4 py-5">
          <div className="border-b border-border pb-5">
            <p className="mono-label">本機 rag</p>
            <p className="display-title mt-2 text-2xl text-foreground">RAG 工作區</p>
            <p className="mt-2 text-sm text-muted-foreground">有依據的對話、本機模型與檢索工作流。</p>
          </div>

          <button
            type="button"
            onClick={handleNewChatClick}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-300"
          >
            <Plus className="h-4 w-4" />
            新對話
          </button>

          <nav className="mt-6 space-y-2">
            {routeItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-full px-4 py-3 text-sm transition-colors ${
                    isActive ? "bg-neutral-200 text-neutral-900" : "text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-8 flex min-h-0 flex-1 flex-col border-t border-border pt-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <div>
                <p className="mono-label">對話紀錄</p>
                <p className="mt-1 text-xs text-muted-foreground">{sessionCountLabel}</p>
              </div>
              {onDeleteAllSessions && hasSessions ? (
                <button
                  type="button"
                  onClick={onDeleteAllSessions}
                  disabled={isDeletingAllSessions}
                  className="inline-flex items-center gap-1 rounded-full border border-border px-3 py-1.5 text-xs text-neutral-600 transition hover:bg-neutral-100 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isDeletingAllSessions ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  全部刪除
                </button>
              ) : null}
            </div>
            <ScrollArea data-testid="desktop-session-scroll-area" className="h-0 flex-1 pr-1">
              <div className="space-y-2 pb-4">
                {isSessionsLoading ? <p className="muted-copy px-1">載入聊天紀錄中...</p> : null}
                {!isSessionsLoading && sessionsError ? <p className="text-sm text-red-600">{sessionsError}</p> : null}
                {!isSessionsLoading && !sessionsError && !hasSessions ? (
                  <p className="muted-copy px-1">目前還沒有聊天紀錄。</p>
                ) : null}
                {!isSessionsLoading &&
                  !sessionsError &&
                  sessions.map((session) => {
                    const isSelected = selectedSessionId === session.id;

                    return (
                      <div
                        key={session.id}
                        className={`flex items-center gap-2 rounded-full border px-3 py-2 transition-colors ${
                          isSelected ? "border-neutral-300 bg-neutral-100" : "border-border bg-card hover:bg-neutral-50"
                        }`}
                      >
                        <button
                          type="button"
                          onClick={() => onSelectSession?.(session.id)}
                          className="flex min-w-0 flex-1 items-center gap-2 text-left text-sm"
                        >
                          <MessageSquare className="h-4 w-4 shrink-0 text-neutral-400" />
                          <span className={`truncate ${isSelected ? "text-neutral-900" : "text-neutral-700"}`}>
                            {getSessionLabel(session)}
                          </span>
                        </button>
                        {onDeleteSession ? (
                          <button
                            type="button"
                            aria-label={`刪除對話 ${session.id.slice(0, 8)}`}
                            onClick={(event) => {
                              event.stopPropagation();
                              onDeleteSession(session.id);
                            }}
                            disabled={deletingSessionId === session.id}
                            className="inline-flex size-8 items-center justify-center rounded-full text-neutral-400 transition hover:bg-white hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingSessionId === session.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          </button>
                        ) : null}
                      </div>
                    );
                  })}
              </div>
            </ScrollArea>
          </div>
        </div>
      </aside>
    </>
  );
}
