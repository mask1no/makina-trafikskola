import Link from "next/link";

import { SectionHeader } from "@/components/SectionHeader";
import type { Locale } from "@/i18n/routing";

type QuickLink = {
  key: "theory" | "lessons" | "courses";
  href: string;
  label: string;
};

function QuickIcon({ kind }: { kind: QuickLink["key"] }) {
  const paths = {
    theory: (
      <>
        <path d="M6 4.5h12v15H6z" />
        <path d="M9 8h6M9 12h6M9 16h3" />
      </>
    ),
    lessons: (
      <>
        <circle cx="12" cy="12" r="7.5" />
        <circle cx="12" cy="12" r="2.25" />
        <path d="M12 4.5v2.25M12 17.25V19.5M4.5 12h2.25M17.25 12H19.5" />
      </>
    ),
    courses: (
      <>
        <path d="M5 7.5h14v11H5z" />
        <path d="M8 7.5V5.75h8V7.5M8 12h8M8 15.5h5" />
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
    <section className="section-shell border-t border-[var(--line)]">
      <div className="site-container">
        <SectionHeader eyebrow={eyebrow} title={title} />
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
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
