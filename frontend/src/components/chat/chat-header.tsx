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
    <header className="border-b border-border bg-white/95 px-5 py-4 backdrop-blur supports-[backdrop-filter]:bg-white/80 sm:px-8 lg:px-10">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex max-w-full items-center gap-2 overflow-x-auto py-1 text-sm scrollbar-hide">
        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap transition-colors hover:bg-muted">
            <Cpu className="h-4 w-4 text-muted-foreground" />
            <span>{selectedModelLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50" />
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

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-sm font-medium text-foreground whitespace-nowrap transition-colors hover:bg-muted">
            <PenTool className="h-4 w-4 text-muted-foreground" />
            <span>{selectedPromptLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50" />
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

        <DropdownMenu>
          <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-input bg-card px-4 py-2 text-sm font-medium whitespace-nowrap transition-colors hover:bg-muted">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-neutral-700">{selectedKnowledgeLabel}</span>
            <ChevronDown className="h-3 w-3 text-muted-foreground opacity-50" />
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

        <div className="px-1 text-xs text-muted-foreground">
          {isLoading ? (
            <span className="inline-flex items-center gap-1">
              <Loader2 className="h-3 w-3 animate-spin" />
              Syncing workspace
            </span>
          ) : hasError ? (
            <span className="text-red-600">Workspace data unavailable</span>
          ) : (
            <span>Workspace ready</span>
          )}
        </div>
      </div>
    </header>
  );
}
