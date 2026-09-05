import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  className?: string;
};

export function StatCard({
  label,
  value,
  detail,
  icon,
  className = "",
}: StatCardProps) {
  return (
    <article className={`rounded-md border border-border bg-card p-5 shadow-soft sm:p-6 ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-muted">{label}</p>
          <div className="mt-2 text-3xl font-black tracking-tighter text-ink numbers-ltr">
            {value}
          </div>
        </div>
        {icon ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-accent text-accent-ink">
            {icon}
          </span>
        ) : null}
      </div>
      {detail ? <div className="mt-4 text-sm text-ink-muted">{detail}</div> : null}
    </article>
  );
}
