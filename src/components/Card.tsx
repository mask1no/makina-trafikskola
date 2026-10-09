import type { HTMLAttributes } from "react";

type CardProps = HTMLAttributes<HTMLDivElement> & {
  padding?: "none" | "sm" | "md" | "lg";
  elevated?: boolean;
};

const paddings = {
  none: "",
  sm: "p-4",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
};

export function Card({
  className = "",
  padding = "md",
  elevated = false,
  ...props
}: CardProps) {
  return (
    <div
      className={`rounded-md border border-[var(--line)] bg-card transition duration-150 hover:border-[var(--line-hover)] ${paddings[padding]} ${
        elevated ? "shadow-card" : "shadow-soft"
      } ${className}`}
      {...props}
    />
  );
}
