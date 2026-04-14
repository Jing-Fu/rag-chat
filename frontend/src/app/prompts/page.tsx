"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Globe,
  PenTool,
  Plus,
  Search,
  Settings2,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { type ApiError, promptApi } from "@/lib/api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

const DEFAULT_USER_TEMPLATE = `Please answer the question using only the provided knowledge base content.

If the content is insufficient to support an answer, say that you do not know and do not fabricate details.
Prefer concise, grounded answers that summarize the most relevant points.

Knowledge base content:
{context}

Conversation history:
{history}

Question:
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
        throw new Error("No prompt selected.");
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
        throw new Error("No prompt selected.");
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
      setFormError("Template name is required.");
      return;
    }
    if (!form.system_prompt.trim()) {
      setFormError("System prompt is required.");
      return;
    }
    if (
      !form.user_prompt_template.includes("{context}") ||
      !form.user_prompt_template.includes("{question}")
    ) {
      setFormError("Advanced template must include both {context} and {question}.");
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
    <DashboardShell
      header={
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <PenTool className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Prompt Templates</h1>
          </div>
          <button
            type="button"
            onClick={handleNewTemplate}
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
          <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredItems.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setIsCreatingNew(false);
                    setSelectedPromptId(item.id);
                  }}
                  className={`group text-left border rounded-xl bg-card hover:bg-secondary/40 transition-colors flex flex-col relative overflow-hidden ${
                    selectedPromptId === item.id ? "border-blue-400/60" : "border-border"
                  }`}
                >
                  <div className="absolute top-4 right-4 p-1.5 rounded-md bg-card border border-border text-muted-foreground">
                    <Edit3 className="w-4 h-4" />
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
                </button>
              ))}
            </div>

            <div className="border border-border rounded-xl bg-card p-4 space-y-3 h-fit">
              <h2 className="font-semibold text-foreground">
                {selectedPromptId ? "Edit Prompt Template" : "Create Prompt Template"}
              </h2>
              <input
                type="text"
                value={form.name}
                onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="Template name"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
              />
              <textarea
                value={form.system_prompt}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, system_prompt: event.target.value }))
                }
                placeholder="System prompt"
                className="w-full min-h-28 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
              />
              <div className="rounded-lg border border-border bg-secondary/20 px-3 py-3 text-xs text-muted-foreground">
                Use the system prompt for normal behavior changes such as answer style, language,
                grounding rules, and refusal behavior. The retrieval template below is an advanced
                setting and usually does not need to change.
              </div>
              <div className="rounded-xl border border-border bg-secondary/20">
                <button
                  type="button"
                  onClick={() => setShowAdvanced((prev) => !prev)}
                  className="flex w-full items-center justify-between gap-3 px-3 py-3 text-left"
                >
                  <div className="flex items-center gap-2">
                    <Settings2 className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Advanced Retrieval Template</p>
                      <p className="text-xs text-muted-foreground">
                        Controls how context, history, and the question are injected into the user
                        message.
                      </p>
                    </div>
                  </div>
                  {showAdvanced ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
                {showAdvanced && (
                  <div className="space-y-3 border-t border-border px-3 pb-3 pt-2">
                    <textarea
                      value={form.user_prompt_template}
                      onChange={(event) =>
                        setForm((prev) => ({ ...prev, user_prompt_template: event.target.value }))
                      }
                      placeholder="User prompt template"
                      className="w-full min-h-40 bg-background border border-border rounded-lg px-3 py-2 text-sm"
                    />
                    <div className="text-xs text-muted-foreground">
                      Required placeholders: <code>{"{context}"}</code> and <code>{"{question}"}</code>.
                      Optional placeholder: <code>{"{history}"}</code>.
                    </div>
                  </div>
                )}
              </div>
              <label className="block text-sm">
                <span className="text-muted-foreground">Temperature: {form.temperature.toFixed(1)}</span>
                <input
                  type="range"
                  min={0}
                  max={2}
                  step={0.1}
                  value={form.temperature}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, temperature: Number(event.target.value) }))
                  }
                  className="w-full mt-1"
                />
              </label>
              <label className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.is_default}
                  onChange={(event) =>
                    setForm((prev) => ({ ...prev, is_default: event.target.checked }))
                  }
                />
                Set as default
              </label>
              {formError && <p className="text-sm text-red-300">{formError}</p>}
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => void handleSave()}
                  disabled={createMutation.isPending || updateMutation.isPending}
                  className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60"
                >
                  {selectedPromptId ? "Save Changes" : "Create Template"}
                </button>
                {selectedPromptId && (
                  <button
                    type="button"
                    onClick={() => {
                      if (window.confirm("Delete this prompt template?")) {
                        void deleteMutation.mutateAsync();
                      }
                    }}
                    disabled={deleteMutation.isPending}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-500/30 text-red-300 text-sm hover:bg-red-500/10 disabled:opacity-60"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardShell>
  );
}
