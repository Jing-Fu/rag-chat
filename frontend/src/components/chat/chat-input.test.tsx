import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { ChatInput } from "@/components/chat/chat-input";

describe("ChatInput", () => {
  it("renders the minimal composer placeholder", () => {
    render(<ChatInput value="" onChange={() => {}} onSubmit={() => {}} />);

    expect(screen.getByPlaceholderText("詢問任何與本機知識庫相關的問題")).toBeInTheDocument();
  });

  it("submits on Enter without Shift when message is non-empty", () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();

    render(
      <ChatInput
        value="hello"
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    );

    const textarea = screen.getByPlaceholderText("詢問任何與本機知識庫相關的問題");
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: false });

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("does not submit on Shift+Enter", () => {
    const onSubmit = vi.fn();
    const onChange = vi.fn();

    render(
      <ChatInput
        value="hello"
        onChange={onChange}
        onSubmit={onSubmit}
      />,
    );

    const textarea = screen.getByPlaceholderText("詢問任何與本機知識庫相關的問題");
    fireEvent.keyDown(textarea, { key: "Enter", code: "Enter", shiftKey: true });

    expect(onSubmit).not.toHaveBeenCalled();
  });
});
