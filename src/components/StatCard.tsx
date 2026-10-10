import type { ReactNode } from "react";

type StatCardProps = {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  icon?: ReactNode;
  size?: "sm" | "md";
  className?: string;
};

export function StatCard({
  label,
  value,
  detail,
  icon,
  size = "md",
  className = "",
}: StatCardProps) {
  const compact = size === "sm";
  return (
    <article className={`rounded-md border border-border bg-card shadow-soft ${compact ? "p-4" : "p-5 sm:p-6"} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink-muted">{label}</p>
          <div className={`mt-2 font-black tracking-tighter text-ink numbers-ltr ${compact ? "text-2xl" : "text-3xl"}`}>
            {value}
          </div>
        </div>
        {icon ? (
          <span className="grid size-11 shrink-0 place-items-center rounded-sm bg-accent text-accent-ink">
            {icon}
          </span>
        ) : null}
      </div>
      {detail ? <div className={`${compact ? "mt-2" : "mt-4"} text-sm text-ink-muted`}>{detail}</div> : null}
    </article>
  );
}
