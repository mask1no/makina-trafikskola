import Link from "next/link";

type PillFilterProps = {
  label: string;
  value: string;
  active: boolean;
  href: string;
  disabled?: boolean;
  title?: string;
};

export function PillFilter({
  label,
  value,
  active,
  href,
  disabled = false,
  title,
}: PillFilterProps) {
  const className = `inline-flex min-h-11 items-center rounded-full border px-4 py-2 text-sm font-bold transition duration-200 ease-premium ${
    active
      ? "border-ink bg-ink text-ink-inverse shadow-soft"
      : disabled
        ? "cursor-not-allowed border-border bg-card-muted text-ink-subtle"
        : "border-border bg-card text-ink hover:border-border-strong hover:bg-card-muted"
  }`;

  if (disabled) {
    return (
      <span
        data-value={value}
        aria-disabled="true"
        title={title}
        className={className}
      >
        {label}
      </span>
    );
  }

  return (
    <Link
      href={href}
      data-value={value}
      title={title}
      aria-current={active ? "true" : undefined}
      className={className}
    >
      {label}
    </Link>
  );
}
