"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Link2, Plus, RotateCcw, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  type ApiError,
  endpointApi,
  knowledgeApi,
  modelApi,
  promptApi,
} from "@/lib/api";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

type CreateEndpointForm = {
  name: string;
  kb_id: string;
  prompt_id: string;
  model_name: string;
};

const defaultCreateForm: CreateEndpointForm = {
  name: "",
  kb_id: "",
  prompt_id: "",
  model_name: "",
};

export default function EndpointsPage() {
  const queryClient = useQueryClient();
  const [createForm, setCreateForm] = useState<CreateEndpointForm>(defaultCreateForm);
  const [createError, setCreateError] = useState<string | null>(null);
  const [selectedEndpointId, setSelectedEndpointId] = useState<string | null>(null);
  const [queryQuestion, setQueryQuestion] = useState("");
  const [queryApiKey, setQueryApiKey] = useState("");
  const [queryResult, setQueryResult] = useState<string | null>(null);
  const [queryError, setQueryError] = useState<string | null>(null);

  const endpointsQuery = useQuery({
    queryKey: ["api-endpoints"],
    queryFn: endpointApi.list,
  });
  const knowledgeQuery = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: knowledgeApi.list,
  });
  const promptsQuery = useQuery({
    queryKey: ["prompts"],
    queryFn: promptApi.list,
  });
  const modelsQuery = useQuery({
    queryKey: ["models"],
    queryFn: modelApi.list,
  });

  const llmModels = useMemo(
    () => (modelsQuery.data ?? []).filter((model) => model.model_type === "llm"),
    [modelsQuery.data],
  );

  useEffect(() => {
    if (!createForm.kb_id && knowledgeQuery.data && knowledgeQuery.data.length > 0) {
      setCreateForm((prev) => ({ ...prev, kb_id: knowledgeQuery.data[0].id }));
    }
  }, [createForm.kb_id, knowledgeQuery.data]);

  useEffect(() => {
    if (!createForm.prompt_id && promptsQuery.data && promptsQuery.data.length > 0) {
      const defaultPrompt = promptsQuery.data.find((item) => item.is_default) ?? promptsQuery.data[0];
      setCreateForm((prev) => ({ ...prev, prompt_id: defaultPrompt.id }));
    }
  }, [createForm.prompt_id, promptsQuery.data]);

  useEffect(() => {
    if (llmModels.length === 0) {
      if (createForm.model_name) {
        setCreateForm((prev) => ({ ...prev, model_name: "" }));
      }
      return;
    }

    const hasSelectedChatModel = llmModels.some((model) => model.name === createForm.model_name);
    if (!hasSelectedChatModel) {
      setCreateForm((prev) => ({ ...prev, model_name: llmModels[0].name }));
    }
  }, [createForm.model_name, llmModels]);

  useEffect(() => {
    if (!endpointsQuery.data || endpointsQuery.data.length === 0) {
      setSelectedEndpointId(null);
      return;
    }
    if (!selectedEndpointId) {
      setSelectedEndpointId(endpointsQuery.data[0].id);
      return;
    }
    const exists = endpointsQuery.data.some((item) => item.id === selectedEndpointId);
    if (!exists) {
      setSelectedEndpointId(endpointsQuery.data[0].id);
    }
  }, [endpointsQuery.data, selectedEndpointId]);

  const selectedEndpoint = useMemo(() => {
    if (!selectedEndpointId) {
      return null;
    }
    return endpointsQuery.data?.find((item) => item.id === selectedEndpointId) ?? null;
  }, [endpointsQuery.data, selectedEndpointId]);

  useEffect(() => {
    if (selectedEndpoint) {
      setQueryApiKey(selectedEndpoint.api_key);
      setQueryResult(null);
      setQueryError(null);
    }
  }, [selectedEndpoint]);

  const createMutation = useMutation({
    mutationFn: endpointApi.create,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
      setSelectedEndpointId(created.id);
      setCreateForm((prev) => ({ ...prev, name: "" }));
      setCreateError(null);
    },
    onError: (error) => setCreateError(getErrorMessage(error)),
  });

  const regenerateMutation = useMutation({
    mutationFn: endpointApi.regenerateKey,
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({ queryKey: ["api-endpoints"] });
      if (selectedEndpointId === updated.id) {
        setQueryApiKey(updated.api_key);
      }
    },
  });

  const queryMutation = useMutation({
    mutationFn: async () => {
      if (!selectedEndpointId) {
        throw new Error("Select an endpoint first.");
      }
      return endpointApi.query(selectedEndpointId, queryQuestion.trim(), queryApiKey.trim());
    },
    onSuccess: (result) => {
      setQueryResult(result.answer);
      setQueryError(null);
    },
    onError: (error) => setQueryError(getErrorMessage(error)),
  });

  function handleCreateEndpoint() {
    setCreateError(null);
    if (!createForm.name.trim()) {
      setCreateError("Endpoint name is required.");
      return;
    }
    if (!createForm.kb_id || !createForm.prompt_id || !createForm.model_name) {
      setCreateError("Please select knowledge base, prompt, and model.");
      return;
    }
    createMutation.mutate({
      name: createForm.name.trim(),
      kb_id: createForm.kb_id,
      prompt_id: createForm.prompt_id,
      model_name: createForm.model_name,
    });
  }

  async function handleCopy(text: string) {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Ignore clipboard errors in unsupported contexts.
    }
  }

  return (
    <DashboardShell
      header={
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">API Endpoints</h1>
          </div>
          <button
            type="button"
            onClick={() => endpointsQuery.refetch()}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-border text-sm hover:bg-secondary"
          >
            <RotateCcw className="w-4 h-4" />
            Refresh
          </button>
        </header>
      }
      mainClassName="flex-1 overflow-y-auto w-full relative p-8"
    >
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="rounded-xl border border-border bg-card p-4">
          <h2 className="font-semibold">Create Endpoint</h2>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Endpoint name"
              className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <select
              value={createForm.kb_id}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, kb_id: event.target.value }))}
              className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select knowledge base</option>
              {(knowledgeQuery.data ?? []).map((kb) => (
                <option key={kb.id} value={kb.id}>
                  {kb.name}
                </option>
              ))}
            </select>
            <select
              value={createForm.prompt_id}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, prompt_id: event.target.value }))}
              className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select prompt</option>
              {(promptsQuery.data ?? []).map((prompt) => (
                <option key={prompt.id} value={prompt.id}>
                  {prompt.name}
                </option>
              ))}
            </select>
            <select
              value={createForm.model_name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, model_name: event.target.value }))}
              className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select model</option>
              {llmModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          {createError && <p className="mt-3 text-sm text-red-300">{createError}</p>}
          <button
            type="button"
            onClick={handleCreateEndpoint}
            disabled={createMutation.isPending}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60"
          >
            <Plus className="w-4 h-4" />
            {createMutation.isPending ? "Creating..." : "Create Endpoint"}
          </button>
        </section>

        <section className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-4">
          <div className="space-y-3">
            {endpointsQuery.isPending && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                Loading endpoints...
              </div>
            )}
            {endpointsQuery.isError && (
              <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                Failed to load endpoints: {getErrorMessage(endpointsQuery.error as ApiError)}
              </div>
            )}
            {!endpointsQuery.isPending && !endpointsQuery.isError && (endpointsQuery.data ?? []).length === 0 && (
              <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
                No API endpoints yet.
              </div>
            )}
            {(endpointsQuery.data ?? []).map((endpoint) => (
              <article
                key={endpoint.id}
                className={`rounded-xl border bg-card p-4 space-y-3 ${
                  endpoint.id === selectedEndpointId ? "border-blue-400/60" : "border-border"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedEndpointId(endpoint.id)}
                    className="text-left"
                  >
                    <h3 className="font-semibold">{endpoint.name}</h3>
                    <p className="text-xs text-muted-foreground">{endpoint.model_name}</p>
                  </button>
                  <span
                    className={`px-2 py-0.5 rounded border text-xs ${
                      endpoint.is_active
                        ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/20"
                        : "bg-muted text-muted-foreground border-border"
                    }`}
                  >
                    {endpoint.is_active ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="rounded-lg border border-border bg-secondary/20 px-3 py-2 text-xs">
                  <p className="text-muted-foreground">API Key</p>
                  <div className="mt-1 flex items-center gap-2">
                    <code className="truncate flex-1">{endpoint.api_key}</code>
                    <button
                      type="button"
                      onClick={() => void handleCopy(endpoint.api_key)}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:bg-secondary"
                    >
                      <Copy className="w-3 h-3" />
                      Copy
                    </button>
                    <button
                      type="button"
                      onClick={() => regenerateMutation.mutate(endpoint.id)}
                      disabled={regenerateMutation.isPending}
                      className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 hover:bg-secondary disabled:opacity-60"
                    >
                      <KeyRound className="w-3 h-3" />
                      Regenerate
                    </button>
                  </div>
                </div>
                <div className="rounded-lg border border-border bg-black/20 p-2 text-xs text-muted-foreground overflow-auto">
                  <code className="whitespace-pre-wrap break-all">
                    {[
                      `curl -X POST http://localhost:8000/api/endpoints/${endpoint.id}/query \\\\`,
                      '  -H "Content-Type: application/json" \\\\',
                      `  -d '{"question":"What is in this knowledge base?","api_key":"${endpoint.api_key}"}'`,
                    ].join("\n")}
                  </code>
                </div>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-border bg-card p-4 h-fit space-y-3">
            <h2 className="font-semibold">Query Endpoint</h2>
            <select
              value={selectedEndpointId ?? ""}
              onChange={(event) => setSelectedEndpointId(event.target.value || null)}
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            >
              <option value="">Select endpoint</option>
              {(endpointsQuery.data ?? []).map((endpoint) => (
                <option key={endpoint.id} value={endpoint.id}>
                  {endpoint.name}
                </option>
              ))}
            </select>
            <input
              type="text"
              value={queryApiKey}
              onChange={(event) => setQueryApiKey(event.target.value)}
              placeholder="API key"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <textarea
              value={queryQuestion}
              onChange={(event) => setQueryQuestion(event.target.value)}
              placeholder="Ask a question..."
              className="w-full min-h-24 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => {
                if (!queryQuestion.trim()) {
                  setQueryError("Please enter a question.");
                  return;
                }
                queryMutation.mutate();
              }}
              disabled={queryMutation.isPending || !selectedEndpointId}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60"
            >
              <SendHorizontal className="w-4 h-4" />
              {queryMutation.isPending ? "Querying..." : "Run Query"}
            </button>
            {queryError && <p className="text-sm text-red-300">{queryError}</p>}
            {queryResult && (
              <div className="rounded-lg border border-border bg-secondary/20 p-3">
                <p className="text-xs text-muted-foreground mb-1">Answer</p>
                <p className="text-sm whitespace-pre-wrap">{queryResult}</p>
              </div>
            )}
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}

