"use client";

import { Cpu, Database, Link as LinkIcon, MessageSquare, PenTool, Plus, Settings } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ChatSessionSummary } from "@/lib/api";

export type AppSidebarProps = {
  sessions?: ChatSessionSummary[];
  isSessionsLoading?: boolean;
  sessionsError?: string | null;
  selectedSessionId?: string | null;
  onSelectSession?: (sessionId: string) => void;
  onNewChat?: () => void;
};

export function AppSidebar({
  sessions = [],
  isSessionsLoading = false,
  sessionsError = null,
  selectedSessionId = null,
  onSelectSession,
  onNewChat,
}: AppSidebarProps) {
  const pathname = usePathname();
  const hasSessions = sessions.length > 0;

  return (
    <aside className="hidden lg:flex w-[260px] h-full bg-[#111111] dark:bg-[#111111] border-r border-[#222] flex-col text-sm flex-shrink-0 text-white">
      <div className="p-3">
        <button
          type="button"
          onClick={onNewChat}
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
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession?.(session.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left ${
                  selectedSessionId === session.id
                    ? "bg-[#2a2a2a] text-white"
                    : "hover:bg-[#222] text-white/80 hover:text-white"
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0 opacity-70" />
                <span className="truncate">
                  {session.message_count > 0
                    ? `Session ${session.id.slice(0, 8)} · ${session.message_count} msgs`
                    : `Session ${session.id.slice(0, 8)}`}
                </span>
              </button>
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
