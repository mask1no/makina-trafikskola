import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function Input({ id, label, error, className = "", ...props }: InputProps) {
  const inputId = id ?? props.name;

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor={inputId}>
        <span>{label}</span>
        <input
          id={inputId}
          className={`min-h-11 w-full rounded-sm border bg-card px-4 py-2.5 text-ink shadow-soft outline-none transition duration-200 ease-premium placeholder:text-ink-subtle hover:border-border-strong focus:border-ink ${
            error ? "border-danger" : "border-border"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          {...props}
        />
      </label>
      {error ? (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          className="text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
