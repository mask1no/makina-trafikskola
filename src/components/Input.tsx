import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ id, label, error, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="grid gap-2">
      <label className="text-sm font-semibold text-ink" htmlFor={inputId}>
        {label}
      </label>
      <input
        id={inputId}
        className={`min-h-11 rounded-sm border bg-card px-4 text-ink outline-none transition placeholder:text-ink-muted focus:border-accent ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error && inputId ? `${inputId}-error` : undefined}
        {...props}
      />
      {error ? (
        <p id={inputId ? `${inputId}-error` : undefined} className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
