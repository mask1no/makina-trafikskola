import type { HTMLAttributes } from "react";

type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: "neutral" | "accent" | "success" | "danger";
};

const tones = {
  neutral: "border-border bg-card-muted text-ink",
  accent: "border-accent bg-accent text-accent-ink",
  success: "border-success bg-success-soft text-success",
  danger: "border-danger bg-danger-soft text-danger",
};

export function Badge({
  className = "",
  tone = "neutral",
  ...props
}: BadgeProps) {
  return (
    <span
      className={`inline-flex min-h-6 items-center rounded-full border px-2.5 py-0.5 text-xs font-bold leading-5 ${tones[tone]} ${className}`}
      {...props}
    />
  );
}
