import type { SelectHTMLAttributes } from "react";

type SelectProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  error?: string;
};

export function Select({
  id,
  label,
  error,
  className = "",
  children,
  ...props
}: SelectProps) {
  const selectId = id ?? props.name;

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor={selectId}>
        <span>{label}</span>
        <span className="relative">
          <select
            id={selectId}
            className={`min-h-11 w-full appearance-none rounded-sm border bg-card ps-4 pe-11 py-2.5 text-ink shadow-soft outline-none transition duration-200 ease-premium hover:border-border-strong focus:border-ink focus:ring-2 focus:ring-accent ${
              error ? "border-danger" : "border-border"
            } ${className}`}
            aria-invalid={Boolean(error)}
            aria-describedby={error && selectId ? `${selectId}-error` : undefined}
            {...props}
          >
            {children}
          </select>
          <svg
            aria-hidden="true"
            viewBox="0 0 16 16"
            className="rtl-directional pointer-events-none absolute end-4 top-1/2 size-4 -translate-y-1/2 text-ink-muted"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.75"
          >
            <path d="m3 6 5 5 5-5" />
          </svg>
        </span>
      </label>
      {error ? (
        <p
          id={selectId ? `${selectId}-error` : undefined}
          className="text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
