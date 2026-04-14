# Dashboard Homepage Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the frontend scaffold and the first dashboard homepage for the local-first RAG developer platform, matching the approved dashboard-home design spec.

**Architecture:** Create a Next.js 14 App Router frontend inside `frontend/`, establish a reusable dashboard shell with a fixed sidebar, then compose the homepage from focused dashboard sections driven by structured mock data. Keep visual components separate from future data-fetching boundaries so the homepage can later connect to backend endpoints without layout rewrites.

**Tech Stack:** Next.js 14, React 18, TypeScript, Tailwind CSS, shadcn/ui base setup, lucide-react, Vitest, Testing Library

---

## File Structure

### Generated or scaffolded files
- Create: `frontend/package.json`
- Create: `frontend/tsconfig.json`
- Create: `frontend/next.config.ts`
- Create: `frontend/postcss.config.js`
- Create: `frontend/components.json`
- Create: `frontend/src/app/layout.tsx`
- Create: `frontend/src/app/globals.css`

### Dashboard shell and homepage files
- Create: `frontend/src/app/page.tsx`
- Create: `frontend/src/components/navigation/sidebar-nav.tsx`
- Create: `frontend/src/components/dashboard/hero-panel.tsx`
- Create: `frontend/src/components/dashboard/module-card-grid.tsx`
- Create: `frontend/src/components/dashboard/stats-strip.tsx`
- Create: `frontend/src/components/dashboard/activity-feed.tsx`
- Create: `frontend/src/components/dashboard/quick-start-panel.tsx`
- Create: `frontend/src/lib/dashboard-data.ts`
- Create: `frontend/src/lib/utils.ts`

### Test files
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/components/dashboard/dashboard-homepage.test.tsx`

### Notes
- This workspace currently does not have a git repository, so commit checkpoints are intentionally omitted from this plan.
- The plan aligns with `docs/implementation-plan.md` Task 8 and narrows scope to the approved dashboard homepage.

## Task 1: Scaffold the frontend workspace

**Files:**
- Create: `frontend/` (Next.js project via create-next-app)
- Create: `frontend/package.json`
- Create: `frontend/components.json`

- [ ] **Step 1: Generate the Next.js application**

Run:

```powershell
cd D:\workspace\playground\rag-chat
npx -y create-next-app@14.2.11 ./frontend --typescript --tailwind --eslint --app --src-dir --use-npm --import-alias "@/*"
```

Expected:
- command completes without prompts
- `frontend/package.json` exists
- `frontend/src/app/page.tsx` exists as the default starter page

- [ ] **Step 2: Install runtime and test dependencies**

Run:

```powershell
cd D:\workspace\playground\rag-chat\frontend
npm install lucide-react clsx tailwind-merge
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Expected:
- install exits successfully
- `package-lock.json` is updated

- [ ] **Step 3: Initialize shadcn/ui base configuration**

Run:

```powershell
cd D:\workspace\playground\rag-chat\frontend
npx -y shadcn@latest init -d
```

Expected:
- `components.json` exists
- `src/lib/utils.ts` is created or ready to be replaced with the project version below

- [ ] **Step 4: Normalize package scripts for local validation**

Ensure `frontend/package.json` contains these scripts:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "vitest run"
  }
}
```

- [ ] **Step 5: Verify the scaffold boots before customization**

Run:

```powershell
cd D:\workspace\playground\rag-chat\frontend
npm run build
```

Expected:
- Next.js production build succeeds

## Task 2: Establish the dashboard shell and visual foundation

**Files:**
- Modify: `frontend/src/app/layout.tsx`
- Modify: `frontend/src/app/globals.css`
- Create: `frontend/src/components/navigation/sidebar-nav.tsx`
- Create or Modify: `frontend/src/lib/utils.ts`

- [ ] **Step 1: Replace the default root layout with the approved font and metadata setup**

Write `frontend/src/app/layout.tsx` as:

```tsx
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";

const displayFont = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
});

