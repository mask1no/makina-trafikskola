"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState, type ReactNode } from "react";

import { BottomSheet } from "@/components/BottomSheet";
import { currentTabHref } from "@/lib/navigation/current-tab";
import { announcePopover, subscribePopover } from "@/lib/ui/popover";

export type MobileTabIcon =
  | "home"
  | "packages"
  | "bookings"
  | "messages"
  | "profile"
  | "call"
  | "more";

export type MobileTab = {
  href: string;
  label: ReactNode;
  icon: MobileTabIcon;
  exact?: boolean;
};

export type MobileTabMore = {
  label: string;
  title: string;
  items: { href: string; label: string }[];
};

function TabIcon({
  icon,
  prominent = false,
}: {
  icon: MobileTabIcon;
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
    more: (
      <>
        <path d="M4 7h16M4 12h16M4 17h16" />
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

function TabLink({
  tab,
  active,
  prominent = false,
}: {
  tab: MobileTab;
  active: boolean;
  prominent?: boolean;
}) {
  const className = prominent
    ? "relative flex h-16 w-full flex-col items-center justify-end pb-1 text-center text-micro font-bold leading-none text-ink-muted"
    : "relative flex h-16 min-w-11 flex-col items-center justify-center gap-0.5 px-1 text-center text-micro font-bold leading-none text-ink-muted aria-[current=page]:text-ink";
  if (tab.href.startsWith("tel:")) {
    return (
      <a href={tab.href} className={className}>
        {prominent ? (
          <span className="absolute -top-3 grid size-[52px] place-items-center rounded-full bg-accent text-accent-ink shadow-soft">
            <TabIcon icon={tab.icon} prominent />
          </span>
        ) : (
          <TabIcon icon={tab.icon} />
        )}
        <span className="w-full max-w-full px-0.5 text-balance [overflow-wrap:anywhere]">{tab.label}</span>
      </a>
    );
  }

  return (
    <Link
      href={tab.href}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {prominent ? (
        <span className="absolute -top-3 grid size-[52px] place-items-center rounded-full bg-accent text-accent-ink shadow-soft">
          <TabIcon icon={tab.icon} prominent />
        </span>
      ) : (
        <TabIcon icon={tab.icon} />
      )}
      <span className="w-full max-w-full px-0.5 text-balance [overflow-wrap:anywhere]">{tab.label}</span>
    </Link>
  );
}

function MoreTab({ more }: { more: MobileTabMore }) {
  const [open, setOpen] = useState(false);

  useEffect(() => subscribePopover("admin-more", () => setOpen(false)), []);

  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => {
          if (open) {
            setOpen(false);
            return;
          }
          announcePopover("admin-more");
          setOpen(true);
        }}
        className="relative flex h-16 min-w-11 w-full flex-col items-center justify-center gap-0.5 px-1 text-center text-micro font-bold leading-none text-ink-muted aria-expanded:text-ink"
      >
        <TabIcon icon="more" />
        <span className="w-full max-w-full px-0.5 text-balance [overflow-wrap:anywhere]">
          {more.label}
        </span>
      </button>
      {open ? (
        <BottomSheet title={more.title} onClose={() => setOpen(false)}>
          <nav className="grid">
            {more.items.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className="flex min-h-11 items-center rounded-sm px-3 text-sm font-bold hover:bg-card-muted"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </BottomSheet>
      ) : null}
    </>
  );
}

export function MobileTabBar({
  tabs,
  center,
  more,
}: {
  tabs: MobileTab[];
  center?: MobileTab;
  more?: MobileTabMore;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeHref = currentTabHref(
    pathname,
    searchParams.toString(),
    [...tabs, ...(center ? [center] : [])],
  );
  const leftCount = Math.ceil(tabs.length / 2);
  const left = tabs.slice(0, leftCount);
  const right = tabs.slice(leftCount);
  const count = tabs.length + (center ? 1 : 0) + (more ? 1 : 0);
  const columns =
    count >= 5 ? "grid-cols-5" : count === 4 ? "grid-cols-4" : "grid-cols-3";

  return (
    <nav className="fixed bottom-0 start-0 end-0 z-40 border-t border-[var(--line)] bg-card pb-[var(--safe-bottom)] shadow-soft lg:hidden">
      <ul className={`grid ${columns}`}>
        {left.map((tab) => (
          <li key={tab.href} className="min-w-0">
            <TabLink tab={tab} active={tab.href === activeHref} />
          </li>
        ))}
        {center ? (
          <li className="min-w-0">
            <TabLink tab={center} active={center.href === activeHref} prominent />
          </li>
        ) : null}
        {right.map((tab) => (
          <li key={tab.href} className="min-w-0">
            <TabLink tab={tab} active={tab.href === activeHref} />
          </li>
        ))}
        {more ? (
          <li className="min-w-0">
            <MoreTab more={more} />
          </li>
        ) : null}
      </ul>
    </nav>
  );
}
