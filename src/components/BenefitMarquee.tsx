export type BenefitCard = {
  id: string;
  size: "sm" | "lg";
  title: string;
  body: string;
};

function BenefitIcon() {
  return (
    <span className="grid size-10 shrink-0 place-items-center rounded-md bg-accent-soft text-ink">
      <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M5 12.5 10 17l9-10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </span>
  );
}

function Cards({ items, hidden = false }: { items: BenefitCard[]; hidden?: boolean }) {
  return (
    <ul
      className={`m-0 flex list-none gap-3 p-0 pe-3 ${hidden ? "benefit-copy" : ""}`}
      {...(hidden ? { "aria-hidden": true, inert: true } : {})}
    >
      {items.map((item) => (
        <li
          key={`${hidden ? "copy-" : ""}${item.id}`}
          className={`flex shrink-0 items-start gap-3 rounded-md border border-border bg-card p-4 shadow-soft ${
            item.size === "lg" ? "w-[22rem] max-w-[85vw]" : "w-80 max-w-[85vw]"
          }`}
        >
          <BenefitIcon />
          <div className="min-w-0">
            <p className="text-balance font-extrabold leading-snug">{item.title}</p>
            <p className="mt-1 text-small leading-6 text-ink">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BenefitMarquee({
  label,
  items,
}: {
  label: string;
  items: BenefitCard[];
}) {
  if (!items.length) return null;

  return (
    <section aria-label={label} className="benefit-marquee-region relative">
      <div className="benefit-viewport">
        <div className="benefit-track">
          <Cards items={items} />
          <Cards items={items} hidden />
        </div>
      </div>
    </section>
  );
}
