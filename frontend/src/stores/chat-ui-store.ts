import { create } from "zustand";

type ChatUiState = {
  selectedModelName: string | null;
  selectedPromptId: string | null;
  selectedKnowledgeBaseId: string | null;
  selectedSessionId: string | null;
  setSelectedModelName: (value: string | null) => void;
  setSelectedPromptId: (value: string | null) => void;
  setSelectedKnowledgeBaseId: (value: string | null) => void;
  setSelectedSessionId: (value: string | null) => void;
  resetSessionSelection: () => void;
};

export const useChatUiStore = create<ChatUiState>((set) => ({
  selectedModelName: null,
  selectedPromptId: null,
  selectedKnowledgeBaseId: null,
  selectedSessionId: null,
  setSelectedModelName: (value) => set({ selectedModelName: value }),
  setSelectedPromptId: (value) => set({ selectedPromptId: value }),
  setSelectedKnowledgeBaseId: (value) => set({ selectedKnowledgeBaseId: value }),
  setSelectedSessionId: (value) => set({ selectedSessionId: value }),
  resetSessionSelection: () => set({ selectedSessionId: null }),
}));

