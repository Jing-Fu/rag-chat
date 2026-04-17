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
  return "未知錯誤";
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

function formatModelType(modelType: string): string {
  switch (modelType) {
    case "llm":
      return "聊天模型";
    case "embed":
      return "嵌入模型";
    default:
      return modelType;
  }
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
      setPullProgress({ status: "準備下載..." });
      setPullError(null);
      await modelApi.pull(modelName, {
        onProgress: (progress) => setPullProgress(progress),
        onDone: () => setPullProgress({ status: "完成" }),
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
        title="模型"
        description="管理本機模型、查看清單，並讓工作區執行環境保持可用。"
        actions={
          <Button type="button" variant="outline" onClick={() => modelsQuery.refetch()}>
            <RefreshCw className="h-4 w-4" />
            重新整理
          </Button>
        }
      />

      <div className="space-y-6">
        <PageSection
          title="下載模型"
          description="直接在工作區下載本機 LLM 或嵌入模型。"
        >
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              type="text"
              value={modelNameToPull}
              onChange={(event) => setModelNameToPull(event.target.value)}
              placeholder="例如：llama3.2 或 nomic-embed-text"
              className="h-11 flex-1 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <Button
              type="button"
              onClick={() => pullMutation.mutate(modelNameToPull.trim())}
              disabled={pullMutation.isPending || !modelNameToPull.trim()}
            >
              <Download className="h-4 w-4" />
              {pullMutation.isPending ? "下載中..." : "下載"}
            </Button>
          </div>

          {pullProgress ? (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground">{pullProgress.status ?? "處理中..."}</p>
              {progressPercent !== null ? (
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-neutral-200">
                  <div className="h-full bg-black transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              ) : null}
            </div>
          ) : null}
          {pullError ? <p className="mt-3 text-sm text-red-600">{pullError}</p> : null}
        </PageSection>

        <PageSection title="本機模型清單" description="可用於聊天或嵌入的已安裝本機模型。">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-2 py-3 font-medium">模型</th>
                  <th className="px-2 py-3 font-medium">類型</th>
                  <th className="px-2 py-3 font-medium">大小</th>
                  <th className="px-2 py-3 font-medium">更新時間</th>
                  <th className="px-2 py-3 text-right font-medium">操作</th>
                </tr>
              </thead>
              <tbody>
                {modelsQuery.isPending ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-5 text-muted-foreground">
                      載入模型中...
                    </td>
                  </tr>
                ) : null}
                {modelsQuery.isError ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-5 text-red-600">
                      載入模型失敗：{getErrorMessage(modelsQuery.error as ApiError)}
                    </td>
                  </tr>
                ) : null}
                {!modelsQuery.isPending && !modelsQuery.isError && (modelsQuery.data ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-2 py-5 text-muted-foreground">
                      找不到本機模型。
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
                          {formatModelType(model.model_type)}
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
                            if (window.confirm(`要刪除模型「${model.name}」嗎？`)) {
                              deleteMutation.mutate(model.name);
                            }
                          }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          刪除
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
