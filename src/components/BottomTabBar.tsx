"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export type BottomTabIcon = "home" | "packages" | "bookings" | "messages" | "profile" | "call";

type Tab = { href: string; label: ReactNode; icon: BottomTabIcon };

function TabIcon({
  icon,
  prominent = false,
}: {
  icon: BottomTabIcon;
  prominent?: boolean;
}) {
  const paths = {
    home: <path d="m3.5 10.5 8.5-7 8.5 7M5.5 9v11h13V9M9.5 20v-6h5v6" />,
    packages: (
      <>
        <path d="M4 7.5h16v12H4zM3 7.5 6 3h12l3 4.5M12 3v16.5" />
        <path d="M9.5 7.5V10h5V7.5" />
      </>
    ),
    bookings: (
      <>
        <rect x="3.5" y="5.5" width="17" height="15" rx="2" />
        <path d="M7.5 3v5M16.5 3v5M3.5 10h17M8 15h3M13 15h3" />
      </>
    ),
    messages: (
      <>
        <path d="M4 4.5h16v12H9l-5 4v-16Z" />
        <path d="M8 9h8M8 12.5h5" />
      </>
    ),
    profile: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4.5 20c.7-4.2 3.2-6.3 7.5-6.3s6.8 2.1 7.5 6.3" />
      </>
    ),
    call: (
      <path d="M7 4.5h3l1.5 3.5-2 1.2a12 12 0 0 0 5.3 5.3l1.2-2 3.5 1.5v3A2 2 0 0 1 17.5 19 14.5 14.5 0 0 1 5 6.5 2 2 0 0 1 7 4.5Z" />
    ),
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className={prominent ? "size-7" : "size-5"}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.75"
    >
      {paths[icon]}
    </svg>
  );
}

function isCurrent(pathname: string, href: string) {
  return (
    pathname === href ||
    (href.split("/").length > 2 && pathname.startsWith(`${href}/`))
  );
}

function TabLink({
  tab,
  pathname,
  prominent = false,
}: {
  tab: Tab;
  pathname: string;
  prominent?: boolean;
}) {
  const className = `relative flex min-h-11 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-center text-micro font-bold leading-none text-ink-muted aria-[current=page]:text-ink ${
    prominent ? "mb-2 size-14 rounded-full bg-accent text-accent-ink" : ""
  }`;
  if (tab.href.startsWith("tel:")) {
    return (
      <a href={tab.href} className={className}>
        <TabIcon icon={tab.icon} prominent={prominent} />
        <span className="w-full truncate">{tab.label}</span>
      </a>
    );
  }

  return (
    <Link
      href={tab.href}
      aria-current={isCurrent(pathname, tab.href) ? "page" : undefined}
      className={className}
    >
      <TabIcon icon={tab.icon} prominent={prominent} />
      <span className="w-full truncate">{tab.label}</span>
    </Link>
  );
}

export function BottomTabBar({
  tabs,
  center,
}: {
  tabs: Tab[];
  center?: Tab;
}) {
  const pathname = usePathname();
  const leftCount = Math.ceil(tabs.length / 2);
  const left = tabs.slice(0, leftCount);
  const right = tabs.slice(leftCount);

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-40 border-t border-border bg-card pb-[var(--safe-bottom)] shadow-float md:hidden">
      <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-end">
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.max(left.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {left.map((tab) => (
            <li key={tab.href} className="min-w-0">
              <TabLink tab={tab} pathname={pathname} />
            </li>
          ))}
        </ul>
        <ul className="min-w-[4.75rem]">
          {center ? (
            <li className="min-w-0">
              <TabLink tab={center} pathname={pathname} prominent />
            </li>
          ) : null}
        </ul>
        <ul
          className="grid"
          style={{
            gridTemplateColumns: `repeat(${Math.max(right.length, 1)}, minmax(0, 1fr))`,
          }}
        >
          {right.map((tab) => (
            <li key={tab.href} className="min-w-0">
              <TabLink tab={tab} pathname={pathname} />
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
