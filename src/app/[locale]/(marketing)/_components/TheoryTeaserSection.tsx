import Image from "next/image";

import { LinkButton } from "@/components/LinkButton";
import type { Locale } from "@/i18n/routing";

export function TheoryTeaserSection({
  locale,
  eyebrow,
  title,
  description,
  features,
  tryFreeLabel,
  buyLabel,
  pendingLabel,
  oneTimeLabel,
  freeQuestions,
  salesOpen,
  freeMode,
  theoryProduct,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  description: string;
  features: { id: string; label: string }[];
  tryFreeLabel: string;
  buyLabel: string;
  pendingLabel: string;
  oneTimeLabel: string;
  freeQuestions: number;
  salesOpen: boolean;
  freeMode: boolean;
  theoryProduct?: { active: boolean; formattedPrice: string };
}) {
  return (
    <section className="section-shell overflow-hidden pt-12 md:pt-20">
      <div className="site-container">
        <div className="relative overflow-hidden rounded-lg border border-ink bg-surface text-ink-inverse shadow-float">
          <div className="relative grid lg:grid-cols-[1.1fr_.9fr]">
            <div className="p-7 sm:p-10 lg:p-14">
              <p className="text-micro font-bold uppercase tracking-wider text-accent">
                {eyebrow}
              </p>
              <h2 className="mt-3 max-w-xl text-3xl font-black sm:text-5xl">
                {title}
              </h2>
              <p className="mt-5 max-w-xl leading-7 text-ink-inverse-muted">
                {description}
              </p>
              <ul className="mt-6 grid gap-3">
                {features.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-center gap-3 text-small font-bold"
                  >
                    <span
                      aria-hidden="true"
                      className="grid size-6 shrink-0 place-items-center rounded-full bg-success text-ink-inverse"
                    >
                      <svg
                        viewBox="0 0 16 16"
                        className="size-3.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.25"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <path d="m3.5 8.5 3 3 6-7" />
                      </svg>
                    </span>
                    {item.label}
                  </li>
                ))}
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                {freeQuestions > 0 ? (
                  <LinkButton href={`/${locale}/teori`}>
                    {tryFreeLabel}
                  </LinkButton>
                ) : null}
                {salesOpen && theoryProduct?.active ? (
                  <LinkButton
                    variant="secondary-inverse"
                    href={`/${locale}/paket/korkortsteori`}
                  >
                    {buyLabel}
                  </LinkButton>
                ) : freeMode ? null : (
                  <span className="inline-flex min-h-11 items-center text-small font-bold text-ink-inverse-muted">
                    {pendingLabel}
                  </span>
                )}
              </div>
            </div>
            <div className="relative min-h-80 border-t border-ink-inverse/10 bg-surface-raised lg:border-s lg:border-t-0">
              <Image
                src="/illustration-theory.svg"
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="rtl-no-mirror object-contain p-8 sm:p-12"
              />
              {salesOpen && theoryProduct ? (
                <div className="absolute bottom-5 end-5 rounded-md bg-card p-4 text-ink shadow-card">
                  <p className="text-xs font-black uppercase tracking-wider text-ink-muted">
                    {oneTimeLabel}
                  </p>
                  <p className="numbers-ltr mt-1 text-2xl font-black">
                    {theoryProduct.formattedPrice}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
