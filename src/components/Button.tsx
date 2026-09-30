import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary";
};

const variants = {
  primary:
    "border border-accent bg-accent text-accent-ink shadow-soft hover:border-accent-hover hover:bg-accent-hover",
  secondary:
    "border border-border-strong bg-transparent text-current hover:bg-surface-raised",
  tertiary:
    "border border-border bg-card text-ink shadow-soft hover:border-border-strong hover:bg-card-muted",
};

export function Button({
  className = "",
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex min-h-11 max-w-full items-center justify-center gap-2 whitespace-normal break-words hyphens-auto rounded-sm px-5 py-2.5 text-center text-sm font-bold tracking-tight transition duration-200 ease-premium active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
