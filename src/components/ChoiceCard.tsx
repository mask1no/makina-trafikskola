import type { ButtonHTMLAttributes, ReactNode } from "react";

type ChoiceCardProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected: boolean;
  children: ReactNode;
};

export function ChoiceCard({
  selected,
  children,
  className = "",
  ...props
}: ChoiceCardProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      data-selected={selected ? "true" : undefined}
      className={`choice-card relative min-h-[52px] w-full overflow-hidden rounded-md border border-[var(--line)] bg-card px-4 py-3 text-start font-bold shadow-soft disabled:cursor-not-allowed disabled:opacity-60 ${
        selected ? "text-accent-ink" : "text-ink"
      } ${className}`}
      {...props}
    >
      <span className="relative flex items-center justify-between gap-3">
        <span className="min-w-0">{children}</span>
        {selected ? (
          <span aria-hidden="true" className="text-small">
            ✓
          </span>
        ) : (
          <span aria-hidden="true" className="size-4 shrink-0" />
        )}
      </span>
    </button>
  );
}