const bodyFont = Manrope({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RAG Control Room",
  description: "Local-first RAG developer platform dashboard.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body className={`${displayFont.variable} ${bodyFont.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Replace global styles with the dashboard design system**

Write `frontend/src/app/globals.css` as:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: 38 33% 96%;
  --foreground: 210 18% 12%;
  --muted: 35 20% 90%;
  --muted-foreground: 210 10% 35%;
  --card: 42 29% 98%;
  --card-foreground: 210 18% 12%;
  --border: 32 18% 82%;
  --accent: 164 40% 28%;
  --accent-foreground: 45 45% 96%;
  --accent-soft: 28 48% 56%;
  --ring: 164 40% 28%;
  --sidebar: 35 25% 92%;
}

* {
  @apply border-[hsl(var(--border))];
}

html {
  scroll-behavior: smooth;
}

body {
  @apply min-h-screen bg-[hsl(var(--background))] text-[hsl(var(--foreground))] font-[family:var(--font-body)];
  background-image:
    radial-gradient(circle at top left, rgba(209, 137, 84, 0.14), transparent 28%),
    linear-gradient(rgba(20, 55, 48, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(20, 55, 48, 0.06) 1px, transparent 1px);
  background-size: auto, 28px 28px, 28px 28px;
  background-position: 0 0, 0 0, 0 0;
}

@layer base {
  h1,
  h2,
  h3,
  h4 {
    font-family: var(--font-display);
    letter-spacing: -0.03em;
  }
}

@layer utilities {
  .editorial-panel {
    @apply rounded-[28px] border border-[hsl(var(--border))] bg-[hsla(var(--card),0.8)] backdrop-blur-sm shadow-[0_20px_60px_rgba(31,41,55,0.08)];
  }

  .section-fade-in {
    animation: sectionFade 700ms ease-out both;
  }
}

@keyframes sectionFade {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
```

- [ ] **Step 3: Add the shared utility helper used by dashboard components**

Write `frontend/src/lib/utils.ts` as:

```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 4: Create the reusable sidebar navigation component**

Write `frontend/src/components/navigation/sidebar-nav.tsx` as:

```tsx
import Link from "next/link";
import {
  BookOpen,
  Bot,
  KeyRound,
  MessageSquareText,
  PanelLeftOpen,
  ScrollText,
} from "lucide-react";

const items = [
  { href: "/", label: "Dashboard", icon: PanelLeftOpen },
  { href: "/chat", label: "Chat", icon: MessageSquareText },
  { href: "/knowledge", label: "Knowledge", icon: BookOpen },
  { href: "/endpoints", label: "Endpoints", icon: KeyRound },
  { href: "/models", label: "Models", icon: Bot },
  { href: "/prompts", label: "Prompts", icon: ScrollText },
];

export function SidebarNav() {
  return (
    <aside className="editorial-panel sticky top-6 flex h-[calc(100vh-3rem)] w-full max-w-[290px] flex-col justify-between bg-[hsla(var(--sidebar),0.88)] p-5">
      <div className="space-y-8">
        <div className="space-y-3 border-b border-[hsl(var(--border))] pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[hsl(var(--muted-foreground))]">
            Local-first RAG
          </p>
          <div>
            <h1 className="text-3xl leading-none text-[hsl(var(--foreground))]">Control Room</h1>
            <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
              Self-hosted orchestration for knowledge, models, prompts, and developer-facing endpoints.
            </p>
          </div>
        </div>

        <nav className="space-y-2">
          {items.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center justify-between rounded-2xl border border-transparent px-4 py-3 text-sm font-medium text-[hsl(var(--foreground))] transition hover:border-[hsl(var(--border))] hover:bg-white/60"
            >
              <span className="flex items-center gap-3">
                <Icon className="h-4 w-4 text-[hsl(var(--accent))]" />
                {label}
              </span>
              <span className="text-xs uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))] opacity-0 transition group-hover:opacity-100">
                Open
              </span>
            </Link>
          ))}
        </nav>
      </div>

      <div className="rounded-3xl border border-[hsl(var(--border))] bg-white/70 p-4">
        <p className="text-xs uppercase tracking-[0.28em] text-[hsl(var(--muted-foreground))]">System mode</p>
        <p className="mt-3 text-lg font-semibold text-[hsl(var(--foreground))]">Local / Self-hosted</p>
        <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">
          Backend, vector store, and Ollama connectivity surface through the dashboard state panels.
        </p>
      </div>
    </aside>
  );
}
```

- [ ] **Step 5: Verify the shell files compile before homepage sections exist**

Run:

```powershell
cd D:\workspace\playground\rag-chat\frontend
npm run build
```

Expected:
- build succeeds with the new layout and sidebar component available for import

## Task 3: Build the dashboard homepage sections from mock platform data

**Files:**
- Modify: `frontend/src/app/page.tsx`
- Create: `frontend/src/lib/dashboard-data.ts`
- Create: `frontend/src/components/dashboard/hero-panel.tsx`
- Create: `frontend/src/components/dashboard/module-card-grid.tsx`
- Create: `frontend/src/components/dashboard/stats-strip.tsx`
- Create: `frontend/src/components/dashboard/activity-feed.tsx`
- Create: `frontend/src/components/dashboard/quick-start-panel.tsx`

- [ ] **Step 1: Add structured mock data for the homepage states**

Write `frontend/src/lib/dashboard-data.ts` as:

```ts
import {
  BookOpen,
  Bot,
  KeyRound,
  MessageSquareText,
  ScrollText,
  type LucideIcon,
} from "lucide-react";

export type DashboardState = "ready" | "loading" | "empty" | "error";

export type ModuleCard = {
  title: string;
  href: string;
  description: string;
  indicator: string;
  icon: LucideIcon;
};

export type StatItem = {
  label: string;
  value: string;
  detail: string;
  state: DashboardState;
};

export type ActivityItem = {
  title: string;
  detail: string;
  timestamp: string;
};

export type QuickStartItem = {
  step: string;
  title: string;
  href: string;
  description: string;
};

export const heroBadges = ["Backend ready", "Local mode", "Ollama check pending"];

export const moduleCards: ModuleCard[] = [
  {
    title: "Chat",
    href: "/chat",
    description: "Launch grounded conversations against indexed knowledge with SSE-ready response flows.",
    indicator: "Recent 14 sessions",
    icon: MessageSquareText,
  },
  {
    title: "Knowledge",
    href: "/knowledge",
    description: "Ingest documents, tune chunk size and overlap, and keep retrieval sources organized.",
    indicator: "3 active bases",
    icon: BookOpen,
  },
  {
    title: "Endpoints",
    href: "/endpoints",
    description: "Publish RAG APIs with managed keys, prompt bindings, and model selection.",
    indicator: "2 endpoints live",
    icon: KeyRound,
  },
  {
    title: "Models",
    href: "/models",
    description: "Inspect local Ollama inventory, pull new models, and retire unused ones.",
    indicator: "5 models synced",
    icon: Bot,
  },
  {
    title: "Prompts",
    href: "/prompts",
    description: "Curate reusable system prompts and question templates for consistent RAG behavior.",
    indicator: "1 default template",
    icon: ScrollText,
  },
];

export const stats: StatItem[] = [
  {
    label: "Knowledge bases",
    value: "03",
    detail: "1 indexing, 2 ready",
    state: "ready",
  },
  {
    label: "Synced models",
    value: "05",
    detail: "LLM + embedding mix",
    state: "ready",
  },
  {
    label: "Active endpoints",
    value: "02",
    detail: "1 awaiting key rotation",
    state: "loading",
  },
  {
    label: "Recent chats",
    value: "14",
    detail: "Last session 16 min ago",
    state: "ready",
  },
];

export const activityItems: ActivityItem[] = [
  {
    title: "Policy handbook indexed",
    detail: "Knowledge / Company Handbook",
    timestamp: "12 minutes ago",
  },
  {
    title: "llama3.2 pulled locally",
    detail: "Models / 4.7 GB synced",
    timestamp: "41 minutes ago",
  },
  {
    title: "Support endpoint key rotated",
    detail: "Endpoints / support-assistant",
    timestamp: "2 hours ago",
  },
];

export const quickStartItems: QuickStartItem[] = [
  {
    step: "01",
    title: "Create a knowledge base",
    href: "/knowledge",
    description: "Upload your first document set and define chunk size, overlap, and embedding model.",
  },
  {
    step: "02",
    title: "Choose a model",
    href: "/models",
    description: "Confirm an Ollama LLM and embedding model are available before you query anything.",
  },
  {
    step: "03",
    title: "Start a grounded chat",
    href: "/chat",
    description: "Open a session, select the knowledge base, and validate response quality with citations.",
  },
];
```

- [ ] **Step 2: Create the hero, modules, stats, activity, and quick-start components**

Write `frontend/src/components/dashboard/hero-panel.tsx` as:

```tsx
import Link from "next/link";

type HeroPanelProps = {
  badges: string[];
};

export function HeroPanel({ badges }: HeroPanelProps) {
  return (
    <section className="editorial-panel section-fade-in overflow-hidden p-8 lg:p-10">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl space-y-6">
          <p className="text-xs font-semibold uppercase tracking-[0.36em] text-[hsl(var(--muted-foreground))]">
            Dashboard homepage
          </p>
          <div className="space-y-4">
            <h2 className="max-w-3xl text-5xl leading-[0.92] text-[hsl(var(--foreground))] md:text-6xl">
              Run retrieval, prompts, models, and APIs from one local control surface.
            </h2>
            <p className="max-w-2xl text-base leading-8 text-[hsl(var(--muted-foreground))] md:text-lg">
              A self-hosted RAG workstation for developers who want grounded answers, inspectable flows, and
              predictable infrastructure.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            {badges.map((badge) => (
              <span
                key={badge}
                className="rounded-full border border-[hsl(var(--border))] bg-white/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.24em] text-[hsl(var(--muted-foreground))]"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
          <Link
            href="/chat"
            className="rounded-full bg-[hsl(var(--accent))] px-6 py-3 text-center text-sm font-semibold text-[hsl(var(--accent-foreground))] transition hover:translate-y-[-1px]"
          >
            Open chat
          </Link>
          <Link
            href="/knowledge"
            className="rounded-full border border-[hsl(var(--foreground))] px-6 py-3 text-center text-sm font-semibold text-[hsl(var(--foreground))] transition hover:bg-white/70"
          >
            Create knowledge base
          </Link>
        </div>
      </div>
    </section>
  );
}
```

Write `frontend/src/components/dashboard/module-card-grid.tsx` as:

```tsx
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import type { ModuleCard } from "@/lib/dashboard-data";

type ModuleCardGridProps = {
  cards: ModuleCard[];
};

export function ModuleCardGrid({ cards }: ModuleCardGridProps) {
  return (
    <section className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
      {cards.map(({ title, href, description, indicator, icon: Icon }, index) => (
        <Link
          key={title}
          href={href}
          className="editorial-panel section-fade-in group flex min-h-[230px] flex-col justify-between p-6 transition duration-300 hover:-translate-y-1 hover:shadow-[0_24px_80px_rgba(20,55,48,0.12)]"
          style={{ animationDelay: `${index * 90}ms` }}
        >
          <div className="space-y-6">
            <div className="flex items-start justify-between">
              <span className="rounded-full bg-[hsla(var(--accent),0.12)] p-3 text-[hsl(var(--accent))]">
                <Icon className="h-5 w-5" />
              </span>
              <ArrowUpRight className="h-4 w-4 text-[hsl(var(--muted-foreground))] transition group-hover:text-[hsl(var(--accent))]" />
            </div>
            <div className="space-y-3">
              <h3 className="text-3xl leading-none text-[hsl(var(--foreground))]">{title}</h3>
              <p className="text-sm leading-7 text-[hsl(var(--muted-foreground))]">{description}</p>
            </div>
          </div>
          <div className="flex items-center justify-between border-t border-[hsl(var(--border))] pt-4 text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
            <span>{indicator}</span>
            <span>Enter</span>
          </div>
        </Link>
      ))}
    </section>
  );
}
```

Write `frontend/src/components/dashboard/stats-strip.tsx` as:

```tsx
import type { StatItem } from "@/lib/dashboard-data";

const stateTone = {
  ready: "bg-emerald-50 text-emerald-800",
  loading: "bg-amber-50 text-amber-800",
  empty: "bg-stone-100 text-stone-700",
  error: "bg-rose-50 text-rose-800",
} as const;

type StatsStripProps = {
  items: StatItem[];
};

export function StatsStrip({ items }: StatsStripProps) {
  return (
    <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {items.map((item, index) => (
        <article
          key={item.label}
          className="editorial-panel section-fade-in p-5"
          style={{ animationDelay: `${120 + index * 80}ms` }}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))]">
                {item.label}
              </p>
              <p className="mt-3 text-4xl leading-none text-[hsl(var(--foreground))]">{item.value}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] ${stateTone[item.state]}`}>
              {item.state}
            </span>
          </div>
          <p className="mt-4 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.detail}</p>
        </article>
      ))}
    </section>
  );
}
```

Write `frontend/src/components/dashboard/activity-feed.tsx` as:

```tsx
import { Clock3 } from "lucide-react";

