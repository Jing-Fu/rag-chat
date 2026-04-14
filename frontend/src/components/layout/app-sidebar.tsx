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
  onDeleteSession?: (sessionId: string) => void;
  deletingSessionId?: string | null;
};

const routeItems = [
  { href: "/", label: "Chat", icon: MessageSquare },
  { href: "/knowledge", label: "Knowledge Bases", icon: Database },
  { href: "/models", label: "Models", icon: Cpu },
  { href: "/prompts", label: "Prompt Templates", icon: PenTool },
  { href: "/endpoints", label: "API Endpoints", icon: LinkIcon },
];

function getRouteLabel(pathname: string) {
  return routeItems.find((item) => item.href === pathname)?.label ?? "RAG Workspace";
}

function getSessionLabel(session: ChatSessionSummary) {
  return session.message_count > 0
    ? `Session ${session.id.slice(0, 8)} · ${session.message_count} msgs`
    : `Session ${session.id.slice(0, 8)}`;
}

export function AppSidebar({
  sessions = [],
  isSessionsLoading = false,
  sessionsError = null,
  selectedSessionId = null,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  deletingSessionId = null,
}: AppSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hasSessions = sessions.length > 0;
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
          <p className="mono-label">local rag</p>
          <p className="display-title mt-1 text-lg text-foreground">{getRouteLabel(pathname)}</p>
        </div>
        <button
          type="button"
          aria-label={mobileMenuOpen ? "Close navigation" : "Open navigation"}
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
                <p className="mono-label">workspace</p>
                <p className="display-title mt-2 text-2xl text-foreground">RAG Workspace</p>
              </div>
              <button
                type="button"
                aria-label="Close navigation"
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
              New Chat
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

            <div className="min-h-0 flex-1 border-t border-border pt-5">
              <p className="mono-label mb-3">sessions</p>
              <ScrollArea className="h-full pr-1">
                <div className="space-y-2 pb-6">
                  {isSessionsLoading ? <p className="muted-copy px-1">Loading chat sessions...</p> : null}
                  {!isSessionsLoading && sessionsError ? <p className="text-sm text-red-600">{sessionsError}</p> : null}
                  {!isSessionsLoading && !sessionsError && !hasSessions ? (
                    <p className="muted-copy px-1">No chat sessions yet.</p>
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

      <aside className="hidden w-[280px] shrink-0 border-r border-border bg-white lg:flex">
        <div className="flex min-h-screen w-full flex-col px-4 py-5">
          <div className="border-b border-border pb-5">
            <p className="mono-label">local rag</p>
            <p className="display-title mt-2 text-2xl text-foreground">RAG Workspace</p>
            <p className="mt-2 text-sm text-muted-foreground">Grounded chat, local models, and retrieval operations.</p>
          </div>

          <button
            type="button"
            onClick={handleNewChatClick}
            className="mt-5 inline-flex items-center justify-center gap-2 rounded-full border border-neutral-200 bg-neutral-200 px-4 py-3 text-sm font-medium text-neutral-900 transition-colors hover:bg-neutral-300"
          >
            <Plus className="h-4 w-4" />
            New Chat
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

          <div className="mt-8 min-h-0 flex-1 border-t border-border pt-5">
            <p className="mono-label mb-3">sessions</p>
            <ScrollArea className="h-[calc(100vh-23rem)] pr-1">
              <div className="space-y-2 pb-4">
                {isSessionsLoading ? <p className="muted-copy px-1">Loading chat sessions...</p> : null}
                {!isSessionsLoading && sessionsError ? <p className="text-sm text-red-600">{sessionsError}</p> : null}
                {!isSessionsLoading && !sessionsError && !hasSessions ? (
                  <p className="muted-copy px-1">No chat sessions yet.</p>
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
                            aria-label={`Delete session ${session.id.slice(0, 8)}`}
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
