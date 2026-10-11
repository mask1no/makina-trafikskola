import Link from "next/link";

import { SectionHeader } from "@/components/SectionHeader";
import type { Locale } from "@/i18n/routing";

type QuickLink = {
  key: "lessons" | "courses" | "teachers" | "contact";
  href: string;
  label: string;
};

function QuickIcon({ kind }: { kind: QuickLink["key"] }) {
  const paths = {
    lessons: <path d="M4 17h16M6 17l1.5-7h9L18 17M9 10V7h6v3M8 20h.01M16 20h.01" />,
    courses: <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4Zm3 13h11M9 8h6M9 11h4" />,
    teachers: <path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8c.7-4 3-6 7-6s6.3 2 7 6" />,
    contact: <path d="M7 4.5h3L11.5 8l-2 1.2a12 12 0 0 0 5.3 5.3l1.2-2 3.5 1.5v3a2 2 0 0 1-2 2A14.5 14.5 0 0 1 5 6.5a2 2 0 0 1 2-2Z" />,
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
          {links.map((link) => {
            const tone =
              link.key === "lessons"
                ? "border-surface bg-surface text-ink-inverse"
                : link.key === "courses"
                  ? "border-accent bg-accent text-accent-ink"
                  : "border-border bg-card text-ink";
            return (
              <Link
                key={link.key}
                href={`/${locale}/${link.href}`}
                className={`group flex min-h-32 flex-col justify-between rounded-md border p-4 font-extrabold shadow-soft transition duration-200 hover:-translate-y-0.5 hover:shadow-card ${tone}`}
              >
                <span
                  className={`grid size-11 place-items-center rounded-sm ${
                    link.key === "lessons"
                      ? "bg-surface-raised text-accent"
                      : link.key === "courses"
                        ? "bg-accent-ink text-ink-inverse"
                        : "bg-accent-soft text-ink"
                  }`}
                >
                  <QuickIcon kind={link.key} />
                </span>
                <span className="flex items-end justify-between gap-2">
                  <span>{link.label}</span>
                  <span aria-hidden="true" className="rtl-directional text-lg transition group-hover:translate-x-0.5">
                    →
                  </span>
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
