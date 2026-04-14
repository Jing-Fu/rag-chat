"use client";

import { useQuery } from "@tanstack/react-query";
import { Edit3, Globe, PenTool, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { type ApiError, promptApi } from "@/lib/api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export default function PromptsPage() {
  const [keyword, setKeyword] = useState("");

  const promptsQuery = useQuery({
    queryKey: ["prompts"],
    queryFn: promptApi.list,
  });

  const filteredItems = useMemo(() => {
    if (!promptsQuery.data) {
      return [];
    }

    const query = keyword.trim().toLowerCase();
    if (!query) {
      return promptsQuery.data;
    }

    return promptsQuery.data.filter((item) => {
      return (
        item.name.toLowerCase().includes(query) ||
        item.system_prompt.toLowerCase().includes(query) ||
        item.user_prompt_template.toLowerCase().includes(query)
      );
    });
  }, [keyword, promptsQuery.data]);

  return (
    <DashboardShell
      header={
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Prompt Templates</h1>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Template
          </button>
        </header>
      }
      mainClassName="flex-1 overflow-y-auto w-full relative p-8"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search templates..."
              className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        {promptsQuery.isPending && (
          <div className="rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground">
            Loading prompt templates...
          </div>
        )}

        {promptsQuery.isError && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-6 text-red-200">
            Failed to load prompt templates: {getErrorMessage(promptsQuery.error as ApiError)}
          </div>
        )}

        {!promptsQuery.isPending && !promptsQuery.isError && filteredItems.length === 0 && (
          <div className="rounded-xl border border-border bg-card px-4 py-6 text-muted-foreground">
            No prompt templates found.
          </div>
        )}

        {!promptsQuery.isPending && !promptsQuery.isError && filteredItems.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="group border border-border rounded-xl bg-card hover:bg-secondary/40 transition-colors flex flex-col relative overflow-hidden"
              >
                <div className="absolute top-4 right-4 flex opacity-0 group-hover:opacity-100 transition-opacity z-10 bg-card rounded-md shadow-sm border border-border">
                  <button
                    type="button"
                    className="p-1.5 hover:bg-secondary rounded-l text-muted-foreground hover:text-foreground transition-colors"
                    title="Edit Template"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <div className="w-px bg-border my-1" />
                  <button
                    type="button"
                    className="p-1.5 hover:bg-red-500/10 rounded-r text-red-500/70 hover:text-red-500 transition-colors"
                    title="Delete Template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="p-5 flex-1 flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="p-1.5 bg-blue-500/10 text-blue-400 rounded-md">
                      <Globe className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      System Prompt
                    </span>
                  </div>
                  <h3 className="font-semibold text-foreground text-base line-clamp-1">{item.name}</h3>
                  <p className="text-muted-foreground text-sm line-clamp-3">{item.system_prompt}</p>
                </div>

                <div className="px-5 py-3 border-t border-border bg-secondary/30 flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">
                    Temp: <strong className="text-foreground">{item.temperature.toFixed(1)}</strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded border ${
                      item.is_default
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {item.is_default ? "Default" : "Active"}
                  </span>
                </div>
              </div>
            ))}

            <button
              type="button"
              className="border-2 border-dashed border-border rounded-xl bg-background hover:bg-secondary/20 transition-all flex flex-col items-center justify-center min-h-[220px] text-muted-foreground hover:text-foreground hover:border-foreground/40 group"
            >
              <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                <Plus className="w-5 h-5" />
              </div>
              <span className="font-medium text-sm">Create New Template</span>
              <span className="text-xs mt-1 text-muted-foreground/70">
                Define system behavior or prompt shortcut
              </span>
            </button>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
