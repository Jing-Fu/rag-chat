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