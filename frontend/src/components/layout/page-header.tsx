import type { ReactNode } from "react";

type PageHeaderProps = {
  icon?: ReactNode;
  title: string;
  description?: string;
  actions?: ReactNode;
};

export function PageHeader({ icon, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div className="space-y-2">
        {icon ? <div className="text-neutral-500">{icon}</div> : null}
        <div>
          <h1 className="display-title text-3xl leading-none text-foreground sm:text-4xl">{title}</h1>
          {description ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
        </div>
      </div>
      {actions ? <div className="flex items-center gap-3">{actions}</div> : null}
    </header>
  );
}
