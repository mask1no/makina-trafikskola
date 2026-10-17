export function GoogleReviewsCard({
  title,
  body,
  cta,
  url,
  rating,
  countLabel,
}: {
  title: string;
  body: string;
  cta: string;
  url: string;
  rating: string | null;
  countLabel: string | null;
}) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-soft"
    >
      <span>
        <span className="block font-black">{title}</span>
        <span className="text-small text-ink-muted">
          {rating && countLabel ? `${rating} · ${countLabel}` : body}
        </span>
      </span>
      <span className="text-small font-bold">{cta}</span>
    </a>
  );
}
