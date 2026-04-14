"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, KeyRound, Link2, Plus, RotateCcw, SendHorizontal } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { Button } from "@/components/ui/button";
import { type ApiError, endpointApi, knowledgeApi, modelApi, promptApi } from "@/lib/api";

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
    <DashboardShell>
      <PageHeader
        icon={<Link2 className="h-4 w-4" />}
        title="API Endpoints"
        description="Create query endpoints backed by a knowledge base, prompt, and local model."
        actions={
          <Button type="button" variant="outline" onClick={() => endpointsQuery.refetch()}>
            <RotateCcw className="h-4 w-4" />
            Refresh
          </Button>
        }
      />

      <div className="space-y-6">
        <PageSection title="Create Endpoint" description="Package a prompt, model, and knowledge base into a reusable query surface.">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <input
              type="text"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Endpoint name"
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <select
              value={createForm.kb_id}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, kb_id: event.target.value }))}
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
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
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
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
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            >
              <option value="">Select model</option>
              {llmModels.map((model) => (
                <option key={model.name} value={model.name}>
                  {model.name}
                </option>
              ))}
            </select>
          </div>
          {createError ? <p className="mt-3 text-sm text-red-600">{createError}</p> : null}
          <div className="mt-4">
            <Button type="button" onClick={handleCreateEndpoint} disabled={createMutation.isPending}>
              <Plus className="h-4 w-4" />
              {createMutation.isPending ? "Creating..." : "Create Endpoint"}
            </Button>
          </div>
        </PageSection>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_minmax(0,1fr)]">
          <PageSection title="Endpoint Inventory" description="Review active keys and the model pairing behind each endpoint.">
            <div className="space-y-3">
              {endpointsQuery.isPending ? <p className="muted-copy">Loading endpoints...</p> : null}
              {endpointsQuery.isError ? (
                <p className="text-sm text-red-600">
                  Failed to load endpoints: {getErrorMessage(endpointsQuery.error as ApiError)}
                </p>
              ) : null}
              {!endpointsQuery.isPending && !endpointsQuery.isError && (endpointsQuery.data ?? []).length === 0 ? (
                <p className="muted-copy">No API endpoints yet.</p>
              ) : null}

              {(endpointsQuery.data ?? []).map((endpoint) => {
                const isSelected = endpoint.id === selectedEndpointId;

                return (
                  <article
                    key={endpoint.id}
                    className={`rounded-xl border p-4 ${isSelected ? "border-neutral-300 bg-neutral-50" : "border-border bg-card"}`}
                  >
                    <button
                      type="button"
                      onClick={() => setSelectedEndpointId(endpoint.id)}
                      className="w-full text-left"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-foreground">{endpoint.name}</p>
                          <p className="mt-1 text-sm text-muted-foreground">{endpoint.model_name}</p>
                        </div>
                        <span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">
                          {endpoint.is_active ? "Active" : "Disabled"}
                        </span>
                      </div>
                    </button>

                    <div className="mt-4 rounded-xl border border-border bg-white px-4 py-3 text-xs text-muted-foreground">
                      <p>API Key</p>
                      <div className="mt-2 flex items-center gap-2">
                        <code className="min-w-0 flex-1 truncate">{endpoint.api_key}</code>
                        <Button type="button" variant="outline" size="sm" onClick={() => void handleCopy(endpoint.api_key)}>
                          <Copy className="h-3.5 w-3.5" />
                          Copy
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => regenerateMutation.mutate(endpoint.id)}
                          disabled={regenerateMutation.isPending}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                          Regenerate
                        </Button>
                      </div>
                    </div>

                    <pre className="mt-4 overflow-x-auto rounded-xl border border-border bg-neutral-50 p-4 text-xs text-neutral-700">
                      <code>
                        {[
                          `curl -X POST http://localhost:8000/api/endpoints/${endpoint.id}/query \\\\`,
                          '  -H "Content-Type: application/json" \\\\',
                          `  -d '{"question":"What is in this knowledge base?","api_key":"${endpoint.api_key}"}'`,
                        ].join("\n")}
                      </code>
                    </pre>
                  </article>
                );
              })}
            </div>
          </PageSection>

          <PageSection title="Query Workspace" description="Send a test request with the current key and inspect the response payload.">
            <div className="space-y-4">
              <select
                value={selectedEndpointId ?? ""}
                onChange={(event) => setSelectedEndpointId(event.target.value || null)}
                className="h-11 w-full rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
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
                className="h-11 w-full rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
              />

              <textarea
                value={queryQuestion}
                onChange={(event) => setQueryQuestion(event.target.value)}
                placeholder="Ask a question"
                className="min-h-28 w-full rounded-xl border border-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
              />

              <Button
                type="button"
                onClick={() => {
                  if (!queryQuestion.trim()) {
                    setQueryError("Please enter a question.");
                    return;
                  }
                  queryMutation.mutate();
                }}
                disabled={queryMutation.isPending || !selectedEndpointId}
              >
                <SendHorizontal className="h-4 w-4" />
                {queryMutation.isPending ? "Querying..." : "Run Query"}
              </Button>

              {queryError ? <p className="text-sm text-red-600">{queryError}</p> : null}

              <div className="rounded-xl border border-border bg-neutral-50 p-4">
                <p className="mono-label mb-3 text-neutral-400">response</p>
                <pre className="overflow-x-auto whitespace-pre-wrap text-sm text-neutral-700">
                  {queryResult ?? "No response yet."}
                </pre>
              </div>
            </div>
          </PageSection>
        </div>
      </div>
    </DashboardShell>
  );
}