import type { TextareaHTMLAttributes } from "react";

type TextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  error?: string;
  hint?: string;
};

export function Textarea({
  id,
  label,
  error,
  hint,
  className = "",
  ...props
}: TextareaProps) {
  const textareaId = id ?? props.name;
  const describedBy =
    error && textareaId ? `${textareaId}-error` : hint && textareaId ? `${textareaId}-hint` : undefined;

  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor={textareaId}>
        <span>{label}</span>
        <textarea
          id={textareaId}
          className={`min-h-28 w-full resize-y rounded-sm border bg-card px-4 py-3 text-ink shadow-soft outline-none transition duration-200 ease-premium placeholder:text-ink-subtle hover:border-border-strong focus:border-ink ${
            error ? "border-danger" : "border-border"
          } ${className}`}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          {...props}
        />
      </label>
      {error ? (
        <p id={textareaId ? `${textareaId}-error` : undefined} className="text-sm font-medium text-danger" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={textareaId ? `${textareaId}-hint` : undefined} className="text-sm text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  );
}