import type { ActivityItem } from "@/lib/dashboard-data";

type ActivityFeedProps = {
  items: ActivityItem[];
};

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <section className="editorial-panel section-fade-in p-6" style={{ animationDelay: "260ms" }}>
      <div className="flex items-center justify-between gap-4 border-b border-[hsl(var(--border))] pb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))]">Recent activity</p>
          <h3 className="mt-2 text-3xl leading-none text-[hsl(var(--foreground))]">Latest platform movements</h3>
        </div>
        <Clock3 className="h-5 w-5 text-[hsl(var(--accent))]" />
      </div>

      <div className="mt-5 space-y-4">
        {items.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-[hsl(var(--border))] bg-white/40 p-5 text-sm leading-7 text-[hsl(var(--muted-foreground))]">
            Activity will appear here after your first knowledge import, model sync, or chat session.
          </div>
        ) : (
          items.map((item) => (
            <article key={`${item.title}-${item.timestamp}`} className="rounded-3xl border border-[hsl(var(--border))] bg-white/60 p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h4 className="text-xl text-[hsl(var(--foreground))]">{item.title}</h4>
                  <p className="mt-1 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.detail}</p>
                </div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-[hsl(var(--muted-foreground))]">
                  {item.timestamp}
                </span>
              </div>
            </article>
          ))
        )}
      </div>
    </section>
  );
}
```

Write `frontend/src/components/dashboard/quick-start-panel.tsx` as:

```tsx
import Link from "next/link";

