import Link from "next/link";

import { SectionHeader } from "@/components/SectionHeader";
import type { Locale } from "@/i18n/routing";

type QuickLink = {
  key: "lessons" | "courses" | "theory" | "prices";
  href: string;
  label: string;
};

function QuickIcon({ kind }: { kind: QuickLink["key"] }) {
  const paths = {
    lessons: <path d="M4 17h16M6 17l1.5-7h9L18 17M9 10V7h6v3M8 20h.01M16 20h.01" />,
    courses: <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm3 13h11M9 8h6M9 11h4" />,
    theory: (
      <>
        <path d="M6 4.5h12v15H6z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    prices: (
      <>
        <circle cx="12" cy="12" r="8" />
        <path d="M12 8v8M9.5 10.5c.6-1 1.5-1.5 2.5-1.5s2 .6 2 1.75-1 1.5-2.5 1.75-2.5.7-2.5 1.85 1.1 1.65 2.5 1.65 1.9-.5 2.5-1.4" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-6"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      {paths[kind]}
    </svg>
  );
}

export function QuickLinksSection({
  locale,
  eyebrow,
  title,
  links,
}: {
  locale: Locale;
  eyebrow: string;
  title: string;
  links: QuickLink[];
}) {
  return (
    <section className="section-shell">
      <div className="site-container">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <div className="mt-8 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {links.map((link) => (
            <Link
              key={link.key}
              href={`/${locale}/${link.href}`}
              className="group flex min-h-32 flex-col justify-between rounded-md border border-border bg-card p-4 font-extrabold text-ink shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-card"
            >
              <span className="grid size-11 place-items-center rounded-sm bg-accent-soft text-ink">
                <QuickIcon kind={link.key} />
              </span>
              <span className="flex items-end justify-between gap-2">
                <span>{link.label}</span>
                <span
                  aria-hidden="true"
                  className="rtl-directional text-lg transition-[margin] group-hover:ms-1"
                >
                  →
                </span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
