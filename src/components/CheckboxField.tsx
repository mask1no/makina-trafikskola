import type { InputHTMLAttributes } from "react";

type CheckboxFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  description?: string;
  error?: string;
};

export function CheckboxField({
  label,
  description,
  error,
  className = "",
  id,
  name,
  ...props
}: CheckboxFieldProps) {
  const inputId = id ?? name;

  return (
    <div>
      <label
        className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-sm border bg-card p-3.5 transition hover:border-border-strong ${
          error ? "border-danger" : "border-border"
        } ${className}`}
        htmlFor={inputId}
      >
        <input
          {...props}
          id={inputId}
          name={name}
          type="checkbox"
          aria-invalid={Boolean(error)}
          aria-describedby={error && inputId ? `${inputId}-error` : undefined}
          className="mt-0.5 size-5 shrink-0 accent-accent"
        />
        <span className="grid gap-1">
          <span className="text-sm font-bold text-ink">{label}</span>
          {description ? (
            <span className="text-sm leading-5 text-ink-muted">{description}</span>
          ) : null}
        </span>
      </label>
      {error ? (
        <p
          id={inputId ? `${inputId}-error` : undefined}
          className="mt-2 text-sm font-medium text-danger"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
