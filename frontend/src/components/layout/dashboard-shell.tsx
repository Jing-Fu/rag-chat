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
    <div className="min-h-screen bg-background text-foreground lg:flex">
      <AppSidebar {...sidebarProps} />
      <div className="flex min-w-0 flex-1 flex-col">
        {header}
        <main className={mainClassName ?? "flex-1 px-5 py-6 sm:px-8 lg:px-10"}>{children}</main>
        {footer}
      </div>
    </div>
  );
}

