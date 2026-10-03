import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { auth, signOut } from "@/auth";
import { Avatar } from "@/components/Avatar";
import { BottomTabBar, type BottomTabIcon } from "@/components/BottomTabBar";
import { CloseDetailsOnNavigate } from "@/components/CloseDetailsOnNavigate";
import { CookieConsent } from "@/components/CookieConsent";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { isLocale, locales } from "@/i18n/routing";
import { openingHoursSpecification } from "@/lib/company/opening-hours";
import {
  formatLanguageList,
  offeredTeachingLanguages,
} from "@/lib/company/staff";
import { displayPhone, telHref } from "@/lib/format/phone";
import { db } from "@/lib/db";
import {
  bookingEnabled,
  instructorsEnabled,
} from "@/lib/launch";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function Logo({ compactOnMobile = false }: { compactOnMobile?: boolean }) {
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
      <span className={`${compactOnMobile ? "hidden truncate sm:inline" : "truncate"} text-base font-black tracking-[-0.035em] sm:text-lg`}>
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

function validSiteOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    return url.protocol === "https:" || url.protocol === "http:" ? url.origin : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({
    locale: params.locale,
    namespace: "metadata",
  });
  const pathname =
    (await headers()).get("x-makina-pathname") ?? `/${params.locale}`;
  const suffix = pathname.replace(/^\/(?:sv|en|ti|ar|so)/, "") || "/";
  const siteOrigin = validSiteOrigin();
  const localizedPath = (locale: string) =>
    `/${locale}${suffix === "/" ? "" : suffix}`;
  const canonical = siteOrigin
    ? `${siteOrigin}${localizedPath(params.locale)}`
    : localizedPath(params.locale);
  const languages = Object.fromEntries(
    locales.map((locale) => [
      locale,
      siteOrigin ? `${siteOrigin}${localizedPath(locale)}` : localizedPath(locale),
    ]),
  );
  return {
    ...(siteOrigin ? { metadataBase: new URL(siteOrigin) } : {}),
    title: {
      default: t("title"),
      template: `%s · ${t("brand")}`,
    },
    description: t("description"),
    alternates: {
      canonical,
      languages: {
        ...languages,
        "x-default": siteOrigin
          ? `${siteOrigin}${localizedPath("sv")}`
          : localizedPath("sv"),
      },
    },
    openGraph: {
      type: "website",
      siteName: t("brand"),
      title: t("title"),
      description: t("description"),
      url: canonical,
      locale: params.locale,
      alternateLocale: locales.filter((locale) => locale !== params.locale),
      images: [{ url: "/hero.jpg", alt: t("brand") }],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: ["/hero.jpg"],
    },
    manifest: "/manifest.webmanifest",
  };
}

