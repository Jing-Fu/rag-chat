import { type ReactNode } from "react";

import { AppSidebar, type AppSidebarProps } from "@/components/layout/app-sidebar";

type DashboardShellProps = {
  header?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  sidebarProps?: AppSidebarProps;
  mainClassName?: string;
};

export function DashboardShell({
  header,
  children,
  footer,
  sidebarProps,
  mainClassName,
}: DashboardShellProps) {
  return (
    <div className="flex h-dvh min-h-dvh flex-col overflow-hidden bg-background text-foreground lg:flex-row">
      <AppSidebar {...sidebarProps} />
      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        {header}
        <main className={mainClassName ?? "min-h-0 flex-1 overflow-y-auto px-5 py-6 sm:px-8 lg:px-10"}>{children}</main>
        {footer}
      </div>
    </div>
  );
}

