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
      className={`min-h-11 min-w-20 rounded-sm border px-3 py-2.5 text-sm font-bold transition duration-200 ease-premium active:translate-y-px ${
        selected
          ? "border-ink bg-ink text-ink-inverse shadow-soft"
          : "border-border bg-card hover:border-border-strong hover:bg-card-muted"
      } ${className}`}
      aria-pressed={selected}
      {...props}
    />
  );
}
