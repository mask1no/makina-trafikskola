"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type BottomTabIcon = "home" | "packages" | "bookings" | "messages" | "profile";

type Tab = { href: string; label: string; icon: BottomTabIcon };

function TabIcon({ icon }: { icon: BottomTabIcon }) {
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
  };

  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="size-5"
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

export function BottomTabBar({ tabs }: { tabs: Tab[] }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 start-0 end-0 z-40 border-t border-border bg-card pb-[env(safe-area-inset-bottom)] shadow-float md:hidden">
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
              className="relative flex min-h-16 flex-col items-center justify-center gap-1 px-1 text-center text-[11px] font-bold text-ink-muted transition after:absolute after:top-0 after:h-0.5 after:w-8 after:rounded-full after:bg-transparent aria-[current=page]:bg-card-muted aria-[current=page]:text-ink aria-[current=page]:after:bg-accent"
            >
              <TabIcon icon={tab.icon} />
              <span>{tab.label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
