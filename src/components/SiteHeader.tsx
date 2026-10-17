import type { Role } from "@prisma/client";
import Link from "next/link";

import { signOut } from "@/auth";
import { Avatar } from "@/components/Avatar";
import { CallButton } from "@/components/ContactButtons";
import { HeaderMenu } from "@/components/HeaderMenu";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export type SiteHeaderNavItem = {
  href: string;
  label: string;
  current?: boolean;
};

export type SiteHeaderUser = {
  name?: string | null;
  email?: string | null;
  imageUrl?: string | null;
  role: Role;
};

export type SiteHeaderLabels = {
  account: string;
  adminPanel: string;
  balance: string;
  book: string;
  bookings: string;
  calendar: string;
  callUs: string;
  myPages: string;
  navigation: string;
  profile: string;
  reviews: string;
  signIn: string;
  signOut: string;
  students: string;
  teacherPortal: string;
  teacherOffice: string;
  closeMenu: string;
};

export function SiteLogo({
  compactOnMobile = false,
}: {
  compactOnMobile?: boolean;
}) {
  return (
    <span className="rtl-no-mirror inline-flex min-w-0 items-center gap-2.5">
      <svg
        aria-hidden="true"
        viewBox="0 0 36 36"
        className="size-9 shrink-0"
        fill="none"
      >
        <rect width="36" height="36" rx="10" fill="var(--accent)" />
        <path
          d="M8 25V11h4.2l5.8 7.2 5.8-7.2H28v14h-5v-7.1L18 24l-5-6.1V25H8Z"
          fill="var(--accent-ink)"
        />
      </svg>
      <span
        className={`${compactOnMobile ? "hidden truncate sm:inline" : "truncate"} text-base font-black tracking-[-0.035em] sm:text-lg`}
      >
        Makina{" "}
        <span
          className={`hidden font-semibold text-ink-inverse-muted ${
            compactOnMobile ? "sm:inline lg:hidden xl:inline" : "sm:inline"
          }`}
        >
          Trafikskola
        </span>
      </span>
    </span>
  );
}

