"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavPill = {
  href: string;
  label: string;
  active?: boolean;
};

export function NavPills({
  items,
  label,
}: {
  items: NavPill[];
  label: string;
}) {
  const pathname = usePathname();

  return (
    <nav aria-label={label} className="overflow-x-auto">
      <ul className="flex min-w-max gap-1 rounded-md border border-border bg-card-muted p-1">
        {items.map((item) => {
          const current =
            item.active ??
            (pathname === item.href ||
              (item.href.split("/").length > 3 &&
                pathname.startsWith(`${item.href}/`)));
          return (
          <li key={item.href}>
            <Link
              href={item.href}
              aria-current={current ? "page" : undefined}
              className="inline-flex min-h-11 items-center rounded-sm px-4 text-sm font-bold text-ink-muted transition hover:text-ink aria-[current=page]:bg-card aria-[current=page]:text-ink aria-[current=page]:shadow-soft"
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
