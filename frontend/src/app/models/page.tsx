"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Cpu, Download, RefreshCw, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
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
    <DashboardShell>
      <PageHeader
        icon={<Cpu className="h-4 w-4" />}
        title="Models"
        description="Fetch local models, inspect inventory, and keep your workspace runtime ready."
        actions={
          <Button type="button" variant="outline" onClick={() => modelsQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="space-y-6">
        <PageSection
          title="Pull Model"
          description="Fetch a local LLM or embedding model without leaving the workspace."
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={modelNameToPull}
              onChange={(event) => setModelNameToPull(event.target.value)}
              placeholder="e.g. llama3.2 or nomic-embed-text"
              className="h-11 flex-1 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <Button
              type="button"
              onClick={() => pullMutation.mutate(modelNameToPull.trim())}
              disabled={pullMutation.isPending || !modelNameToPull.trim()}
            >
              <Download className="h-4 w-4" />
              {pullMutation.isPending ? "Pulling..." : "Pull"}
            </Button>
          </div>

          {pullProgress ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{pullProgress.status ?? "In progress..."}</p>
              {progressPercent !== null ? (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full bg-black transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              ) : null}
            </div>
          ) : null}
          {pullError ? <p className="mt-3 text-sm text-red-600">{pullError}</p> : null}
        </PageSection>

        <PageSection title="Local Inventory" description="Installed models available to chat or embed locally.">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-2 py-3 font-medium">Model</th>
                  <th className="px-2 py-3 font-medium">Type</th>
                  <th className="px-2 py-3 font-medium">Size</th>
                  <th className="px-2 py-3 font-medium">Modified</th>
                  <th className="px-2 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {modelsQuery.isPending ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-5 text-muted-foreground">
                      Loading models...
                    </td>
                  </tr>
                ) : null}
                {modelsQuery.isError ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-5 text-red-600">
                      Failed to load models: {getErrorMessage(modelsQuery.error as ApiError)}
                    </td>
                  </tr>
                ) : null}
                {!modelsQuery.isPending && !modelsQuery.isError && (modelsQuery.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-5 text-muted-foreground">
                      No local models found.
                    </td>
                  </tr>
                ) : null}
                {!modelsQuery.isPending &&
                  !modelsQuery.isError &&
                  (modelsQuery.data ?? []).map((model) => (
                    <tr key={model.name} className="border-b border-border/70 last:border-b-0">
                      <td className="px-2 py-4 font-medium text-foreground">{model.name}</td>
                      <td className="px-2 py-4 text-muted-foreground">
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs">
                          {model.model_type}
                        </span>
                      </td>
                      <td className="px-2 py-4 text-muted-foreground">{formatBytes(model.size)}</td>
                      <td className="px-2 py-4 text-muted-foreground">
                        {model.modified_at ? new Date(model.modified_at).toLocaleString() : "-"}
                      </td>
                      <td className="px-2 py-4 text-right">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            if (window.confirm(`Delete model '${model.name}'?`)) {
                              deleteMutation.mutate(model.name);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete
                        </Button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </PageSection>
      </div>
    </DashboardShell>
  );
}