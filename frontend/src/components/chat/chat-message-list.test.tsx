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

    expect(screen.getByLabelText("Assistant is thinking")).toBeInTheDocument();
  });
});
