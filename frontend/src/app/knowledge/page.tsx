"use client";

import { useQuery } from "@tanstack/react-query";
import { Database, Plus, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { type ApiError, knowledgeApi } from "@/lib/api";

function statusBadge(status: string) {
  if (status === "ready" || status === "active") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (status === "indexing" || status === "processing") {
    return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  }
  return "bg-red-500/10 text-red-300 border-red-500/20";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export default function KnowledgePage() {
  const [keyword, setKeyword] = useState("");

  const knowledgeBasesQuery = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: knowledgeApi.list,
  });

  const filteredItems = useMemo(() => {
    if (!knowledgeBasesQuery.data) {
      return [];
    }

    const query = keyword.trim().toLowerCase();
    if (!query) {
      return knowledgeBasesQuery.data;
    }

    return knowledgeBasesQuery.data.filter((item) => {
      const haystack = `${item.name} ${item.description ?? ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [keyword, knowledgeBasesQuery.data]);

  return (
    <DashboardShell
      header={
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Knowledge Bases</h1>
          </div>
          <button
            type="button"
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Database
          </button>
        </header>
      }
      mainClassName="flex-1 overflow-y-auto w-full relative p-8"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search knowledge bases..."
              className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium text-foreground">Name</th>
                <th className="px-6 py-3 font-medium text-foreground">Description</th>
                <th className="px-6 py-3 font-medium text-foreground">Documents</th>
                <th className="px-6 py-3 font-medium text-foreground">Status</th>
                <th className="px-6 py-3 font-medium text-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {knowledgeBasesQuery.isPending && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-muted-foreground">
                    Loading knowledge bases...
                  </td>
                </tr>
              )}

              {knowledgeBasesQuery.isError && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-red-300">
                    Failed to load knowledge bases: {getErrorMessage(knowledgeBasesQuery.error as ApiError)}
                  </td>
                </tr>
              )}

              {!knowledgeBasesQuery.isPending &&
                !knowledgeBasesQuery.isError &&
                filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-muted-foreground">
                      No knowledge bases found.
                    </td>
                  </tr>
                )}

              {!knowledgeBasesQuery.isPending &&
                !knowledgeBasesQuery.isError &&
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-secondary/20 transition-colors group">
                    <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">
                      {item.description ?? "No description"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.document_count} Files</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusBadge(
                          item.status,
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                          title="Sync / Refresh"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                          title="Upload Document"
                        >
                          <UploadCloud className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          className="p-1.5 text-red-500/70 hover:text-red-500 rounded hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
    </DashboardShell>
  );
}
