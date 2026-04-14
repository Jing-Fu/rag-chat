import { Plus, Settings, MessageSquare, Database, Cpu, PenTool, Link as LinkIcon } from "lucide-react";
import Link from "next/link";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function AppSidebar() {
  return (
    <aside className="hidden lg:flex w-[260px] h-full bg-[#111111] dark:bg-[#111111] border-r border-[#222] flex-col text-sm flex-shrink-0 text-white">
      <div className="p-3">
        <button className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg bg-[#222] text-white hover:bg-[#2a2a2a] transition-colors font-medium">
          <span className="flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Chat
          </span>
        </button>
      </div>

      <ScrollArea className="flex-1 px-3">
        <div className="pb-4">
          <div className="text-xs font-semibold text-white/50 px-3 py-2 pb-1">Today</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#222] transition-colors text-left text-white/80 hover:text-white">
            <MessageSquare className="w-4 h-4 shrink-0 transition-opacity opacity-70" />
            <span className="truncate">RAG Architecture Options</span>
          </button>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#222] transition-colors text-left text-white/80 hover:text-white">
            <MessageSquare className="w-4 h-4 shrink-0 transition-opacity opacity-70" />
            <span className="truncate">Vector search performance</span>
          </button>

          <div className="text-xs font-semibold text-white/50 px-3 py-2 pt-6 pb-1">Previous 7 Days</div>
          <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-[#222] transition-colors text-left text-white/80 hover:text-white">
            <MessageSquare className="w-4 h-4 shrink-0 transition-opacity opacity-70" />
            <span className="truncate">Embedding models comparison</span>
          </button>
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
              <Link href="/knowledge" className="flex items-center gap-2 hover:bg-[#222] focus:bg-[#222] focus:text-white cursor-pointer py-2 px-2 w-full rounded-sm">
                <Database className="w-4 h-4 text-white/70" />
                Knowledge Bases
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <Link href="/models" className="flex items-center gap-2 hover:bg-[#222] focus:bg-[#222] focus:text-white cursor-pointer py-2 px-2 w-full rounded-sm">
                <Cpu className="w-4 h-4 text-white/70" />
                Ollama Models
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <Link href="/prompts" className="flex items-center gap-2 hover:bg-[#222] focus:bg-[#222] focus:text-white cursor-pointer py-2 px-2 w-full rounded-sm">
                <PenTool className="w-4 h-4 text-white/70" />
                Prompt Templates
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem className="p-0">
              <Link href="/endpoints" className="flex items-center gap-2 hover:bg-[#222] focus:bg-[#222] focus:text-white cursor-pointer py-2 px-2 w-full rounded-sm">
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