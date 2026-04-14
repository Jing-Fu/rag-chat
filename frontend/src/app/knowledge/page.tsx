"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Database, Plus, RefreshCw, Search, Trash2, UploadCloud } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DashboardShell } from "@/components/layout/dashboard-shell";
import { type ApiError, knowledgeApi } from "@/lib/api";

function statusBadge(status: string) {
  if (status === "ready" || status === "active") {
    return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
  }
  if (status === "indexing" || status === "processing") {
    return "bg-amber-500/10 text-amber-300 border-amber-500/20";
  }
  return "bg-red-500/10 text-red-300 border-red-500/20";
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
    <DashboardShell
      header={
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-background">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-foreground" />
            <h1 className="text-lg font-semibold text-foreground">Knowledge Bases</h1>
          </div>
          <button
            type="button"
            onClick={() => setIsCreateOpen((prev) => !prev)}
            className="flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 transition-colors px-4 py-2 rounded-lg text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Knowledge Base
          </button>
        </header>
      }
      mainClassName="flex-1 overflow-y-auto w-full relative p-8"
    >
      <div className="max-w-6xl mx-auto space-y-6">
        {isCreateOpen && (
          <div className="rounded-xl border border-border bg-card p-4 space-y-4">
            <h2 className="text-base font-semibold">Create Knowledge Base</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                type="text"
                value={createForm.name}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Name"
                className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="text"
                value={createForm.embedding_model}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, embedding_model: event.target.value }))
                }
                placeholder="Embedding model"
                className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={100}
                max={10000}
                value={createForm.chunk_size}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, chunk_size: Number(event.target.value) }))
                }
                placeholder="Chunk size"
                className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="number"
                min={0}
                max={5000}
                value={createForm.chunk_overlap}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, chunk_overlap: Number(event.target.value) }))
                }
                placeholder="Chunk overlap"
                className="bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
              />
            </div>
            <textarea
              value={createForm.description}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Description"
              className="w-full min-h-20 bg-secondary/50 border border-border rounded-lg px-3 py-2 text-sm"
            />
            {createError && <p className="text-sm text-red-300">{createError}</p>}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCreateKnowledgeBase}
                disabled={createKnowledgeBaseMutation.isPending}
                className="px-4 py-2 rounded-lg bg-foreground text-background text-sm font-medium disabled:opacity-60"
              >
                {createKnowledgeBaseMutation.isPending ? "Creating..." : "Create"}
              </button>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="px-4 py-2 rounded-lg border border-border text-sm"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={keyword}
              onChange={(event) => setKeyword(event.target.value)}
              placeholder="Search knowledge bases..."
              className="w-full bg-secondary/50 border border-border rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring transition-all placeholder:text-muted-foreground text-foreground"
            />
          </div>
        </div>

        <div className="border border-border rounded-xl overflow-hidden bg-card">
          <table className="w-full text-left text-sm">
            <thead className="bg-secondary/30 border-b border-border">
              <tr>
                <th className="px-6 py-3 font-medium text-foreground">Name</th>
                <th className="px-6 py-3 font-medium text-foreground">Description</th>
                <th className="px-6 py-3 font-medium text-foreground">Documents</th>
                <th className="px-6 py-3 font-medium text-foreground">Status</th>
                <th className="px-6 py-3 font-medium text-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {knowledgeBasesQuery.isPending && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-muted-foreground">
                    Loading knowledge bases...
                  </td>
                </tr>
              )}

              {knowledgeBasesQuery.isError && (
                <tr>
                  <td colSpan={5} className="px-6 py-6 text-red-300">
                    Failed to load knowledge bases: {getErrorMessage(knowledgeBasesQuery.error as ApiError)}
                  </td>
                </tr>
              )}

              {!knowledgeBasesQuery.isPending &&
                !knowledgeBasesQuery.isError &&
                filteredItems.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-6 text-muted-foreground">
                      No knowledge bases found.
                    </td>
                  </tr>
                )}

              {!knowledgeBasesQuery.isPending &&
                !knowledgeBasesQuery.isError &&
                filteredItems.map((item) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-secondary/20 transition-colors group cursor-pointer ${
                      selectedKbId === item.id ? "bg-secondary/20" : ""
                    }`}
                    onClick={() => setSelectedKbId(item.id)}
                  >
                    <td className="px-6 py-4 font-medium text-foreground">{item.name}</td>
                    <td className="px-6 py-4 text-muted-foreground truncate max-w-xs">
                      {item.description ?? "No description"}
                    </td>
                    <td className="px-6 py-4 text-muted-foreground">{item.document_count} Files</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${statusBadge(
                          item.status,
                        )}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-current" />
                        {item.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            queryClient.invalidateQueries({
                              queryKey: ["knowledge-documents", item.id],
                            });
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                          title="Sync / Refresh"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            if (!selectedKbId || selectedKbId !== item.id) {
                              setSelectedKbId(item.id);
                            }
                            uploadInputRef.current?.click();
                          }}
                          className="p-1.5 text-muted-foreground hover:text-foreground rounded hover:bg-secondary"
                          title="Upload Document"
                        >
                          <UploadCloud className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            void handleDeleteKnowledgeBase(item.id);
                          }}
                          className="p-1.5 text-red-500/70 hover:text-red-500 rounded hover:bg-red-500/10"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <h2 className="font-semibold text-foreground">
              Documents {selectedKnowledgeBase ? `· ${selectedKnowledgeBase.name}` : ""}
            </h2>
            <div className="flex items-center gap-2">
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
              <button
                type="button"
                onClick={() => uploadInputRef.current?.click()}
                disabled={!selectedKbId || uploadDocumentMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-foreground text-background text-xs font-medium disabled:opacity-60"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {uploadDocumentMutation.isPending ? "Uploading..." : "Upload"}
              </button>
            </div>
          </div>

          <div className="p-4">
            {!selectedKbId && (
              <p className="text-sm text-muted-foreground">Select a knowledge base to view documents.</p>
            )}

            {selectedKbId && documentsQuery.isPending && (
              <p className="text-sm text-muted-foreground">Loading documents...</p>
            )}

            {selectedKbId && documentsQuery.isError && (
              <p className="text-sm text-red-300">
                Failed to load documents: {getErrorMessage(documentsQuery.error as ApiError)}
              </p>
            )}

            {selectedKbId && !documentsQuery.isPending && !documentsQuery.isError && (
              <div className="space-y-2">
                {(documentsQuery.data ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>
                )}
                {(documentsQuery.data ?? []).map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{doc.filename}</p>
                      <p className="text-xs text-muted-foreground">
                        {doc.file_type} · {doc.chunk_count} chunks · {doc.status}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => reindexMutation.mutate(doc.id)}
                        disabled={reindexMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs border border-border hover:bg-secondary disabled:opacity-60"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Reindex
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteDocumentMutation.mutate(doc.id)}
                        disabled={deleteDocumentMutation.isPending}
                        className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-red-300 border border-red-500/30 hover:bg-red-500/10 disabled:opacity-60"
                      >
                        <Trash2 className="w-3 h-3" />
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardShell>
  );
}
