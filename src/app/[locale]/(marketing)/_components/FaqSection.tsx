import { SectionHeader } from "@/components/SectionHeader";

export type FaqItem = {
  question: string;
  answer: string;
  content?: string;
};

export function FaqSection({
  eyebrow,
  title,
  items,
}: {
  eyebrow: string;
  title: string;
  items: FaqItem[];
}) {
  return (
    <section className="section-shell border-t border-[var(--line)]">
      <div className="site-container grid gap-8 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:items-start">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {items.map((item) => (
            <details key={item.question} className="group">
              <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-6 py-4 font-bold marker:hidden [&::-webkit-details-marker]:hidden">
                <span>{item.question}</span>
                <span aria-hidden="true" className="text-xl transition group-open:rotate-45">+</span>
              </summary>
              <p className="max-w-3xl pb-6 leading-7 text-ink-muted">
                {item.content ?? item.answer}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
