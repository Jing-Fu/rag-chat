# Ollama Frontend Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Restyle the existing frontend into a white, grayscale, Ollama-inspired product UI without changing routes, backend APIs, or core workflows.

**Architecture:** Keep all current data-fetching and state management intact, but replace the visual foundation at the token, shell, and shared-component layers first. Then recompose the chat and management screens around a consistent set of flat, pill-first primitives so every route shares the same layout language.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Tailwind CSS, React Query, Zustand, Vitest

---

## File Structure Map

### Existing files to modify

- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/app/knowledge/page.tsx`
- Modify: `frontend/src/app/models/page.tsx`
- Modify: `frontend/src/app/prompts/page.tsx`
- Modify: `frontend/src/app/endpoints/page.tsx`
- Modify: `frontend/src/components/ui/button.tsx`
- Modify: `frontend/src/components/layout/dashboard-shell.tsx`
- Modify: `frontend/src/components/layout/app-sidebar.tsx`
- Modify: `frontend/src/components/chat/chat-header.tsx`
- Modify: `frontend/src/components/chat/chat-input.tsx`
- Modify: `frontend/src/components/chat/chat-message-list.tsx`
- Modify: `frontend/src/components/chat/chat-input.test.tsx`
- Modify: `frontend/src/components/chat/chat-message-list.test.tsx`
- Modify: `frontend/src/components/layout/app-sidebar.test.tsx`

### New files to create

- Create: `frontend/src/components/layout/page-header.tsx`
- Create: `frontend/src/components/layout/page-section.tsx`
- Create: `frontend/src/components/layout/pill-panel.tsx`

## Task 1: Rebuild Global Design Tokens

**Files:**

- Modify: `frontend/src/app/globals.css`
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/components/ui/button.tsx`
- Test: `frontend/src/components/chat/chat-input.test.tsx`

- [ ] **Step 1: Write a failing test that expects the chat composer to keep the new plain-language placeholder**

```tsx
import { render, screen } from "@testing-library/react";

import { ChatInput } from "@/components/chat/chat-input";

it("renders the minimal composer placeholder", () => {
  render(<ChatInput value="" onChange={() => {}} onSubmit={() => {}} />);

  expect(screen.getByPlaceholderText("Ask anything about your local knowledge")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the focused test and confirm it fails before the redesign**

Run: `npm run test -- src/components/chat/chat-input.test.tsx`

Expected: `FAIL` because the existing placeholder is still `Message RAG Assistant...`

- [ ] **Step 3: Replace the dark-first token set with grayscale Ollama tokens**

```css
:root {
  --background: 0 0% 100%;
  --foreground: 0 0% 0%;
  --card: 0 0% 100%;
  --card-foreground: 0 0% 0%;
  --popover: 0 0% 100%;
  --popover-foreground: 0 0% 0%;
  --primary: 0 0% 0%;
  --primary-foreground: 0 0% 100%;
  --secondary: 0 0% 90%;
  --secondary-foreground: 0 0% 15%;
  --muted: 0 0% 98%;
  --muted-foreground: 0 0% 45%;
  --accent: 0 0% 98%;
  --accent-foreground: 0 0% 15%;
  --border: 0 0% 90%;
  --input: 0 0% 83%;
  --ring: 217 91% 60%;
  --radius: 0.75rem;
}

body {
  min-height: 100vh;
  background-color: hsl(var(--background));
  color: hsl(var(--foreground));
  font-family: var(--font-body), sans-serif;
}
```

- [ ] **Step 4: Replace the font setup with an Apple-first rounded display stack and system body stack**

```tsx
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="font-sans antialiased" suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

```css
:root {
  --font-display: "SF Pro Rounded", ui-rounded, system-ui, -apple-system, sans-serif;
  --font-body: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
```

- [ ] **Step 5: Remap button variants to pill-first grayscale styling**

```tsx
const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-full border text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "border-black bg-black text-white hover:bg-neutral-900",
        secondary: "border-neutral-200 bg-neutral-200 text-neutral-800 hover:bg-neutral-300",
        outline: "border-neutral-300 bg-white text-neutral-700 hover:bg-neutral-50",
        ghost: "border-transparent bg-transparent text-neutral-700 hover:bg-neutral-100",
      },
    },
  },
);
```

- [ ] **Step 6: Update the default chat placeholder to match the new product tone**

```tsx
placeholder = "Ask anything about your local knowledge";
```

- [ ] **Step 7: Re-run the focused test and confirm it passes**

