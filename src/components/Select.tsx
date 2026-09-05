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
        <select
          id={selectId}
          className={`min-h-11 w-full rounded-sm border bg-card px-4 py-2.5 text-ink shadow-soft outline-none transition duration-200 ease-premium hover:border-border-strong focus:border-ink ${
            error ? "border-danger" : "border-border"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error && selectId ? `${selectId}-error` : undefined}
          {...props}
        >
          {children}
        </select>
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
