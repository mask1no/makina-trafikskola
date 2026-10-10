import Link from "next/link";

type LocationSummary = {
  slug: string;
  name: string;
  city: string;
  teachers: number;
  bookings: number;
};

export function LocationCards({
  locale,
  locations,
  teachersLabel,
  bookingsLabel,
  detailsLabel,
}: {
  locale: string;
  locations: LocationSummary[];
  teachersLabel: (count: number) => string;
  bookingsLabel: (count: number) => string;
  detailsLabel: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {locations.map((location) => (
        <article key={location.slug} className="flex h-full flex-col rounded-md border border-border bg-card p-4 shadow-soft">
          <h3 className="text-lg font-black">{location.name}</h3>
          <p className="mt-1 text-sm text-ink-muted">{location.city}</p>
          <p className="mt-4 text-sm font-bold">{teachersLabel(location.teachers)}</p>
          <p className="mt-1 text-sm font-bold">{bookingsLabel(location.bookings)}</p>
          <Link
            href={`/${locale}/admin/platser/${location.slug}`}
            className="mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
          >
            {detailsLabel}
          </Link>
        </article>
      ))}
    </div>
  );
}
