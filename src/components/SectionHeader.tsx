export function SectionHeader({
  eyebrow,
  title,
  intro,
  as = "h2",
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  as?: "h1" | "h2";
}) {
  const Title = as;
  return (
    <header className="max-w-[70ch]">
      {eyebrow ? (
        <p className="text-micro font-bold uppercase tracking-[0.14em] text-ink-muted">{eyebrow}</p>
      ) : null}
      <Title className="section-title mt-3">{title}</Title>
      {intro ? <p className="mt-4 max-w-[70ch] text-body leading-7 text-ink-muted">{intro}</p> : null}
    </header>
  );
}
