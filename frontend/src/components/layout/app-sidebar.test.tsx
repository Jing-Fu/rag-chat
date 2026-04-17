import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppSidebar } from "@/components/layout/app-sidebar";

const push = vi.fn();
const resetSessionSelection = vi.fn();

vi.mock("next/navigation", () => ({
  usePathname: () => "/knowledge",
  useRouter: () => ({ push }),
}));

vi.mock("@/stores", () => ({
  useChatUiStore: (selector: (state: { resetSessionSelection: () => void }) => unknown) =>
    selector({ resetSessionSelection }),
}));

vi.mock("@/components/ui/scroll-area", () => ({
  ScrollArea: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) => (
    <button type="button" {...props}>
      {children}
    </button>
  ),
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe("AppSidebar", () => {
  beforeEach(() => {
    push.mockReset();
    resetSessionSelection.mockReset();
  });

  it("routes to chat and resets session when no custom new-chat handler is provided", () => {
    render(<AppSidebar />);

    expect(screen.getByText("RAG 工作區")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "新對話" }));

    expect(resetSessionSelection).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/");
  });

  it("uses the provided new-chat handler before navigating", () => {
    const onNewChat = vi.fn();

    render(<AppSidebar onNewChat={onNewChat} />);

    fireEvent.click(screen.getByRole("button", { name: "新對話" }));

    expect(onNewChat).toHaveBeenCalledTimes(1);
    expect(resetSessionSelection).not.toHaveBeenCalled();
    expect(push).toHaveBeenCalledWith("/");
  });

  it("calls the provided delete handler for a session", () => {
    const onDeleteSession = vi.fn();

    render(
      <AppSidebar
        sessions={[
          {
            id: "session-1",
            kb_id: "kb-1",
            prompt_id: null,
            model_name: "llama3.2",
            message_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]}
        onDeleteSession={onDeleteSession}
      />,
    );

    fireEvent.click(screen.getByLabelText("刪除對話 session-"));

    expect(onDeleteSession).toHaveBeenCalledWith("session-1");
  });

  it("calls the provided delete-all handler", () => {
    const onDeleteAllSessions = vi.fn();

    render(
      <AppSidebar
        sessions={[
          {
            id: "session-1",
            kb_id: "kb-1",
            prompt_id: null,
            model_name: "llama3.2",
            message_count: 1,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ]}
        onDeleteAllSessions={onDeleteAllSessions}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "全部刪除" }));

    expect(onDeleteAllSessions).toHaveBeenCalledTimes(1);
  });
});
