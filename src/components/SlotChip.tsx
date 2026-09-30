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
      className={`min-h-11 min-w-0 w-full break-words hyphens-auto rounded-sm border px-2 py-2.5 text-center text-sm font-bold transition duration-200 ease-premium active:translate-y-px ${
        selected
          ? "border-ink bg-ink text-ink-inverse shadow-soft"
          : "border-border bg-card hover:border-border-strong hover:bg-card-muted"
      } ${className}`}
      aria-pressed={selected}
      {...props}
    />
  );
}
