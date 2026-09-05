import type { ReactNode } from "react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: ReactNode;
};

export function EmptyState({ title, description, action, icon }: EmptyStateProps) {
  return (
    <div className="rounded-lg border border-dashed border-border-strong bg-card-muted p-8 text-center sm:p-10">
      <div
        aria-hidden="true"
        className="mx-auto mb-5 grid size-14 place-items-center rounded-md border border-border bg-card text-ink shadow-soft"
      >
        {icon ?? (
          <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75">
            <path d="M5 8.5 12 5l7 3.5v7L12 19l-7-3.5v-7Z" />
            <path d="m5 8.5 7 3.5 7-3.5M12 12v7" />
          </svg>
        )}
      </div>
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
