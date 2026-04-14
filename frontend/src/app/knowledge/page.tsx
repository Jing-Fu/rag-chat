"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Plus, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PageHeader } from "@/components/layout/page-header";
import { PageSection } from "@/components/layout/page-section";
import { PillPanel } from "@/components/layout/pill-panel";
import { Button } from "@/components/ui/button";
import { type ApiError, knowledgeApi } from "@/lib/api";

function statusBadge(status: string) {
  if (status === "ready" || status === "active") {
    return "border-neutral-200 bg-neutral-100 text-neutral-700";
  }
  if (status === "indexing" || status === "processing") {
    return "border-neutral-300 bg-white text-neutral-600";
  }
  return "border-red-200 bg-red-50 text-red-700";
}

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return "Unknown error";
}

export default function KnowledgePage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [selectedKbId, setSelectedKbId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [createForm, setCreateForm] = useState({
    name: "",
    description: "",
    chunk_size: 1000,
    chunk_overlap: 200,
    embedding_model: "nomic-embed-text",
  });
  const uploadInputRef = useRef<HTMLInputElement | null>(null);

  const knowledgeBasesQuery = useQuery({
    queryKey: ["knowledge-bases"],
    queryFn: knowledgeApi.list,
  });

  useEffect(() => {
    if (!knowledgeBasesQuery.data || knowledgeBasesQuery.data.length === 0) {
      setSelectedKbId(null);
      return;
    }
    if (!selectedKbId) {
      setSelectedKbId(knowledgeBasesQuery.data[0].id);
      return;
    }
    const exists = knowledgeBasesQuery.data.some((item) => item.id === selectedKbId);
    if (!exists) {
      setSelectedKbId(knowledgeBasesQuery.data[0].id);
    }
  }, [knowledgeBasesQuery.data, selectedKbId]);

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

  const selectedKnowledgeBase = filteredItems.find((item) => item.id === selectedKbId)
    ?? knowledgeBasesQuery.data?.find((item) => item.id === selectedKbId)
    ?? null;

  const documentsQuery = useQuery({
    queryKey: ["knowledge-documents", selectedKbId],
    queryFn: () => knowledgeApi.listDocuments(selectedKbId as string),
    enabled: Boolean(selectedKbId),
  });

  const createKnowledgeBaseMutation = useMutation({
    mutationFn: knowledgeApi.create,
    onSuccess: async (created) => {
      await queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      setSelectedKbId(created.id);
      setIsCreateOpen(false);
      setCreateError(null);
      setCreateForm({
        name: "",
        description: "",
        chunk_size: 1000,
        chunk_overlap: 200,
        embedding_model: "nomic-embed-text",
      });
    },
    onError: (error) => {
      setCreateError(getErrorMessage(error));
    },
  });

  const deleteKnowledgeBaseMutation = useMutation({
    mutationFn: knowledgeApi.delete,
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      await queryClient.invalidateQueries({ queryKey: ["knowledge-documents"] });
    },
  });

  const uploadDocumentMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!selectedKbId) {
        throw new Error("Please select a knowledge base first.");
      }
      return knowledgeApi.upload(selectedKbId, file);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      await queryClient.invalidateQueries({ queryKey: ["knowledge-documents", selectedKbId] });
    },
  });

  const reindexMutation = useMutation({
    mutationFn: async (docId: string) => {
      if (!selectedKbId) {
        throw new Error("Please select a knowledge base first.");
      }
      return knowledgeApi.reindexDocument(selectedKbId, docId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["knowledge-documents", selectedKbId] });
    },
  });

  const deleteDocumentMutation = useMutation({
    mutationFn: async (docId: string) => {
      if (!selectedKbId) {
        throw new Error("Please select a knowledge base first.");
      }
      return knowledgeApi.deleteDocument(selectedKbId, docId);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["knowledge-bases"] });
      await queryClient.invalidateQueries({ queryKey: ["knowledge-documents", selectedKbId] });
    },
  });

  function handleCreateKnowledgeBase() {
    setCreateError(null);
    if (!createForm.name.trim()) {
      setCreateError("Name is required.");
      return;
    }
    if (createForm.chunk_overlap >= createForm.chunk_size) {
      setCreateError("chunk_overlap must be smaller than chunk_size.");
      return;
    }
    createKnowledgeBaseMutation.mutate({
      ...createForm,
      name: createForm.name.trim(),
      description: createForm.description.trim() || null,
    });
  }

  async function handleDeleteKnowledgeBase(id: string) {
    if (!window.confirm("Delete this knowledge base and all related documents/chunks?")) {
      return;
    }
    await deleteKnowledgeBaseMutation.mutateAsync(id);
  }

  async function handleUploadFile(file: File | null) {
    if (!file) {
      return;
    }
    await uploadDocumentMutation.mutateAsync(file);
  }

  return (
    <DashboardShell>
      <PageHeader
        icon={<Database className="h-4 w-4" />}
        title="Knowledge Bases"
        description="Index source material, inspect ingestion status, and keep retrieval grounded."
        actions={
          <Button type="button" onClick={() => setIsCreateOpen((prev) => !prev)}>
            <Plus className="h-4 w-4" />
            New Knowledge Base
          </Button>
        }
      />

      {isCreateOpen ? (
        <PageSection
          title="Create Knowledge Base"
          description="Choose a name, chunking strategy, and embedding model before ingesting files."
          className="mb-6"
        >
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <input
              type="text"
              value={createForm.name}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Name"
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <input
              type="text"
              value={createForm.embedding_model}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, embedding_model: event.target.value }))}
              placeholder="Embedding model"
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <input
              type="number"
              min={100}
              max={10000}
              value={createForm.chunk_size}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, chunk_size: Number(event.target.value) }))}
              placeholder="Chunk size"
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
            <input
              type="number"
              min={0}
              max={5000}
              value={createForm.chunk_overlap}
              onChange={(event) => setCreateForm((prev) => ({ ...prev, chunk_overlap: Number(event.target.value) }))}
              placeholder="Chunk overlap"
              className="h-11 rounded-full border border-input px-4 text-sm outline-none focus:ring-2 focus:ring-ring/50"
            />
          </div>
          <textarea
            value={createForm.description}
            onChange={(event) => setCreateForm((prev) => ({ ...prev, description: event.target.value }))}
            placeholder="Description"
            className="mt-3 min-h-24 w-full rounded-xl border border-input px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-ring/50"
          />
          {createError ? <p className="mt-3 text-sm text-red-600">{createError}</p> : null}
          <div className="mt-4 flex items-center gap-2">
            <Button type="button" onClick={handleCreateKnowledgeBase} disabled={createKnowledgeBaseMutation.isPending}>
              {createKnowledgeBaseMutation.isPending ? "Creating..." : "Create"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
          </div>
        </PageSection>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <PageSection
          title="Libraries"
          description="Browse all indexed knowledge bases in this workspace."
        >
          <PillPanel className="mb-4 flex items-center gap-2 px-4 py-0">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search knowledge bases"
              className="h-11 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </PillPanel>

          <div className="space-y-2">
            {knowledgeBasesQuery.isPending ? <p className="muted-copy">Loading knowledge bases...</p> : null}
            {knowledgeBasesQuery.isError ? (
              <p className="text-sm text-red-600">
                Failed to load knowledge bases: {getErrorMessage(knowledgeBasesQuery.error as ApiError)}
              </p>
            ) : null}
            {!knowledgeBasesQuery.isPending && !knowledgeBasesQuery.isError && filteredItems.length === 0 ? (
              <p className="muted-copy">No knowledge bases found.</p>
            ) : null}
            {filteredItems.map((item) => {
              const isSelected = item.id === selectedKbId;

              return (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    isSelected ? "border-neutral-300 bg-neutral-50" : "border-border bg-card hover:bg-neutral-50"
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => setSelectedKbId(item.id)}
                    className="w-full text-left"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                          {item.description ?? "No description"}
                        </p>
                      </div>
                      <span className={`rounded-full border px-2.5 py-1 text-xs ${statusBadge(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="mt-3 text-xs text-muted-foreground">{item.document_count} documents</p>
                  </button>
                </div>
              );
            })}
          </div>
        </PageSection>

        <PageSection
          title={selectedKnowledgeBase?.name ?? "Knowledge Base"}
          description={selectedKnowledgeBase?.description ?? "Inspect files, refresh indexing, and upload new source material."}
          actions={
            <>
              <input
                ref={uploadInputRef}
                type="file"
                className="hidden"
                onChange={(event) => {
                  const [file] = Array.from(event.target.files ?? []);
                  void handleUploadFile(file ?? null);
                  event.target.value = "";
                }}
              />
              <Button
                type="button"
                variant="secondary"
                onClick={() => uploadInputRef.current?.click()}
                disabled={!selectedKbId || uploadDocumentMutation.isPending}
              >
                <UploadCloud className="h-4 w-4" />
                {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </Button>
              {selectedKnowledgeBase ? (
                <Button type="button" variant="outline" onClick={() => void handleDeleteKnowledgeBase(selectedKnowledgeBase.id)}>
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              ) : null}
            </>
          }
        >
          {selectedKnowledgeBase ? (
            <div className="mb-5 flex flex-wrap gap-2">
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                chunk size {selectedKnowledgeBase.chunk_size}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                overlap {selectedKnowledgeBase.chunk_overlap}
              </span>
              <span className="rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                {selectedKnowledgeBase.embedding_model}
              </span>
            </div>
          ) : null}

          {!selectedKbId ? <p className="muted-copy">Select a knowledge base to view documents.</p> : null}
          {selectedKbId && documentsQuery.isPending ? <p className="muted-copy">Loading documents...</p> : null}
          {selectedKbId && documentsQuery.isError ? (
            <p className="text-sm text-red-600">
              Failed to load documents: {getErrorMessage(documentsQuery.error as ApiError)}
            </p>
          ) : null}

          {selectedKbId && !documentsQuery.isPending && !documentsQuery.isError ? (
            <div className="space-y-3">
              {(documentsQuery.data ?? []).length === 0 ? <p className="muted-copy">No documents uploaded yet.</p> : null}
              {(documentsQuery.data ?? []).map((doc) => (
                <div key={doc.id} className="rounded-xl border border-border p-4">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{doc.filename}</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {doc.file_type} · {doc.chunk_count} chunks · {doc.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => reindexMutation.mutate(doc.id)}
                        disabled={reindexMutation.isPending}
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                        Reindex
                      </Button>
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        disabled={deleteDocumentMutation.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Delete
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : null}
        </PageSection>
      </div>
    </DashboardShell>
  );
}