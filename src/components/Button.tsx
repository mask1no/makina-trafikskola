import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?:
    | "primary"
    | "secondary"
    | "secondary-inverse"
    | "ghost"
    | "danger"
    | "tertiary";
  size?: "sm" | "md" | "lg";
};

const variants = {
  primary:
    "border border-accent bg-accent text-accent-ink shadow-soft hover:border-accent-hover hover:bg-accent-hover",
  secondary:
    "border border-border bg-card text-ink shadow-soft hover:border-border-strong hover:bg-card-muted",
  "secondary-inverse":
    "border border-ink-inverse/30 bg-transparent text-ink-inverse hover:bg-ink-inverse/10",
  ghost: "border border-transparent bg-transparent text-ink hover:bg-card-muted",
  danger: "border border-danger bg-card text-danger hover:bg-card-muted",
  tertiary:
    "border border-border bg-card text-ink shadow-soft hover:border-border-strong hover:bg-card-muted",
};

const sizes = {
  sm: "min-h-9 px-3",
  md: "min-h-11 px-5",
  lg: "min-h-[52px] px-6",
};

export function Button({
  className = "",
  variant = "primary",
  size = "md",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={`inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-sm text-center text-small font-bold tracking-tight transition duration-150 ease-premium active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50 disabled:active:translate-y-0 ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
