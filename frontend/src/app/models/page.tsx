"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cpu, Download, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { type ApiError, modelApi, type ModelPullProgress } from "@/lib/api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

function formatBytes(size: number | null): string {
  if (size === null || Number.isNaN(size)) {
    return "-";
  }
  if (size < 1024) {
    return `${size} B`;
  }
  const units = ["KB", "MB", "GB", "TB"];
  let value = size;
  let unitIndex = -1;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

export default function ModelsPage() {
  const queryClient = useQueryClient();
  const [modelNameToPull, setModelNameToPull] = useState("");
  const [pullProgress, setPullProgress] = useState<ModelPullProgress | null>(null);
  const [pullError, setPullError] = useState<string | null>(null);

  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: modelApi.list,
  });

  const pullMutation = useMutation({
    mutationFn: async (modelName: string) => {
      setPullProgress({ status: "Preparing..." });
      setPullError(null);
      await modelApi.pull(modelName, {
        onProgress: (progress) => setPullProgress(progress),
        onDone: () => setPullProgress({ status: "Completed" }),
        onError: (message) => setPullError(message),
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["models"] });
      setModelNameToPull("");
    },
    onError: (error) => setPullError(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: modelApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["models"] });
    },
  });

  const progressPercent = useMemo(() => {
    if (!pullProgress?.total || !pullProgress?.completed) {
      return null;
    }
    if (pullProgress.total <= 0) {
      return null;
    }
    return Math.min(100, Math.max(0, (pullProgress.completed / pullProgress.total) * 100));
  }, [pullProgress]);

  return (
    <DashboardShell
      header={
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Ollama Models</h1>
          </div>
          <button
            type="button"
            onClick={() => modelsQuery.refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>
      }
      mainClassName="flex-1 overflow-y-auto w-full relative p-8"
    >
      <div className="mx-auto max-w-5xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Pull Model</h2>
          <div className="mt-3 flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={modelNameToPull}
              onChange={(event) => setModelNameToPull(event.target.value)}
              placeholder="e.g. llama3.2 or nomic-embed-text"
              className="flex-1 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => pullMutation.mutate(modelNameToPull.trim())}
              disabled={pullMutation.isPending || !modelNameToPull.trim()}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60"
            >
              <Download className="w-4 h-4" />
              {pullMutation.isPending ? "Pulling..." : "Pull"}
            </button>
          </div>
          {pullProgress && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{pullProgress.status ?? "In progress..."}</p>
              {progressPercent !== null && (
                <div className="mt-2 h-2 rounded-full bg-secondary overflow-hidden">
                  <div
                    className="h-full bg-emerald-400 transition-all"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              )}
            </div>
          )}
          {pullError && <p className="mt-3 text-sm text-red-300">{pullError}</p>}
        </section>

        <section className="rounded-xl border border-border bg-card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Model</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Size</th>
                <th className="px-4 py-3 text-left font-medium">Modified</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {modelsQuery.isPending && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-muted-foreground">
                    Loading models...
                  </td>
                </tr>
              )}
              {modelsQuery.isError && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-red-300">
                    Failed to load models: {getErrorMessage(modelsQuery.error as ApiError)}
                  </td>
                </tr>
              )}
              {!modelsQuery.isPending && !modelsQuery.isError && (modelsQuery.data ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-5 text-muted-foreground">
                    No local models found.
                  </td>
                </tr>
              )}
              {!modelsQuery.isPending &&
                !modelsQuery.isError &&
                (modelsQuery.data ?? []).map((model) => (
                  <tr key={model.name} className="hover:bg-secondary/20">
                    <td className="px-4 py-3 font-medium">{model.name}</td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex rounded-md px-2 py-0.5 text-xs border ${
                          model.model_type === "embed"
                            ? "bg-blue-500/10 text-blue-300 border-blue-500/20"
                            : "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        }`}
                      >
                        {model.model_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{formatBytes(model.size)}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {model.modified_at ? new Date(model.modified_at).toLocaleString() : "-"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.confirm(`Delete model '${model.name}'?`)) {
                              deleteMutation.mutate(model.name);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                          className="inline-flex items-center gap-1.5 rounded-md border border-red-500/30 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-60"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </section>
      </div>
    </DashboardShell>
  );
}

