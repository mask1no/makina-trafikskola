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
      <label className="text-sm font-semibold" htmlFor={selectId}>
        {label}
      </label>
      <select
        id={selectId}
        className={`min-h-11 rounded-sm border bg-card px-4 text-ink outline-none focus:border-accent ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        aria-invalid={Boolean(error)}
        {...props}
      >
        {children}
      </select>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
}
