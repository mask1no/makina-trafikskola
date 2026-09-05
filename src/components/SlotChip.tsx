import type { ButtonHTMLAttributes } from "react";

type SlotChipProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  selected?: boolean;
};

export function SlotChip({
  selected = false,
  className = "",
  type = "button",
  ...props
}: SlotChipProps) {
  return (
    <button
      type={type}
      className={`min-h-11 min-w-20 rounded-sm border px-3 font-semibold transition ${
        selected
          ? "border-accent bg-accent text-accent-ink"
          : "border-border bg-card hover:border-accent"
      } ${className}`}
      aria-pressed={selected}
      {...props}
    />
  );
}
