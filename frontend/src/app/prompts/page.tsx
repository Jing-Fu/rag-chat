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
    if (!form.user_prompt_template.includes("{context}") || !form.user_prompt_template.includes("{question}")) {
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
    <DashboardShell>
      <PageHeader
        icon={<PenTool className="h-4 w-4" />}
        title="Prompt Templates"
        description="Define answer behavior, grounding rules, and retrieval injection patterns."
        actions={
          <Button type="button" onClick={handleNewTemplate}>
            <Plus className="h-4 w-4" />
            New Template
          </Button>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[340px_minmax(0,1fr)]">
        <PageSection title="Templates" description="Search and switch between system prompt presets.">
          <PillPanel className="mb-4 flex items-center gap-2 px-4 py-0">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search templates"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </PillPanel>

          <div className="space-y-2">
            {promptsQuery.isPending ? <p className="muted-copy">Loading prompt templates...</p> : null}
            {promptsQuery.isError ? (
              <p className="text-sm text-red-600">
                Failed to load prompt templates: {getErrorMessage(promptsQuery.error as ApiError)}
              </p>
            ) : null}
            {!promptsQuery.isPending && !promptsQuery.isError && filteredItems.length === 0 ? (
              <p className="muted-copy">No prompt templates found.</p>
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
                        System Prompt
                      </div>
                      <p className="text-sm font-medium text-foreground">{item.name}</p>
                      <p className="mt-2 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.system_prompt}</p>
                    </div>
                    <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                      {item.is_default ? "Default" : `${item.temperature.toFixed(1)} temp`}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </PageSection>

        <PageSection
          title={selectedPromptId && !isCreatingNew ? "Edit Template" : "Create Template"}
          description="Tune the system prompt first. Only expand the retrieval template if the default injection is not enough."
        >
          <div className="space-y-4">
            <input
              type="text"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Template name"
              className="h-11 w-full rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />

            <textarea
              value={form.system_prompt}
              onChange={(event) => setForm((prev) => ({ ...prev, system_prompt: event.target.value }))}
              placeholder="System prompt"
              className="min-h-40 w-full rounded-xl border border-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />

            <div className="rounded-xl border border-border bg-neutral-50 px-4 py-4 text-sm text-muted-foreground">
              Use the system prompt for tone, refusal behavior, citation habits, and grounding rules. Advanced retrieval templating is optional for most cases.
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
                    <p className="text-sm font-medium text-foreground">Advanced Retrieval Template</p>
                    <p className="text-xs text-muted-foreground">Controls how context, history, and the question are injected into the user message.</p>
                  </div>
                </div>
                {showAdvanced ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
              </button>

              {showAdvanced ? (
                <div className="border-t border-border px-4 pb-4 pt-3">
                  <textarea
                    value={form.user_prompt_template}
                    onChange={(event) => setForm((prev) => ({ ...prev, user_prompt_template: event.target.value }))}
                    placeholder="User prompt template"
                    className="min-h-48 w-full rounded-xl border border-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
                  />
                  <p className="mt-2 text-xs text-muted-foreground">
                    Required placeholders: <code>{"{context}"}</code> and <code>{"{question}"}</code>. Optional placeholder: <code>{"{history}"}</code>.
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <label className="text-sm text-muted-foreground">Temperature: {form.temperature.toFixed(1)}</label>
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
              Set as default
            </label>

            {formError ? <p className="text-sm text-red-600">{formError}</p> : null}

            <div className="flex flex-wrap items-center gap-2">
              <Button
                type="button"
                onClick={() => void handleSave()}
                disabled={createMutation.isPending || updateMutation.isPending}
              >
                {selectedPromptId && !isCreatingNew ? "Save Changes" : "Create Template"}
              </Button>
              {selectedPromptId && !isCreatingNew ? (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={() => {
                    if (window.confirm("Delete this prompt template?")) {
                      void deleteMutation.mutateAsync();
                    }
                  }}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              ) : null}
            </div>
          </div>
        </PageSection>
      </div>
    </DashboardShell>
  );
}