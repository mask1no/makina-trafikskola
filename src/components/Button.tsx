import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "tertiary";
};

const variants = {
  primary: "bg-accent text-accent-ink hover:bg-accent-hover",
  secondary:
    "border border-card/40 bg-transparent text-ink-inverse hover:bg-card/10",
  tertiary: "border border-border bg-card text-ink hover:bg-page",
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
      className={`inline-flex min-h-11 items-center justify-center rounded-sm px-5 py-2.5 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${variants[variant]} ${className}`}
      {...props}
    />
  );
}
