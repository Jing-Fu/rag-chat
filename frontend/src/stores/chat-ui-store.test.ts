import { describe, expect, it } from "vitest";

import { useChatUiStore } from "@/stores/chat-ui-store";

describe("useChatUiStore", () => {
  it("tracks selected model/prompt/knowledge/session values", () => {
    const state = useChatUiStore.getState();

    state.setSelectedModelName("llama3.2");
    state.setSelectedPromptId("prompt-id");
    state.setSelectedKnowledgeBaseId("kb-id");
    state.setSelectedSessionId("session-id");

    const next = useChatUiStore.getState();
    expect(next.selectedModelName).toBe("llama3.2");
    expect(next.selectedPromptId).toBe("prompt-id");
    expect(next.selectedKnowledgeBaseId).toBe("kb-id");
    expect(next.selectedSessionId).toBe("session-id");

    next.resetSessionSelection();
    expect(useChatUiStore.getState().selectedSessionId).toBeNull();
  });
});

