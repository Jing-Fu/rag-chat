import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PillPanelProps = {
  children: ReactNode;
  className?: string;
};

export function PillPanel({ children, className }: PillPanelProps) {
  return <div className={cn("rounded-full border border-input bg-card px-4 py-2", className)}>{children}</div>;
}