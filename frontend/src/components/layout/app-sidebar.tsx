"use client";

import {
  Cpu,
  Database,
  Link as LinkIcon,
  Loader2,
  MessageSquare,
  PenTool,
  Plus,
  Settings,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
  }

  return (
    <aside className="hidden lg:flex w-[260px] h-full bg-[#111111] dark:bg-[#111111] border-r border-[#222] flex-col text-sm flex-shrink-0 text-white">
      <div className="p-3">
        <button
          type="button"
          onClick={handleNewChatClick}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#222] text-white hover:bg-[#2a2a2a] transition-colors font-medium"
        >
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </span>
        </button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="pb-4">
          <div className="text-xs font-semibold text-white/50 px-3 py-2 pb-1">Sessions</div>
          {isSessionsLoading && (
            <p className="px-3 py-2 text-xs text-white/60">Loading chat sessions...</p>
          )}
          {!isSessionsLoading && sessionsError && (
            <p className="px-3 py-2 text-xs text-red-300">{sessionsError}</p>
          )}
          {!isSessionsLoading && !sessionsError && !hasSessions && (
            <p className="px-3 py-2 text-xs text-white/60">No chat sessions yet.</p>
          )}
          {!isSessionsLoading &&
            !sessionsError &&
            sessions.map((session) => (
              <div
                key={session.id}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  selectedSessionId === session.id
                    ? "bg-[#2a2a2a] text-white"
                    : "hover:bg-[#222] text-white/80 hover:text-white"
                }`}
              >
                <button
                  type="button"
                  onClick={() => onSelectSession?.(session.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 text-left"
                >
                  <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                  <span className="truncate">
                    {session.message_count > 0
                      ? `Session ${session.id.slice(0, 8)} · ${session.message_count} msgs`
                      : `Session ${session.id.slice(0, 8)}`}
                  </span>
                </button>
                {onDeleteSession && (
                  <button
                    type="button"
                    aria-label={`Delete session ${session.id.slice(0, 8)}`}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDeleteSession(session.id);
                    }}
                    disabled={deletingSessionId === session.id}
                    className="rounded-md p-1 text-white/40 transition hover:bg-white/10 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {deletingSessionId === session.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
            ))}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-[#222] mt-auto">
        <DropdownMenu>
          <DropdownMenuTrigger className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[#222] transition-colors text-white/80 hover:text-white outline-none">
            <div className="flex items-center gap-3 truncate">
              <div className="w-6 h-6 rounded-full bg-blue-600 flex items-center justify-center shrink-0 text-white font-medium text-xs">
                R
              </div>
              <div className="text-left truncate">RAG Workspace</div>
            </div>
            <Settings className="w-4 h-4 shrink-0 text-white/50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[230px] border-[#222] bg-[#111111] text-white">
            <DropdownMenuItem className="p-0">
              <Link
                href="/knowledge"
                className={`flex items-center gap-2 cursor-pointer py-2 px-2 w-full rounded-sm ${
                  pathname === "/knowledge" ? "bg-[#222] text-white" : "hover:bg-[#222] text-white/80"
                }`}
              >
                <Database className="w-4 h-4 text-white/70" />
                Knowledge Bases
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <Link
                href="/models"
                className={`flex items-center gap-2 cursor-pointer py-2 px-2 w-full rounded-sm ${
                  pathname === "/models" ? "bg-[#222] text-white" : "hover:bg-[#222] text-white/80"
                }`}
              >
                <Cpu className="w-4 h-4 text-white/70" />
                Ollama Models
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <Link
                href="/prompts"
                className={`flex items-center gap-2 cursor-pointer py-2 px-2 w-full rounded-sm ${
                  pathname === "/prompts" ? "bg-[#222] text-white" : "hover:bg-[#222] text-white/80"
                }`}
              >
                <PenTool className="w-4 h-4 text-white/70" />
                Prompt Templates
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <Link
                href="/endpoints"
                className={`flex items-center gap-2 cursor-pointer py-2 px-2 w-full rounded-sm ${
                  pathname === "/endpoints" ? "bg-[#222] text-white" : "hover:bg-[#222] text-white/80"
                }`}
              >
                <LinkIcon className="w-4 h-4 text-white/70" />
                API Endpoints
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