import type { QuickStartItem } from "@/lib/dashboard-data";

type QuickStartPanelProps = {
  items: QuickStartItem[];
};

export function QuickStartPanel({ items }: QuickStartPanelProps) {
  return (
    <section className="editorial-panel section-fade-in p-6" style={{ animationDelay: "320ms" }}>
      <p className="text-xs font-semibold uppercase tracking-[0.26em] text-[hsl(var(--muted-foreground))]">Quick start</p>
      <h3 className="mt-2 text-3xl leading-none text-[hsl(var(--foreground))]">First-run sequence</h3>

      <div className="mt-6 space-y-4">
        {items.map((item) => (
          <Link
            key={item.step}
            href={item.href}
            className="block rounded-3xl border border-[hsl(var(--border))] bg-white/60 p-4 transition hover:-translate-y-1 hover:bg-white/80"
          >
            <div className="flex items-start gap-4">
              <span className="rounded-full bg-[hsl(var(--foreground))] px-3 py-2 text-xs font-semibold tracking-[0.22em] text-white">
                {item.step}
              </span>
              <div>
                <h4 className="text-xl text-[hsl(var(--foreground))]">{item.title}</h4>
                <p className="mt-2 text-sm leading-6 text-[hsl(var(--muted-foreground))]">{item.description}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
```

- [ ] **Step 3: Compose the homepage with the dashboard shell and sections**

Write `frontend/src/app/page.tsx` as:

```tsx
import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { HeroPanel } from "@/components/dashboard/hero-panel";
import { ModuleCardGrid } from "@/components/dashboard/module-card-grid";
import { QuickStartPanel } from "@/components/dashboard/quick-start-panel";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { SidebarNav } from "@/components/navigation/sidebar-nav";
import { activityItems, heroBadges, moduleCards, quickStartItems, stats } from "@/lib/dashboard-data";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
      <SidebarNav />

      <div className="flex-1 space-y-6">
        <HeroPanel badges={heroBadges} />
        <ModuleCardGrid cards={moduleCards} />
        <StatsStrip items={stats} />

        <div className="grid gap-6 xl:grid-cols-[1.25fr_0.95fr]">
          <ActivityFeed items={activityItems} />
          <QuickStartPanel items={quickStartItems} />
        </div>
      </div>
    </main>
  );
}
```

- [ ] **Step 4: Run the production build to validate the new homepage**

Run:

```powershell
cd D:\workspace\playground\rag-chat\frontend
npm run build
```

Expected:
- build succeeds
- homepage compiles with the new dashboard component tree

## Task 4: Add regression coverage and verify behavior

**Files:**
- Create: `frontend/vitest.config.ts`
- Create: `frontend/src/test/setup.ts`
- Create: `frontend/src/components/dashboard/dashboard-homepage.test.tsx`

- [ ] **Step 1: Configure Vitest for DOM component testing**

Write `frontend/vitest.config.ts` as:

```ts
import path from "node:path";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

Write `frontend/src/test/setup.ts` as:

```ts
import "@testing-library/jest-dom/vitest";
```

- [ ] **Step 2: Add homepage component tests for key content and empty-state handling**

Write `frontend/src/components/dashboard/dashboard-homepage.test.tsx` as:

```tsx
import { render, screen } from "@testing-library/react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { HeroPanel } from "@/components/dashboard/hero-panel";
import { ModuleCardGrid } from "@/components/dashboard/module-card-grid";
import { QuickStartPanel } from "@/components/dashboard/quick-start-panel";
import { StatsStrip } from "@/components/dashboard/stats-strip";
import { activityItems, heroBadges, moduleCards, quickStartItems, stats } from "@/lib/dashboard-data";

describe("dashboard homepage sections", () => {
  it("renders the hero headline and primary actions", () => {
    render(<HeroPanel badges={heroBadges} />);

    expect(screen.getByText(/Run retrieval, prompts, models, and APIs/i)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open chat/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Create knowledge base/i })).toBeInTheDocument();
  });

  it("renders all module cards", () => {
    render(<ModuleCardGrid cards={moduleCards} />);

    expect(screen.getByRole("link", { name: /Chat/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Knowledge/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Endpoints/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Models/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Prompts/i })).toBeInTheDocument();
  });

  it("renders the stats strip and quick start guidance", () => {
    render(
      <>
        <StatsStrip items={stats} />
        <QuickStartPanel items={quickStartItems} />
      </>
    );

    expect(screen.getByText(/Knowledge bases/i)).toBeInTheDocument();
    expect(screen.getByText(/First-run sequence/i)).toBeInTheDocument();
    expect(screen.getByText(/Create a knowledge base/i)).toBeInTheDocument();
  });

  it("shows an intentional empty state for activity", () => {
    render(<ActivityFeed items={[]} />);

    expect(screen.getByText(/Activity will appear here after your first knowledge import/i)).toBeInTheDocument();
  });

  it("renders recent activity entries when present", () => {
    render(<ActivityFeed items={activityItems} />);

    expect(screen.getByText(/Policy handbook indexed/i)).toBeInTheDocument();
    expect(screen.getByText(/llama3.2 pulled locally/i)).toBeInTheDocument();
  });
});
```

- [ ] **Step 3: Run the dashboard tests**

Run:

```powershell
cd D:\workspace\playground\rag-chat\frontend
npm run test
```

Expected:
- Vitest passes
- the homepage sections are covered for core content and empty-state behavior

- [ ] **Step 4: Run the final validation commands**

Run:

```powershell
cd D:\workspace\playground\rag-chat\frontend
npm run lint
npm run build
```

Expected:
- lint passes
- build passes

## Self-Review Notes
- Spec coverage: hero, module grid, summary strip, recent activity, quick start, responsive dashboard shell, and empty-state handling all map to tasks above.
- Placeholder scan: no `TODO`, `TBD`, or implicit implementation gaps remain.
- Type consistency: the shared `dashboard-data.ts` types match the props consumed by each dashboard section component.