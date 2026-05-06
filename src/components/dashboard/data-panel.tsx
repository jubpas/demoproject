import type { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
};

export function DataPanel({ title, description, actions, children }: Props) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)]">
      <div className="flex flex-col gap-4 border-b border-[var(--border)] px-6 py-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <h2 className="text-lg font-medium text-[var(--foreground)]">{title}</h2>
          {description ? <p className="text-sm text-[var(--muted)]">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-3">{actions}</div> : null}
      </div>
      <div className="p-6">{children}</div>
    </section>
  );
}
