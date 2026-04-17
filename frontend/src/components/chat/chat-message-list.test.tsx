import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ChatMessageList } from "@/components/chat/chat-message-list";

describe("ChatMessageList", () => {
  it("shows a placeholder bubble while the assistant response is still streaming", () => {
    render(
      <ChatMessageList
        isStreaming
        messages={[
          {
            id: "assistant-1",
            session_id: "session-1",
            role: "assistant",
            content: "",
            sources: { items: [] },
            created_at: new Date().toISOString(),
          },
        ]}
      />,
    );

    expect(screen.getByLabelText("助理正在思考")).toBeInTheDocument();
  });

  it("renders a Sources label for assistant citations", () => {
    render(
      <ChatMessageList
        messages={[
          {
            id: "assistant-2",
            session_id: "session-1",
            role: "assistant",
            content: "Answer",
            sources: {
              items: [
                {
                  chunk_id: "chunk-1",
                  chunk_index: 0,
                  content: "content",
                  metadata: null,
                  filename: "notes.md",
                  relevance_score: 0.91,
                },
              ],
            },
            created_at: new Date().toISOString(),
          },
        ]}
      />,
    );

    expect(screen.getByText("引用來源")).toBeInTheDocument();
    expect(screen.getByText(/notes.md/)).toBeInTheDocument();
  });
});
