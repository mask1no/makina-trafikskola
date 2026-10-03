import { MarqueePause } from "@/components/MarqueePause";

export type BenefitCard = {
  id: string;
  size: "sm" | "lg";
  title: string;
  body: string;
};

const mobilePriority = ["language", "testLesson", "prices", "pickup", "local"];

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
          className={`flex h-[9.5rem] shrink-0 snap-start flex-col justify-between rounded-lg border border-border bg-card p-4 shadow-soft ${
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
}: {
  label: string;
  pauseLabel: string;
  playLabel: string;
  items: BenefitCard[];
}) {
  if (!items.length) return null;
  const prioritized = mobilePriority
    .map((id) => items.find((item) => item.id === id))
    .filter((item): item is BenefitCard => Boolean(item));
  const mobileItems = [
    ...prioritized,
    ...items.filter((item) => !prioritized.includes(item)),
  ].slice(0, 5);

  return (
    <section aria-label={label} aria-roledescription="carousel" className="benefit-marquee-region relative" data-marquee="">
      <div className="benefit-mobile overflow-x-auto snap-x snap-mandatory px-4 md:hidden">
        <Cards items={mobileItems} />
      </div>
      <div className="hidden md:block">
        <div className="site-container mb-3 flex justify-end">
          <MarqueePause pauseLabel={pauseLabel} playLabel={playLabel} />
        </div>
        <div className="benefit-viewport">
          <div className="benefit-track">
            <Cards items={items} />
            <Cards items={items} hidden />
          </div>
        </div>
      </div>
    </section>
  );
}
