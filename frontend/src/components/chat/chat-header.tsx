"use client";

import { ChevronDown, Cpu, Database, Loader2, PenTool } from "lucide-react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { KnowledgeBase, ModelInfo, PromptTemplate } from "@/lib/api";

type ChatHeaderProps = {
  models: ModelInfo[];
  prompts: PromptTemplate[];
  knowledgeBases: KnowledgeBase[];
  selectedModelName: string | null;
  selectedPromptId: string | null;
  selectedKnowledgeBaseId: string | null;
  isLoading?: boolean;
  hasError?: boolean;
  onSelectModelName: (value: string) => void;
  onSelectPromptId: (value: string | null) => void;
  onSelectKnowledgeBaseId: (value: string | null) => void;
};

export function ChatHeader({
  models,
  prompts,
  knowledgeBases,
  selectedModelName,
  selectedPromptId,
  selectedKnowledgeBaseId,
  isLoading = false,
  hasError = false,
  onSelectModelName,
  onSelectPromptId,
  onSelectKnowledgeBaseId,
}: ChatHeaderProps) {
  const selectedPrompt =
    prompts.find((prompt) => prompt.id === selectedPromptId) ?? prompts.find((prompt) => prompt.is_default);
  const selectedKnowledgeBase = knowledgeBases.find((kb) => kb.id === selectedKnowledgeBaseId);

  const selectedModelLabel = selectedModelName ?? "Select model";
  const selectedPromptLabel = selectedPrompt?.name ?? "Select prompt";
  const selectedKnowledgeLabel = selectedKnowledgeBase?.name ?? "No Knowledge Base";

  return (
    <header className="h-14 flex items-center justify-between px-4 border-b border-border shrink-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex items-center gap-1 sm:gap-2 text-sm max-w-full overflow-x-auto scrollbar-hide py-2">
        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors font-medium text-foreground whitespace-nowrap">
            <Cpu className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <span>{selectedModelLabel}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            {models.length > 0 ? (
              models.map((model) => (
                <DropdownMenuItem
                  key={model.name}
                  className="cursor-pointer"
                  onClick={() => onSelectModelName(model.name)}
                >
                  {model.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No models available</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors font-medium text-foreground whitespace-nowrap">
            <PenTool className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <span>{selectedPromptLabel}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[220px]">
            {prompts.length > 0 ? (
              prompts.map((prompt) => (
                <DropdownMenuItem
                  key={prompt.id}
                  className="cursor-pointer"
                  onClick={() => onSelectPromptId(prompt.id)}
                >
                  {prompt.name}
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No prompts available</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="w-px h-4 bg-border hidden sm:block" />

        <DropdownMenu>
          <DropdownMenuTrigger className="flex items-center gap-2 px-3 py-1.5 rounded-lg hover:bg-secondary transition-colors font-medium whitespace-nowrap">
            <Database className="w-4 h-4 text-muted-foreground hidden sm:block" />
            <span className="text-muted-foreground opacity-90">{selectedKnowledgeLabel}</span>
            <ChevronDown className="w-3 h-3 text-muted-foreground opacity-50" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[240px]">
            <DropdownMenuItem className="cursor-pointer" onClick={() => onSelectKnowledgeBaseId(null)}>
              None (General Chat)
            </DropdownMenuItem>
            {knowledgeBases.length > 0 ? (
              knowledgeBases.map((kb) => (
                <DropdownMenuItem
                  key={kb.id}
                  className="cursor-pointer"
                  onClick={() => onSelectKnowledgeBaseId(kb.id)}
                >
                  {kb.name} ({kb.status})
                </DropdownMenuItem>
              ))
            ) : (
              <DropdownMenuItem disabled>No knowledge bases available</DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="text-xs text-muted-foreground px-2">
        {isLoading ? (
          <span className="inline-flex items-center gap-1">
            <Loader2 className="w-3 h-3 animate-spin" />
            Syncing data
          </span>
        ) : hasError ? (
          <span className="text-red-500">Sync failed</span>
        ) : (
          <span>Data ready</span>
        )}
      </div>
    </header>
  );
}