export function SiteHeader({
  base,
  canBook,
  companyName,
  labels,
  navItems,
  mobileNavItems,
  phone,
  user,
}: {
  base: string;
  canBook: boolean;
  companyName: string;
  labels: SiteHeaderLabels;
  navItems: SiteHeaderNavItem[];
  mobileNavItems?: SiteHeaderNavItem[];
  phone: string;
  user: SiteHeaderUser | null;
}) {
  const phoneMenuItems = mobileNavItems ?? navItems;
  const inlineNavClass =
    "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm px-3 text-nav font-bold transition hover:bg-surface-raised aria-[current=page]:bg-surface-raised";
  const menuLinkClass =
    "flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted";

  return (
    <header
      data-site-header=""
      className="sticky top-0 z-40 bg-page py-2 text-ink-inverse sm:py-3"
    >
      <div className="site-container">
        <div className="grid min-h-14 min-w-0 grid-cols-[auto_1fr_auto] items-center gap-1.5 rounded-xl border border-ink bg-surface px-3 py-1.5 sm:gap-2 sm:px-5 lg:min-h-0 lg:grid-cols-12 lg:items-center lg:gap-6 lg:px-5 lg:py-3">
        <Link
          href={base}
          aria-label={companyName}
          className="inline-flex min-h-11 min-w-0 shrink items-center lg:col-span-3 lg:justify-self-start"
        >
          <span className="sr-only">{companyName}</span>
          <SiteLogo compactOnMobile />
        </Link>
        <nav
          className="hidden min-w-0 items-center justify-center gap-2 lg:col-span-6 lg:flex"
          aria-label={labels.navigation}
        >
          {navItems.map((item) => (
            <Link
              key={item.href}
              aria-current={item.current ? "page" : undefined}
              className={inlineNavClass}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="ms-auto flex shrink-0 items-center gap-1.5 sm:gap-2 lg:col-span-3 lg:ms-0 lg:w-full lg:justify-end lg:gap-2">
          <LanguageSwitcher authenticated={Boolean(user)} />
          {!user ? (
            <>
              <HeaderMenu
                className="shrink-0 lg:hidden"
                label={labels.navigation}
                closeLabel={labels.closeMenu}
                trigger={
                  <span className="flex size-11 items-center justify-center rounded-full border border-surface-soft text-ink-inverse">
                    <svg
                      aria-hidden="true"
                      viewBox="0 0 24 24"
                      className="size-5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.75"
                    >
                      <circle cx="12" cy="8" r="3.25" />
                      <path
                        d="M5.5 19.5c.8-3.2 3-4.75 6.5-4.75s5.7 1.55 6.5 4.75"
                        strokeLinecap="round"
                      />
                    </svg>
                  </span>
                }
              >
                <nav aria-label={labels.navigation} className="grid">
                  {phoneMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      className={menuLinkClass}
                      href={item.href}
                    >
                      {item.label}
                    </Link>
                  ))}
                </nav>
                <div className="my-1 border-t border-border" />
                <Link className={menuLinkClass} href={`${base}/logga-in`}>
                  {labels.signIn}
                </Link>
              </HeaderMenu>
              <Link
                href={`${base}/logga-in`}
                className="hidden min-h-11 shrink-0 items-center whitespace-nowrap px-2 text-nav font-bold underline-offset-4 hover:underline lg:inline-flex"
              >
                {labels.signIn}
              </Link>
            </>
          ) : (
            <HeaderMenu
              className="shrink-0"
              label={labels.account}
              closeLabel={labels.closeMenu}
              trigger={
                <span className="flex min-h-11 items-center rounded-full">
                  <Avatar
                    name={user.name ?? user.email ?? labels.account}
                    imageUrl={user.imageUrl}
                    size="sm"
                  />
                </span>
              }
            >
              <nav aria-label={labels.navigation} className="grid lg:hidden">
                {phoneMenuItems.map((item) => (
                  <Link key={item.href} className={menuLinkClass} href={item.href}>
                    {item.label}
                  </Link>
                ))}
                <div className="my-1 border-t border-border" />
              </nav>
              {user.role === "STUDENT" ? (
                <>
                  <Link className={menuLinkClass} href={`${base}/mina-sidor`}>
                    {labels.myPages}
                  </Link>
                  <Link
                    className={`${menuLinkClass} max-lg:hidden`}
                    href={`${base}/mina-sidor/bokningar`}
                  >
                    {labels.bookings}
                  </Link>
                  <Link
                    className={menuLinkClass}
                    href={`${base}/mina-sidor/lektioner`}
                  >
                    {labels.balance}
                  </Link>
                  <Link
                    className={menuLinkClass}
                    href={`${base}/mina-sidor/profil`}
                  >
                    {labels.profile}
                  </Link>
                </>
              ) : user.role === "TEACHER" ? (
                <>
                  <Link
                    className={`${menuLinkClass} max-lg:hidden`}
                    href={`${base}/larare-portal`}
                  >
                    {labels.teacherPortal}
                  </Link>
                  <Link
                    className={menuLinkClass}
                    href={`${base}/larare-portal?view=office`}
                  >
                    {labels.teacherOffice}
                  </Link>
                </>
              ) : (
                <>
                  <Link
                    className={`${menuLinkClass} max-lg:hidden`}
                    href={`${base}/admin`}
                  >
                    {labels.adminPanel}
                  </Link>
                  <Link
                    className={`${menuLinkClass} max-lg:hidden`}
                    href={`${base}/admin/calendar`}
                  >
                    {labels.calendar}
                  </Link>
                  <Link
                    className={`${menuLinkClass} max-lg:hidden`}
                    href={`${base}/admin/students`}
                  >
                    {labels.students}
                  </Link>
                  <Link
                    className={menuLinkClass}
                    href={`${base}/admin/recensioner`}
                  >
                    {labels.reviews}
                  </Link>
                </>
              )}
              <div className="my-1 border-t border-border" />
              <form
                action={async () => {
                  "use server";
                  await signOut({ redirectTo: base });
                }}
              >
                <button
                  type="submit"
                  className="flex min-h-11 w-full items-center rounded-sm px-3 text-start font-semibold text-danger hover:bg-card-muted"
                >
                  {labels.signOut}
                </button>
              </form>
            </HeaderMenu>
          )}
          {canBook ? (
            <Link
              href={`${base}/boka`}
              className="hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm border border-accent bg-accent px-4 text-nav font-extrabold text-accent-ink shadow-soft lg:inline-flex"
            >
              {labels.book}
            </Link>
          ) : (
            <CallButton
              phone={phone}
              className="hidden shrink-0 whitespace-nowrap lg:inline-flex"
            >
              <span className="xl:hidden">{labels.callUs}</span>
              <span className="hidden xl:inline">{labels.callUs}</span>
            </CallButton>
          )}
        </div>
        </div>
      </div>
    </header>
  );
}
