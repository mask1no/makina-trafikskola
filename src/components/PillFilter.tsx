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
  const className = `inline-flex min-h-11 items-center border-b-2 px-1 py-2 text-sm font-bold transition duration-200 ease-premium ${
    active
      ? "border-ink text-ink"
      : disabled
        ? "cursor-not-allowed border-transparent text-ink-subtle"
        : "border-transparent text-ink-muted hover:border-border-strong hover:text-ink"
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
