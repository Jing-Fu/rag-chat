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
    <div className="flex h-screen bg-background font-sans overflow-hidden">
      <AppSidebar {...sidebarProps} />
      <div className="flex-1 flex flex-col min-w-0 h-full relative">
        {header}
        <main className={mainClassName ?? "flex-1 overflow-y-auto w-full relative"}>{children}</main>
        {footer}
      </div>
    </div>
  );
}

