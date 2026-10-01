import { MarqueePause } from "@/components/MarqueePause";

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
      className={`benefit-row m-0 flex list-none gap-3 p-0 pe-3 ${hidden ? "benefit-copy" : ""}`}
      {...(hidden ? { "aria-hidden": true, inert: true } : {})}
    >
      {items.map((item) => (
        <li
          key={`${hidden ? "copy-" : ""}${item.id}`}
          className={`benefit-card flex h-[9.5rem] shrink-0 snap-start flex-col justify-between rounded-lg border border-border bg-card p-4 shadow-soft ${
            item.size === "lg" ? "w-[22rem] max-w-[85vw]" : "w-[16rem] max-w-[85vw]"
          }`}
        >
          <BenefitIcon />
          <div>
            <p className="font-black">{item.title}</p>
            <p className="mt-1 line-clamp-2 text-sm leading-5 text-ink-muted">{item.body}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BenefitMarquee({
  label,
  pauseLabel,
  playLabel,
  items,
  rows = 1,
}: {
  label: string;
  pauseLabel: string;
  playLabel: string;
  items: BenefitCard[];
  rows?: 1 | 2;
}) {
  if (!items.length) return null;

  return (
    <section aria-label={label} aria-roledescription="carousel" className="benefit-marquee-region relative" data-marquee="">
      <div className="site-container mb-3 flex justify-end">
        <MarqueePause pauseLabel={pauseLabel} playLabel={playLabel} />
      </div>
      <div className="benefit-viewport">
        <div className="benefit-track">
          <Cards items={items} />
          <Cards items={items} hidden />
        </div>
      </div>
      {rows === 2 ? (
        <div className="benefit-viewport mt-3 hidden md:block">
          <div className="benefit-track benefit-track-reverse">
            <Cards items={[...items].reverse()} />
            <Cards items={[...items].reverse()} hidden />
          </div>
        </div>
      ) : null}
    </section>
  );
}
