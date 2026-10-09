import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

type LinkButtonProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
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
    "border-accent bg-accent text-accent-ink shadow-soft hover:border-accent-hover hover:bg-accent-hover",
  secondary:
    "border-border bg-card text-ink shadow-soft hover:border-border-strong hover:bg-card-muted",
  "secondary-inverse":
    "border-ink-inverse/30 bg-transparent text-ink-inverse hover:bg-ink-inverse/10",
  ghost: "border-transparent bg-transparent text-ink hover:bg-card-muted",
  danger: "border-danger bg-card text-danger hover:bg-card-muted",
  tertiary:
    "border-border bg-card text-ink shadow-soft hover:border-border-strong hover:bg-card-muted",
};

const sizes = {
  sm: "min-h-9 px-3",
  md: "min-h-11 px-5",
  lg: "min-h-[52px] px-6",
};

export function LinkButton({
  className = "",
  variant = "primary",
  size = "md",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`inline-flex max-w-full items-center justify-center gap-2 whitespace-nowrap rounded-sm border text-center text-small font-bold tracking-tight transition duration-150 ease-premium active:translate-y-px ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
