import Link, { type LinkProps } from "next/link";
import type { AnchorHTMLAttributes } from "react";

type LinkButtonProps = LinkProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "href"> & {
    variant?: "primary" | "secondary" | "tertiary";
  };

const variants = {
  primary:
    "border-accent bg-accent text-accent-ink shadow-soft hover:border-accent-hover hover:bg-accent-hover",
  secondary:
    "border-border-strong bg-transparent text-current hover:bg-surface-raised",
  tertiary:
    "border-border bg-card text-ink shadow-soft hover:border-border-strong hover:bg-card-muted",
};

export function LinkButton({
  className = "",
  variant = "primary",
  ...props
}: LinkButtonProps) {
  return (
    <Link
      className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-sm border px-5 py-2.5 text-sm font-bold tracking-tight transition duration-200 ease-premium active:translate-y-px ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
