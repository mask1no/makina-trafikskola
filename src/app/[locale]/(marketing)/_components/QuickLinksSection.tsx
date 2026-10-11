import Link from "next/link";

import { SectionHeader } from "@/components/SectionHeader";
import type { Locale } from "@/i18n/routing";

type QuickLink = {
  key: string;
  href: string;
  label: string;
};

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
              className="flex min-h-28 flex-col justify-between rounded-md border border-border bg-card p-4 font-extrabold shadow-soft transition hover:border-ink"
            >
              <span aria-hidden="true" className="size-3 rounded-full bg-accent" />
              <span>{link.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
