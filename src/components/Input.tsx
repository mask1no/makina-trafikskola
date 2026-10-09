import type { InputHTMLAttributes } from "react";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
  hint?: string;
  valid?: boolean;
};

export function Input({ id, label, error, hint, valid, className = "", required, ...props }: InputProps) {
  const inputId = id ?? props.name;
  const message = error || hint;

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-small font-semibold text-ink" htmlFor={inputId}>
        <span>
          {label}
          {required ? " *" : ""}
        </span>
        <input
          id={inputId}
          required={required}
          className={`min-h-11 w-full rounded-sm border bg-card px-4 py-2.5 text-body text-ink shadow-soft outline-none transition duration-150 ease-premium placeholder:text-ink-subtle hover:border-border-strong focus:border-ink ${
            error ? "border-danger" : valid ? "border-success" : "border-border"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={message && inputId ? `${inputId}-error` : undefined}
          {...props}
        />
      </label>
      {message ? (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          className={`text-small font-medium ${error ? "text-danger" : "text-success"}`}
          role={error ? "alert" : undefined}
        >
          {message}
        </p>
      ) : null}
    </div>
  );
}
