import Link from "next/link";

export function MapFallback({
  title,
  description,
  href,
  linkLabel,
}: {
  title: string;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="rtl-no-mirror grid min-h-[30rem] place-items-center overflow-hidden rounded-lg border border-border bg-page p-6">
      <div className="max-w-sm text-center">
        <svg aria-hidden="true" viewBox="0 0 24 24" className="mx-auto size-12 text-ink-subtle" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </svg>
        <h2 className="mt-4 text-lg font-black">{title}</h2>
        {description ? <p className="mt-2 text-sm leading-6 text-ink-muted">{description}</p> : null}
        {href && linkLabel ? (
          <Link href={href} className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm border border-border-strong bg-card px-4 font-bold text-ink shadow-soft">
            {linkLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );
}
