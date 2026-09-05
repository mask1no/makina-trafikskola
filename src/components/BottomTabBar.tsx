"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = { href: string; label: string; symbol: string };

export function BottomTabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 start-0 end-0 z-40 border-t border-border bg-card md:hidden">
      <ul className="grid grid-cols-5">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={
                pathname === tab.href ||
                (tab.href.split("/").length > 2 && pathname.startsWith(`${tab.href}/`))
                  ? "page"
                  : undefined
              }
              className="flex min-h-16 flex-col items-center justify-center gap-1 border-t-2 border-transparent px-1 text-center text-[11px] font-semibold text-ink aria-[current=page]:border-accent aria-[current=page]:bg-page"
            >
              <span aria-hidden="true" className="text-base">
                {tab.symbol}
              </span>
              <span>{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
