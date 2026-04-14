import type { ReactNode } from "react";

type PageSectionProps = {
  title?: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
};

export function PageSection({ title, description, actions, children, className }: PageSectionProps) {
  return (
    <section className={`surface-panel p-5 sm:p-6 ${className ?? ""}`.trim()}>
      {title || description || actions ? (
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title ? <h2 className="text-lg font-medium text-foreground">{title}</h2> : null}
            {description ? <p className="mt-1 text-sm text-muted-foreground">{description}</p> : null}
          </div>
          {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
        </div>
      ) : null}
      {children}
    </section>
  );
}