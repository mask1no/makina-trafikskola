"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavPill = {
  href: string;
  label: string;
  active?: boolean;
  matches?: string[];
  hideBelowLg?: boolean;
};

export function NavPills({
  items,
  label,
  centered = false,
}: {
  items: NavPill[];
  label: string;
  centered?: boolean;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="max-w-full">
      <ul className={`-mx-1 flex max-w-full gap-1 overflow-x-auto overscroll-x-contain rounded-md border border-border bg-card-muted p-1 [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden ${centered ? "md:justify-center" : ""}`}>
        {items.map((item) => {
          const prefixes = item.matches ?? [item.href];
          const current =
            item.active ??
            prefixes.some(
              (href) =>
                pathname === href ||
                (href.split("/").length > 3 && pathname.startsWith(`${href}/`)),
            );
          return (
          <li key={item.href} className={`shrink-0 ${item.hideBelowLg ? "max-lg:hidden" : ""}`}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className={`inline-flex items-center rounded-sm font-bold text-ink-muted transition hover:text-ink aria-[current=page]:bg-card aria-[current=page]:text-ink aria-[current=page]:shadow-soft ${centered ? "min-h-12 px-5 text-base" : "min-h-11 px-4 text-sm"}`}
            >
              {item.label}
            </Link>
          </li>
          );
        })}
      </ul>
    </nav>
  );
}
