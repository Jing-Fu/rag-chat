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

  it("renders markdown content inside assistant messages", () => {
    render(
      <ChatMessageList
        messages={[
          {
            id: "assistant-3",
            session_id: "session-1",
            role: "assistant",
            content:
              "# 標題\n\n- 第一項\n- 第二項\n\n`const answer = 42;`\n\n[文件](https://example.com/docs)",
            sources: { items: [] },
            created_at: new Date().toISOString(),
          },
        ]}
      />,
    );

    expect(screen.getByRole("heading", { level: 1, name: "標題" })).toBeInTheDocument();
    expect(screen.getByText("第一項")).toBeInTheDocument();
    expect(screen.getByText("const answer = 42;")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "文件" })).toHaveAttribute(
      "href",
      "https://example.com/docs",
    );
  });

  it("preserves plain line breaks after enabling markdown rendering", () => {
    const { container } = render(
      <ChatMessageList
        messages={[
          {
            id: "assistant-4",
            session_id: "session-1",
            role: "assistant",
            content: "第一行\n第二行",
            sources: { items: [] },
            created_at: new Date().toISOString(),
          },
        ]}
      />,
    );

    expect(container.querySelector("br")).not.toBeNull();
  });
});