export default async function LocaleLayout(
  props: {
    children: React.ReactNode;
    params: Promise<{ locale: string }>;
  }
) {
  const params = await props.params;

  const {
    children
  } = props;

  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const [t, adminT, teacherT, company, languageNames, session] = await Promise.all([
    getTranslations("shell"),
    getTranslations("admin.nav"),
    getTranslations("teacherPortal"),
    getTranslations("company"),
    getTranslations("language"),
    auth(),
  ]);
  const offeredLanguages = offeredTeachingLanguages();
  const offeredLanguageNames = formatLanguageList(
    offeredLanguages,
    params.locale,
    (code) => languageNames(code),
  );
  const pathname = (await headers()).get("x-makina-pathname") ?? "";
  if (session?.user.id && !pathname.includes("/verifiera-mobil")) {
    const account = await db.user.findUnique({
      where: { id: session.user.id },
      select: { googleSub: true, phoneVerifiedAt: true, deletedAt: true },
    });
    if (account?.googleSub && !account.phoneVerifiedAt && !account.deletedAt) {
      redirect(`/${params.locale}/verifiera-mobil`);
    }
  }
  const base = `/${params.locale}`;
  const currentPage = (href: string) =>
    pathname === href ||
    (href !== base && pathname.startsWith(`${href}/`))
      ? "page"
      : undefined;
  const canBook = bookingEnabled();
  const showInstructors = instructorsEnabled();
  const navItems = [
    { href: base, label: t("home") },
    { href: `${base}/korlektioner`, label: t("lessons") },
    ...(showInstructors
      ? [{ href: `${base}/larare`, label: t("teachers") }]
      : []),
    { href: `${base}/teori`, label: t("theory") },
    { href: `${base}/kontakt`, label: t("contact") },
  ];
  const inlineNavClass =
    "inline-flex min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm px-1.5 text-[13px] font-bold transition hover:bg-surface-raised aria-[current=page]:bg-surface-raised xl:px-3 xl:text-sm";
  const menuLinkClass =
    "flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted";
  const menuPanelClass =
    "absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-56 max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card p-2 text-sm text-ink shadow-float";
  const teacherProfile =
    session?.user.role === "TEACHER"
      ? await db.teacherProfile.findUnique({
          where: { userId: session.user.id },
          select: { slug: true },
        })
      : null;
  const siteUrl = validSiteOrigin();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: company("legalName"),
    taxID: company("orgnr"),
    telephone: company("phone"),
    email: company("email"),
    address: {
      "@type": "PostalAddress",
      streetAddress: company("visitingAddress"),
      addressCountry: "SE",
    },
    areaServed: { "@type": "City", name: "Stockholm" },
    availableLanguage: offeredLanguages,
    openingHoursSpecification: openingHoursSpecification(),
    ...(siteUrl ? { url: `${siteUrl}/${params.locale}` } : {}),
  };
  const callLabel = t.rich("callName", {
    phone: () => (
      <bdi dir="ltr" className="numbers-ltr">
        {displayPhone(company("phone"))}
      </bdi>
    ),
  });

  const centerTab = {
    href: canBook ? `${base}/boka` : telHref(company("phone")),
    label: canBook ? t("book") : callLabel,
    icon: canBook ? "bookings" : "call",
  } as const;
  const tabs = (
    session?.user.role === "ADMIN"
      ? [
          { href: `${base}/admin`, label: t("admin"), icon: "profile" },
          { href: `${base}/admin/calendar`, label: t("calendar"), icon: "bookings" },
          { href: base, label: t("home"), icon: "home" },
          { href: `${base}/admin/students`, label: t("students"), icon: "messages" },
        ]
      : session?.user.role === "TEACHER"
        ? [
            { href: `${base}/larare-portal`, label: teacherT("eyebrow"), icon: "bookings" },
            { href: base, label: t("home"), icon: "home" },
            { href: `${base}/korlektioner`, label: t("lessons"), icon: "packages" },
            { href: `${base}/teori`, label: t("theory"), icon: "messages" },
          ]
        : [
            { href: base, label: t("home"), icon: "home" },
            { href: `${base}/korlektioner`, label: t("packages"), icon: "packages" },
            { href: `${base}/teori`, label: t("theory"), icon: "messages" },
            {
              href: session?.user ? `${base}/mina-sidor` : `${base}/logga-in`,
              label: session?.user ? t("myPages") : t("signIn"),
              icon: "profile",
            },
          ]
  ) satisfies { href: string; label: string; icon: BottomTabIcon }[];

  return (
    <NextIntlClientProvider>
      <div className="min-h-screen bg-page pb-[calc(var(--tab-bar-height)+var(--safe-bottom))] md:pb-0">
        <a
          href="#main"
          className="fixed start-4 top-0 z-[100] -translate-y-full rounded-b-sm bg-accent px-4 py-3 font-bold text-accent-ink transition-transform focus:translate-y-0"
        >
          {t("skipToContent")}
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <header className="sticky top-0 z-40 border-b border-surface-soft bg-surface text-ink-inverse shadow-soft">
          <div className="site-container flex min-h-[var(--header-height)] min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2 lg:min-h-[var(--header-height-lg)]">
            <Link href={base} className="inline-flex min-h-11 min-w-0 shrink items-center">
              <Logo compactOnMobile />
            </Link>
            <nav className="hidden min-w-0 items-center gap-0.5 lg:flex xl:gap-1" aria-label={t("navigation")}>
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  aria-current={currentPage(item.href)}
                  className={inlineNavClass}
                  href={item.href}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="ms-auto shrink-0 lg:ms-2">
              <LanguageSwitcher />
            </div>
            {!session?.user ? (
              <>
                <details data-header-menu className="relative shrink-0 lg:hidden">
                  <summary
                    aria-label={t("account")}
                    className="flex size-11 cursor-pointer list-none items-center justify-center rounded-full border border-surface-soft text-ink-inverse outline-none ring-offset-surface focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
                  >
                    <svg aria-hidden="true" viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.75">
                      <circle cx="12" cy="8" r="3.25" />
                      <path d="M5.5 19.5c.8-3.2 3-4.75 6.5-4.75s5.7 1.55 6.5 4.75" strokeLinecap="round" />
                    </svg>
                  </summary>
                  <div className={menuPanelClass}>
                    <nav aria-label={t("navigation")} className="grid">
                      {navItems.map((item) => (
                        <Link key={item.href} className={menuLinkClass} href={item.href}>
                          {item.label}
                        </Link>
                      ))}
                    </nav>
                    <div className="my-1 border-t border-border" />
                    <Link className={menuLinkClass} href={`${base}/logga-in`}>
                      {t("signIn")}
                    </Link>
                  </div>
                </details>
                <Link
                  href={`${base}/logga-in`}
                  className="hidden min-h-11 shrink-0 items-center whitespace-nowrap px-2 text-sm font-bold underline-offset-4 hover:underline lg:inline-flex"
                >
                  {t("signIn")}
                </Link>
              </>
            ) : (
              <details data-header-menu className="group relative shrink-0">
                <summary
                  aria-label={t("account")}
                  className="flex min-h-11 cursor-pointer list-none items-center rounded-full outline-none ring-offset-surface focus-visible:ring-2 focus-visible:ring-accent [&::-webkit-details-marker]:hidden"
                >
                  <Avatar
                    name={
                      session.user.name ??
                      session.user.email ??
                      t("account")
                    }
                    size="sm"
                  />
                </summary>
                <div className={menuPanelClass}>
                  <nav aria-label={t("navigation")} className="grid lg:hidden">
                    {navItems.map((item) => (
                      <Link key={item.href} className={menuLinkClass} href={item.href}>
                        {item.label}
                      </Link>
                    ))}
                    <div className="my-1 border-t border-border" />
                  </nav>
                  {session.user.role === "STUDENT" ? (
                    <>
                      <Link className={menuLinkClass} href={`${base}/mina-sidor`}>{t("myPages")}</Link>
                      <Link className={menuLinkClass} href={`${base}/mina-sidor/bokningar`}>{t("bookings")}</Link>
                      <Link className={menuLinkClass} href={`${base}/mina-sidor/lektioner`}>{t("balance")}</Link>
                      <Link className={menuLinkClass} href={`${base}/mina-sidor/profil`}>{t("profile")}</Link>
                    </>
                  ) : session.user.role === "TEACHER" ? (
                    <>
                      <Link className={menuLinkClass} href={`${base}/larare-portal`}>{t("teacherPortal")}</Link>
                      <Link className={menuLinkClass} href={teacherProfile ? `${base}/larare/${teacherProfile.slug}` : `${base}/larare`}>{t("profile")}</Link>
                    </>
                  ) : (
                    <>
                      <Link className={menuLinkClass} href={`${base}/admin`}>{t("adminPanel")}</Link>
                      <Link className={menuLinkClass} href={`${base}/admin/calendar`}>{t("calendar")}</Link>
                      <Link className={menuLinkClass} href={`${base}/admin/students`}>{t("students")}</Link>
                      <Link className={menuLinkClass} href={`${base}/admin/recensioner`}>{adminT("reviews")}</Link>
                    </>
                  )}
                  <div className="my-1 border-t border-border" />
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: base });
                    }}
                  >
                    <button type="submit" className="flex min-h-11 w-full items-center rounded-sm px-3 text-start font-semibold text-danger hover:bg-card-muted">
                      {t("signOut")}
                    </button>
                  </form>
                </div>
              </details>
            )}
            {canBook ? (
              <Link
                href={`${base}/boka`}
                className="hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm border border-accent bg-accent px-4 text-sm font-extrabold text-accent-ink shadow-soft md:inline-flex"
              >
                {t("book")}
              </Link>
            ) : (
              <a
                href={telHref(company("phone"))}
                className="hidden min-h-11 shrink-0 items-center whitespace-nowrap rounded-sm border border-accent bg-accent px-4 text-sm font-extrabold text-accent-ink shadow-soft md:inline-flex"
              >
                {callLabel}
              </a>
            )}
          </div>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
        <footer className="border-t border-surface-soft bg-surface py-12 text-ink-inverse sm:py-16">
          <div className="site-container grid gap-10 lg:grid-cols-4">
            <div>
              <Logo />
              <p className="mt-5 max-w-sm text-sm leading-6 text-ink-inverse-muted">
                {t("footerDescription")}
              </p>
              <address className="mt-5 max-w-sm text-sm not-italic leading-6 text-ink-inverse-muted">
                <p className="font-bold text-ink-inverse">{company("legalName")}</p>
                <p className="numbers-ltr">{t("orgnrLabel")}: {company("orgnr")}</p>
                <p>{company("visitingAddress")}</p>
                <p>
                  <a className="inline-flex min-h-11 items-center hover:text-ink-inverse" href={telHref(company("phone"))}>
                    {callLabel}
                  </a>
                </p>
                <p>
                  <a className="inline-flex min-h-11 items-center hover:text-ink-inverse" href={`mailto:${company("email")}`}>
                    {company("email")}
                  </a>
                </p>
              </address>
            </div>
            <div>
              <p className="text-sm font-extrabold">{t("explore")}</p>
              <div className="mt-4 grid gap-1 text-sm text-ink-inverse-muted">
                <Link className="flex min-h-11 items-center transition hover:text-ink-inverse" href={`${base}/korlektioner`}>{t("lessons")}</Link>
                {showInstructors ? (
                  <Link className="flex min-h-11 items-center transition hover:text-ink-inverse" href={`${base}/larare`}>{t("teachers")}</Link>
                ) : null}
                <Link className="flex min-h-11 items-center transition hover:text-ink-inverse" href={`${base}/teori`}>{t("theory")}</Link>
                <Link className="flex min-h-11 items-center transition hover:text-ink-inverse" href={`${base}/kontakt`}>{t("contact")}</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold">{t("legal")}</p>
              <div className="mt-4 grid gap-1 text-sm text-ink-inverse-muted">
                <Link className="flex min-h-11 items-center transition hover:text-ink-inverse" href={`${base}/villkor`}>{t("terms")}</Link>
                <Link className="flex min-h-11 items-center transition hover:text-ink-inverse" href={`${base}/integritet`}>{t("privacy")}</Link>
                <Link className="flex min-h-11 items-center transition hover:text-ink-inverse" href={`${base}/cookies`}>{t("cookies")}</Link>
              </div>
            </div>
            <div>
              <p className="text-sm font-extrabold">{t("languageHelp")}</p>
              <p className="mt-4 max-w-[70ch] text-sm leading-6 text-ink-inverse-muted">
                {t("languageHelpDescription", { languages: offeredLanguageNames })}
              </p>
            </div>
          </div>
          <div className="site-container mt-10 border-t border-surface-soft pt-6 text-xs font-semibold text-ink-inverse-muted">
            <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          </div>
        </footer>
        <BottomTabBar tabs={tabs} center={centerTab} />
        <CloseDetailsOnNavigate />
        <ScrollToTop label={t("scrollTop")} />
        <CookieConsent locale={params.locale} />
        <ServiceWorkerRegistration />
      </div>
    </NextIntlClientProvider>
  );
}
