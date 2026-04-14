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

    expect(screen.getByText("RAG Workspace")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /new chat/i }));

    expect(resetSessionSelection).toHaveBeenCalledTimes(1);
    expect(push).toHaveBeenCalledWith("/");
  });

  it("uses the provided new-chat handler before navigating", () => {
    const onNewChat = vi.fn();

    render(<AppSidebar onNewChat={onNewChat} />);

    fireEvent.click(screen.getByRole("button", { name: /new chat/i }));

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

    fireEvent.click(screen.getByLabelText("Delete session session-"));

    expect(onDeleteSession).toHaveBeenCalledWith("session-1");
  });
});
