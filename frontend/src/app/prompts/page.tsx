"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Globe, PenTool, Plus, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { PillPanel } from "@/components/layout/pill-panel";
import { Button } from "@/components/ui/button";
import { type ApiError, promptApi } from "@/lib/api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "未知錯誤";
}

type PromptFormState = {
  name: string;
  system_prompt: string;
  temperature: number;
  is_default: boolean;
};

const defaultFormState: PromptFormState = {
  name: "",
  system_prompt: "",
  temperature: 0.7,
  is_default: false,
};

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [form, setForm] = useState<PromptFormState>(defaultFormState);

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
        item.system_prompt.toLowerCase().includes(query)
      );
    });
  }, [keyword, promptsQuery.data]);

  useEffect(() => {
    if (!promptsQuery.data || promptsQuery.data.length === 0) {
      setSelectedPromptId(null);
      return;
    }

    if (isCreatingNew) {
      return;
    }

    if (!selectedPromptId) {
      const defaultPrompt = promptsQuery.data.find((item) => item.is_default) ?? promptsQuery.data[0];
      setSelectedPromptId(defaultPrompt.id);
      return;
    }

    const exists = promptsQuery.data.some((item) => item.id === selectedPromptId);
    if (!exists) {
      const defaultPrompt = promptsQuery.data.find((item) => item.is_default) ?? promptsQuery.data[0];
      setSelectedPromptId(defaultPrompt.id);
    }
  }, [isCreatingNew, promptsQuery.data, selectedPromptId]);

  useEffect(() => {
    if (!selectedPromptId || isCreatingNew) {
      return;
    }
    const selected = promptsQuery.data?.find((item) => item.id === selectedPromptId);
    if (!selected) {
      return;
    }

    setForm({
      name: selected.name,
      system_prompt: selected.system_prompt,
      temperature: selected.temperature,
      is_default: selected.is_default,
    });
    setFormError(null);
  }, [isCreatingNew, promptsQuery.data, selectedPromptId]);

  const createMutation = useMutation({
    mutationFn: promptApi.create,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setIsCreatingNew(false);
      setSelectedPromptId(created.id);
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const updateMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPromptId) {
        throw new Error("尚未選擇提示詞模板。");
      }
      return promptApi.update(selectedPromptId, {
        name: form.name.trim(),
        system_prompt: form.system_prompt,
        temperature: form.temperature,
        is_default: form.is_default,
      });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setIsCreatingNew(false);
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!selectedPromptId) {
        throw new Error("尚未選擇提示詞模板。");
      }
      return promptApi.delete(selectedPromptId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["prompts"] });
      setIsCreatingNew(false);
      setSelectedPromptId(null);
      setForm(defaultFormState);
      setFormError(null);
    },
    onError: (error) => setFormError(getErrorMessage(error)),
  });

  function handleNewTemplate() {
    setIsCreatingNew(true);
    setSelectedPromptId(null);
    setForm(defaultFormState);
    setFormError(null);
  }

  async function handleSave() {
    if (!form.name.trim()) {
      setFormError("模板名稱為必填。");
      return;
    }
    if (!form.system_prompt.trim()) {
      setFormError("系統提示詞為必填。");
      return;
    }

    if (selectedPromptId) {
      await updateMutation.mutateAsync();
      return;
    }

    await createMutation.mutateAsync({
      name: form.name.trim(),
      system_prompt: form.system_prompt,
      temperature: form.temperature,
      is_default: form.is_default,
    });
  }

  return (
    <DashboardShell>
      <PageHeader
        icon={<PenTool className="h-4 w-4" />}
        title="提示詞模板"
        description="定義回答風格、依據規則與模型回應傾向。"
        actions={
          <Button type="button" onClick={handleNewTemplate}>
            <Plus className="h-4 w-4" />
            新增模板
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <PageSection title="模板列表" description="搜尋並切換系統提示詞預設。">
          <PillPanel className="mb-4 flex items-center gap-2 px-4 py-0">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="搜尋模板"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </PillPanel>

          <div className="space-y-2">
            {promptsQuery.isPending ? <p className="muted-copy">載入提示詞模板中...</p> : null}
            {promptsQuery.isError ? (
              <p className="text-sm text-red-600">
                載入提示詞模板失敗：{getErrorMessage(promptsQuery.error as ApiError)}
              </p>
            ) : null}
            {!promptsQuery.isPending && !promptsQuery.isError && filteredItems.length === 0 ? (
              <p className="muted-copy">找不到提示詞模板。</p>
            ) : null}
            {filteredItems.map((item) => {
              const isSelected = selectedPromptId === item.id && !isCreatingNew;

              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setSelectedPromptId(item.id);
                  }}
                  className={`w-full rounded-xl border p-4 text-left transition-colors ${
                    isSelected ? "border-neutral-300 bg-neutral-50" : "border-border bg-card hover:bg-neutral-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                        <Globe className="h-3.5 w-3.5" />
                        系統提示詞
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.system_prompt}</p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {item.is_default ? "預設" : `溫度 ${item.temperature.toFixed(1)}`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </PageSection>

        <PageSection
          title={selectedPromptId && !isCreatingNew ? "編輯模板" : "建立模板"}
          description="調整系統提示詞、溫度與預設設定。"
        >
          <div className="space-y-4">
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="模板名稱"
              className="h-11 w-full rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />

            <textarea
              value={form.system_prompt}
              onChange={(event) => setForm((prev) => ({ ...prev, system_prompt: event.target.value }))}
              placeholder="系統提示詞"
              className="min-h-40 w-full rounded-xl border border-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />

            <div className="rounded-xl border border-border bg-neutral-50 px-4 py-4 text-sm text-muted-foreground">
              透過系統提示詞控制語氣、拒答方式、引用習慣與 grounded 規則。檢索上下文的注入格式由系統統一管理。
            </div>

            <div>
              <label className="text-sm text-muted-foreground">溫度：{form.temperature.toFixed(1)}</label>
              <input
                type="range"
                min={0}
                max={2}
                step={0.1}
                value={form.temperature}
                onChange={(event) => setForm((prev) => ({ ...prev, temperature: Number(event.target.value) }))}
                className="mt-2 w-full"
              />
            </div>

            <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <input
                type="checkbox"
                checked={form.is_default}
                onChange={(event) => setForm((prev) => ({ ...prev, is_default: event.target.checked }))}
              />
              設為預設模板
            </label>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selectedPromptId && !isCreatingNew ? "儲存變更" : "建立模板"}
              </Button>
              {selectedPromptId && !isCreatingNew ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("要刪除此提示詞模板嗎？")) {
                      void deleteMutation.mutateAsync();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  刪除
                </Button>
              ) : null}
            </div>
          </div>
        </PageSection>
      </div>
    </DashboardShell>
  );
}
