import Link from "next/link";

type PillFilterProps = {
  label: string;
  value: string;
  active: boolean;
  href: string;
};

export function PillFilter({
  label,
  value,
  active,
  href,
}: PillFilterProps) {
  return (
    <Link
      href={href}
      data-value={value}
      aria-current={active ? "true" : undefined}
      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition ${
        active
          ? "border-accent bg-accent text-accent-ink"
          : "border-border bg-card text-ink hover:border-accent"
      }`}
    >
      {label}
    </Link>
  );
}
