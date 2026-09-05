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
      className={`inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-bold transition duration-200 ease-premium ${
        active
          ? "border-ink bg-ink text-ink-inverse shadow-soft"
          : "border-border bg-card text-ink hover:border-border-strong hover:bg-card-muted"
      }`}
    >
      {label}
    </Link>
  );
}
