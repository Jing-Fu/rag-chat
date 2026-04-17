"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Globe, PenTool, Plus, Search, Settings2, Trash2 } from "lucide-react";
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

const DEFAULT_USER_TEMPLATE = `請只根據提供的知識庫內容回答問題。

如果內容不足以支持答案，請明確說不知道，不要自行捏造細節。
請優先提供精簡、可驗證且重點明確的回答。

知識庫內容：
{context}

對話歷史：
{history}

問題：
{question}`;

type PromptFormState = {
  name: string;
  system_prompt: string;
  user_prompt_template: string;
  temperature: number;
  is_default: boolean;
};

const defaultFormState: PromptFormState = {
  name: "",
  system_prompt: "",
  user_prompt_template: DEFAULT_USER_TEMPLATE,
  temperature: 0.7,
  is_default: false,
};

export default function PromptsPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [selectedPromptId, setSelectedPromptId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
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
        item.system_prompt.toLowerCase().includes(query) ||
        item.user_prompt_template.toLowerCase().includes(query)
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
      user_prompt_template: selected.user_prompt_template,
      temperature: selected.temperature,
      is_default: selected.is_default,
    });
    setShowAdvanced(selected.user_prompt_template !== DEFAULT_USER_TEMPLATE);
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
        user_prompt_template: form.user_prompt_template,
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
    setShowAdvanced(false);
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
    if (!form.user_prompt_template.includes("{context}") || !form.user_prompt_template.includes("{question}")) {
      setFormError("進階模板必須同時包含 {context} 與 {question}。");
      return;
    }

    if (selectedPromptId) {
      await updateMutation.mutateAsync();
      return;
    }

    await createMutation.mutateAsync({
      name: form.name.trim(),
      system_prompt: form.system_prompt,
      user_prompt_template: form.user_prompt_template,
      temperature: form.temperature,
      is_default: form.is_default,
    });
  }

  return (
    <DashboardShell>
      <PageHeader
        icon={<PenTool className="h-4 w-4" />}
        title="提示詞模板"
        description="定義回答風格、依據規則與檢索內容注入方式。"
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
          description="先調整系統提示詞。只有在預設注入方式不夠時，才需要展開進階檢索模板。"
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
              透過系統提示詞控制語氣、拒答方式、引用習慣與 grounded 規則。大多數情況下不需要額外調整進階檢索模板。
            </div>

            <div className="rounded-xl border border-border">
              <button
                type="button"
                onClick={() => setShowAdvanced((prev) => !prev)}
                className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <Settings2 className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium text-foreground">進階檢索模板</p>
                    <p className="text-xs text-muted-foreground">控制如何把內容上下文、歷史對話與問題注入到使用者訊息中。</p>
                  </div>
                </div>
                {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {showAdvanced ? (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <textarea
                    value={form.user_prompt_template}
                    onChange={(event) => setForm((prev) => ({ ...prev, user_prompt_template: event.target.value }))}
                    placeholder="使用者提示詞模板"
                    className="min-h-48 w-full rounded-xl border border-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    必填變數：<code>{"{context}"}</code> 與 <code>{"{question}"}</code>。可選變數：<code>{"{history}"}</code>。
                  </p>
                </div>
              ) : null}
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