Run: `npm run test -- src/components/chat/chat-input.test.tsx`

Expected: `PASS`

- [ ] **Step 8: Commit the foundation changes**

```bash
git add frontend/src/app/globals.css frontend/src/app/layout.tsx frontend/src/components/ui/button.tsx frontend/src/components/chat/chat-input.tsx frontend/src/components/chat/chat-input.test.tsx
git commit -m "feat(frontend): add ollama-inspired design tokens"
```

## Task 2: Replace the Dark Dashboard Shell

**Files:**

- Modify: `frontend/src/components/layout/dashboard-shell.tsx`
- Modify: `frontend/src/components/layout/app-sidebar.tsx`
- Create: `frontend/src/components/layout/page-header.tsx`
- Test: `frontend/src/components/layout/app-sidebar.test.tsx`

- [ ] **Step 1: Write a failing navigation test for the lighter shell labels**

```tsx
import { render, screen } from "@testing-library/react";

import { AppSidebar } from "@/components/layout/app-sidebar";

it("renders the workspace heading and new chat action", () => {
  render(<AppSidebar sessions={[]} />);

  expect(screen.getByRole("button", { name: /new chat/i })).toBeInTheDocument();
  expect(screen.getByText("RAG Workspace")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the navigation test and confirm the redesigned shell structure is not implemented yet**

Run: `npm run test -- src/components/layout/app-sidebar.test.tsx`

Expected: `FAIL` if the current assertions depend on the older dark shell or lack the new semantic structure

- [ ] **Step 3: Simplify the dashboard shell so it becomes a white frame with optional desktop rail**

```tsx
export function DashboardShell({ header, children, footer, sidebarProps, mainClassName }: DashboardShellProps) {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <AppSidebar {...sidebarProps} />
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className={mainClassName ?? "flex-1 px-5 py-6 sm:px-8 lg:px-10"}>{children}</main>
        {footer}
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Rebuild the sidebar as a restrained white rail with pill rows and route links**

```tsx
<aside className="hidden lg:flex w-[280px] shrink-0 border-r border-border bg-white">
  <div className="flex min-h-screen w-full flex-col px-4 py-5">
    <button className="inline-flex items-center justify-center rounded-full border border-neutral-200 bg-neutral-200 px-4 py-2 text-sm text-neutral-900">
      <Plus className="h-4 w-4" />
      New Chat
    </button>
  </div>
</aside>
```

- [ ] **Step 5: Add a reusable page header component for secondary screens**

```tsx
type PageHeaderProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-neutral-500">{icon}</div>
        <h1 className="font-[var(--font-display)] text-3xl font-medium tracking-tight text-black">{title}</h1>
        {description ? <p className="max-w-2xl text-sm text-neutral-500">{description}</p> : null}
      </div>
      {actions}
    </header>
  );
}
```

- [ ] **Step 6: Re-run the sidebar test and confirm the new shell semantics pass**

Run: `npm run test -- src/components/layout/app-sidebar.test.tsx`

Expected: `PASS`

- [ ] **Step 7: Commit the shell refactor**

```bash
git add frontend/src/components/layout/dashboard-shell.tsx frontend/src/components/layout/app-sidebar.tsx frontend/src/components/layout/page-header.tsx frontend/src/components/layout/app-sidebar.test.tsx
git commit -m "feat(frontend): rebuild navigation shell"
```

## Task 3: Redesign the Chat Experience

**Files:**

- Modify: `frontend/src/app/page.tsx`
- Modify: `frontend/src/components/chat/chat-header.tsx`
- Modify: `frontend/src/components/chat/chat-input.tsx`
- Modify: `frontend/src/components/chat/chat-message-list.tsx`
- Test: `frontend/src/components/chat/chat-message-list.test.tsx`

- [ ] **Step 1: Write a failing test for the new empty-state copy or source label structure**

```tsx
import { render, screen } from "@testing-library/react";

import { ChatMessageList } from "@/components/chat/chat-message-list";

it("renders the new Sources label for assistant citations", () => {
  render(
    <ChatMessageList
      messages={[
        {
          id: "1",
          session_id: "s1",
          role: "assistant",
          content: "Answer",
          created_at: new Date().toISOString(),
          sources: { items: [{ chunk_id: "c1", chunk_index: 0, filename: "notes.md", relevance_score: 0.91 }] },
        },
      ]}
    />,
  );

  expect(screen.getByText("Sources")).toBeInTheDocument();
});
```

- [ ] **Step 2: Run the chat message test and confirm the new structure is not satisfied yet**

Run: `npm run test -- src/components/chat/chat-message-list.test.tsx`

Expected: `FAIL` if the previous assertions or source rendering no longer match the intended structure

- [ ] **Step 3: Rebuild the chat header selectors as calm pills instead of toolbar chips**

```tsx
<header className="sticky top-0 z-10 border-b border-border bg-white/95 px-4 py-3 backdrop-blur">
  <div className="flex flex-wrap items-center gap-2">
    <DropdownMenuTrigger className="inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-sm text-neutral-700">
      <Cpu className="h-4 w-4 text-neutral-500" />
      <span>{selectedModelLabel}</span>
      <ChevronDown className="h-3 w-3 text-neutral-400" />
    </DropdownMenuTrigger>
  </div>
</header>
```

- [ ] **Step 4: Recompose the home page around a centered empty state and lighter conversation column**

```tsx
const showLandingState = messageList.length === 0 && !isStreaming;

return (
  <DashboardShell header={<ChatHeader {...headerProps} />} sidebarProps={sidebarProps}>
    <section className="mx-auto flex min-h-[calc(100vh-10rem)] w-full max-w-5xl flex-col">
      {showLandingState ? (
        <div className="flex flex-1 flex-col items-center justify-center px-4 text-center">
          <p className="font-mono text-xs uppercase tracking-[0.24em] text-neutral-400">local rag workspace</p>
          <h1 className="mt-4 font-[var(--font-display)] text-4xl font-medium tracking-tight text-black sm:text-5xl">
            Ask better questions of your own data.
          </h1>
        </div>
      ) : (
        <ChatMessageList messages={messageList} isStreaming={isStreaming} />
      )}
    </section>
  </DashboardShell>
);
```

- [ ] **Step 5: Restyle the composer as a flat bordered pill with minimal helper text**

```tsx
<div className="mx-auto w-full max-w-4xl border border-neutral-200 bg-white px-3 py-2 rounded-[9999px]">
  <textarea
    className="min-h-[52px] w-full resize-none bg-transparent px-4 py-3 text-[15px] text-black outline-none placeholder:text-neutral-400"
    placeholder="Ask anything about your local knowledge"
  />
</div>
```

- [ ] **Step 6: Restyle message rendering so user and assistant blocks are quieter and flatter**

```tsx
<article className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
  <div className={isUser ? "max-w-[78%] rounded-[9999px] bg-black px-5 py-3 text-sm text-white" : "max-w-[78%] rounded-3xl border border-neutral-200 bg-white px-5 py-4 text-sm text-neutral-900"}>
    <p className="whitespace-pre-wrap break-words">{message.content}</p>
  </div>
</article>
```

- [ ] **Step 7: Re-run the chat message test and confirm it passes**

Run: `npm run test -- src/components/chat/chat-message-list.test.tsx`

Expected: `PASS`

- [ ] **Step 8: Commit the chat redesign**

```bash
git add frontend/src/app/page.tsx frontend/src/components/chat/chat-header.tsx frontend/src/components/chat/chat-input.tsx frontend/src/components/chat/chat-message-list.tsx frontend/src/components/chat/chat-message-list.test.tsx
git commit -m "feat(frontend): redesign chat workspace"
```

## Task 4: Create Shared Flat Panels and Restyle Management Screens

**Files:**

- Create: `frontend/src/components/layout/page-section.tsx`
- Create: `frontend/src/components/layout/pill-panel.tsx`
- Modify: `frontend/src/app/knowledge/page.tsx`
- Modify: `frontend/src/app/models/page.tsx`
- Modify: `frontend/src/app/prompts/page.tsx`
- Modify: `frontend/src/app/endpoints/page.tsx`

- [ ] **Step 1: Add a reusable bordered section component for secondary screens**

```tsx
type PageSectionProps = {
  title?: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
};

export function PageSection({ title, description, children, actions }: PageSectionProps) {
  return (
    <section className="rounded-xl border border-neutral-200 bg-white p-5 sm:p-6">
      {(title || actions) ? (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-medium text-black">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-neutral-500">{description}</p> : null}
          </div>
          {actions}
        </div>
      ) : null}
      {children}
    </section>
  );
}
```

- [ ] **Step 2: Add a reusable pill wrapper for inline forms, filters, and compact metadata**

```tsx
type PillPanelProps = {
  children: React.ReactNode;
  className?: string;
};

export function PillPanel({ children, className }: PillPanelProps) {
  return <div className={cn("rounded-full border border-neutral-200 bg-white px-4 py-2", className)}>{children}</div>;
}
```

- [ ] **Step 3: Replace each page header with the shared minimal header component**

```tsx
<PageHeader
  icon={<Database className="h-4 w-4" />}
  title="Knowledge Bases"
  description="Index source material, inspect status, and keep retrieval grounded."
  actions={<Button variant="default">New Knowledge Base</Button>}
/>
```

- [ ] **Step 4: Recompose the Knowledge page into a list-detail workspace**

```tsx
<div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
  <PageSection title="Libraries">{knowledgeBaseList}</PageSection>
  <PageSection title={selectedKnowledgeBase?.name ?? "Knowledge Base"}>{documentTable}</PageSection>
</div>
```

- [ ] **Step 5: Flatten the Models page into a bordered form panel and clean inventory table**

```tsx
<PageSection title="Pull Model" description="Fetch a local model without leaving the workspace.">
  <div className="flex flex-col gap-3 sm:flex-row">
    <input className="h-11 flex-1 rounded-full border border-neutral-300 px-4" />
    <Button>Pull</Button>
  </div>
</PageSection>
```

- [ ] **Step 6: Restyle Prompts and Endpoints with the same split-view and bordered monospace surfaces**

```tsx
<PageSection title="Response Preview">
  <pre className="overflow-x-auto rounded-xl border border-neutral-200 bg-neutral-50 p-4 font-mono text-sm text-neutral-700">
    {queryResult ?? "No response yet."}
  </pre>
</PageSection>
```

- [ ] **Step 7: Run a full frontend test pass after the shared-page refactor**

Run: `npm run test`

Expected: `PASS` for the existing component and store test suite after assertions are updated for the new markup

- [ ] **Step 8: Commit the management-screen redesign**

```bash
git add frontend/src/components/layout/page-section.tsx frontend/src/components/layout/pill-panel.tsx frontend/src/app/knowledge/page.tsx frontend/src/app/models/page.tsx frontend/src/app/prompts/page.tsx frontend/src/app/endpoints/page.tsx
git commit -m "feat(frontend): restyle management screens"
```

## Task 5: Final Verification and Regression Checks

**Files:**

- Modify: `frontend/README.md`
- Modify: `frontend/src/components/chat/chat-input.test.tsx`
- Modify: `frontend/src/components/chat/chat-message-list.test.tsx`
- Modify: `frontend/src/components/layout/app-sidebar.test.tsx`

- [ ] **Step 1: Update README copy so local developers understand the new design direction**

```md
## UI Direction

The frontend follows an Ollama-inspired grayscale design language:

- white background surfaces
- black primary text
- pill-shaped controls
- 12px container corners
- no shadows or gradients
```

- [ ] **Step 2: Run the production build to catch layout or type regressions**

Run: `npm run build`

Expected: `Compiled successfully` or equivalent Next.js build success output

- [ ] **Step 3: Run the smoke test script against the rebuilt UI**

Run: `npm run test:smoke`

Expected: smoke script completes without navigation or rendering failures

- [ ] **Step 4: Capture any selector or role regressions found during smoke testing and fix them before merge**

```tsx
expect(screen.getByRole("heading", { name: /knowledge bases/i })).toBeInTheDocument();
expect(screen.getByRole("button", { name: /new chat/i })).toBeInTheDocument();
expect(screen.getByPlaceholderText("Ask anything about your local knowledge")).toBeInTheDocument();
```

- [ ] **Step 5: Commit the verification pass and documentation update**

```bash
git add frontend/README.md frontend/src/components/chat/chat-input.test.tsx frontend/src/components/chat/chat-message-list.test.tsx frontend/src/components/layout/app-sidebar.test.tsx
git commit -m "test(frontend): verify ollama redesign"
```

## Self-Review

### Spec coverage

- Global grayscale tokens: covered in Task 1
- White shell and navigation: covered in Task 2
- Chat redesign: covered in Task 3
- Management page consistency: covered in Task 4
- Testing and build verification: covered in Task 5

### Placeholder scan

- No `TODO`, `TBD`, or deferred implementation markers remain in this plan.

### Type consistency

- Shared layout components use ReactNode-based APIs consistent with the existing codebase.
- Route files remain App Router page modules.
- Shared button and layout primitives stay inside the existing frontend component structure.