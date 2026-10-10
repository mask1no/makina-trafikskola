export function MapEmbed({
  address,
  title,
  privacy,
}: {
  address: string;
  title: string;
  privacy: string;
}) {
  return (
    <div className="overflow-hidden rounded-lg border border-border bg-page">
      <iframe
        title={title}
        src={`https://www.google.com/maps?q=${encodeURIComponent(address)}&output=embed`}
        className="h-80 w-full border-0 sm:h-[28rem]"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
      />
      <p className="px-4 py-3 text-small leading-6 text-ink-muted">{privacy}</p>
    </div>
  );
}
