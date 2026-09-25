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
import { CookieConsent } from "@/components/CookieConsent";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { isLocale, locales } from "@/i18n/routing";
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
    <span className="rtl-no-mirror inline-flex items-center gap-2.5">
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
      <span className={`${compactOnMobile ? "hidden sm:inline" : ""} text-base font-black tracking-[-0.035em] sm:text-lg`}>
        Makina <span className="hidden font-semibold text-ink-inverse-muted sm:inline">Trafikskola</span>
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
  const [t, adminT, teacherT, company, session] = await Promise.all([
    getTranslations("shell"),
    getTranslations("admin.nav"),
    getTranslations("teacherPortal"),
    getTranslations("company"),
    auth(),
  ]);
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
    availableLanguage: [...locales],
    ...(siteUrl ? { url: `${siteUrl}/${params.locale}` } : {}),
  };

  const tabs = (
    session?.user.role === "ADMIN"
      ? [
          { href: `${base}/admin/calendar`, label: adminT("calendar"), icon: "bookings" },
          { href: `${base}/admin/students`, label: adminT("students"), icon: "profile" },
          { href: `${base}/admin/instructors/new`, label: adminT("instructors"), icon: "messages" },
          { href: `${base}/admin/recensioner`, label: adminT("reviews"), icon: "profile" },
          { href: base, label: t("home"), icon: "home" },
          { href: `${base}/korlektioner`, label: t("packages"), icon: "packages" },
        ]
      : session?.user.role === "TEACHER"
        ? [
            { href: `${base}/larare-portal`, label: teacherT("eyebrow"), icon: "bookings" },
            { href: base, label: t("home"), icon: "home" },
            { href: `${base}/korlektioner`, label: t("lessons"), icon: "packages" },
            { href: `${base}/larare`, label: t("teachers"), icon: "profile" },
            { href: `${base}/teori`, label: t("theory"), icon: "messages" },
          ]
        : session?.user.role === "STUDENT"
          ? [
            { href: base, label: t("home"), icon: "home" },
            { href: `${base}/korlektioner`, label: t("packages"), icon: "packages" },
            { href: `${base}/mina-sidor/bokningar`, label: t("bookings"), icon: "bookings" },
            { href: `${base}/mina-sidor/meddelanden`, label: t("messages"), icon: "messages" },
            { href: `${base}/mina-sidor/profil`, label: t("profile"), icon: "profile" },
          ]
          : [
              { href: base, label: t("home"), icon: "home" },
              { href: `${base}/korlektioner`, label: t("packages"), icon: "packages" },
              ...(showInstructors
                ? [{ href: `${base}/larare`, label: t("teachers"), icon: "bookings" as const }]
                : []),
              { href: `${base}/teori`, label: t("theory"), icon: "messages" },
              { href: `${base}/logga-in`, label: t("signIn"), icon: "profile" },
            ]
  ) satisfies { href: string; label: string; icon: BottomTabIcon }[];

  return (
    <NextIntlClientProvider>
      <div className="min-h-screen bg-page pb-[calc(4.5rem+env(safe-area-inset-bottom))] lg:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <header className="sticky top-0 z-40 border-b border-surface-soft bg-surface text-ink-inverse shadow-soft">
          <div className="site-container flex min-h-16 items-center gap-3 lg:min-h-[4.5rem]">
            <Link href={base} className="inline-flex min-h-11 items-center">
              <Logo compactOnMobile />
            </Link>
            <nav className="ms-auto hidden items-center gap-1 lg:flex" aria-label={t("navigation")}>
              <Link aria-current={currentPage(base)} className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-bold transition hover:bg-surface-raised aria-[current=page]:bg-surface-raised" href={base}>
                {t("home")}
              </Link>
              <Link aria-current={currentPage(`${base}/korlektioner`)} className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-bold transition hover:bg-surface-raised aria-[current=page]:bg-surface-raised" href={`${base}/korlektioner`}>
                {t("lessons")}
              </Link>
              {showInstructors ? (
                <Link aria-current={currentPage(`${base}/larare`)} className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-bold transition hover:bg-surface-raised aria-[current=page]:bg-surface-raised" href={`${base}/larare`}>
                  {t("teachers")}
                </Link>
              ) : null}
              <Link aria-current={currentPage(`${base}/teori`)} className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-bold transition hover:bg-surface-raised aria-[current=page]:bg-surface-raised" href={`${base}/teori`}>
                {t("theory")}
              </Link>
              <Link aria-current={currentPage(`${base}/kontakt`)} className="inline-flex min-h-11 items-center rounded-sm px-3 text-sm font-bold transition hover:bg-surface-raised aria-[current=page]:bg-surface-raised" href={`${base}/kontakt`}>
                {t("contact")}
              </Link>
            </nav>
            <div className="ms-auto lg:ms-2">
              <LanguageSwitcher />
            </div>
            {!session?.user ? (
              <Link
                href={`${base}/logga-in`}
                className="hidden min-h-11 items-center px-2 text-sm font-bold underline-offset-4 hover:underline lg:inline-flex"
              >
                {t("signIn")}
              </Link>
            ) : (
              <details className="group relative hidden lg:block">
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
                <div className="absolute end-0 top-[calc(100%+0.5rem)] z-50 min-w-56 rounded-md border border-border bg-card p-2 text-sm text-ink shadow-float">
                  {session.user.role === "STUDENT" ? (
                    <>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/mina-sidor`}>{t("myPages")}</Link>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/mina-sidor/bokningar`}>{t("bookings")}</Link>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/mina-sidor/lektioner`}>{t("balance")}</Link>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/mina-sidor/profil`}>{t("profile")}</Link>
                    </>
                  ) : session.user.role === "TEACHER" ? (
                    <>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/larare-portal`}>{t("teacherPortal")}</Link>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={teacherProfile ? `${base}/larare/${teacherProfile.slug}` : `${base}/larare`}>{t("profile")}</Link>
                    </>
                  ) : (
                    <>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/admin`}>{t("adminPanel")}</Link>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/admin/calendar`}>{t("calendar")}</Link>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/admin/students`}>{t("students")}</Link>
                      <Link className="flex min-h-11 items-center rounded-sm px-3 font-semibold hover:bg-card-muted" href={`${base}/admin/recensioner`}>{adminT("reviews")}</Link>
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
            <Link
              href={canBook ? `${base}/boka` : `${base}/kontakt`}
              className="inline-flex min-h-11 items-center rounded-sm border border-accent bg-accent px-3 text-sm font-extrabold text-accent-ink shadow-soft transition hover:border-accent-hover hover:bg-accent-hover sm:px-5"
            >
              {canBook ? t("book") : t("contact")}
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className="border-t border-surface-soft bg-surface py-12 text-ink-inverse sm:py-16">
          <div className="site-container grid gap-10 md:grid-cols-12">
            <div className="md:col-span-5">
              <Logo />
              <p className="mt-5 max-w-sm text-sm leading-6 text-ink-inverse-muted">
                {t("footerDescription")}
              </p>
              <address className="mt-5 max-w-sm text-sm not-italic leading-6 text-ink-inverse-muted">
                <p className="font-bold text-ink-inverse">{company("legalName")}</p>
                <p className="numbers-ltr">{t("orgnrLabel")}: {company("orgnr")}</p>
                <p>{company("visitingAddress")}</p>
                <p>
                  <a className="inline-flex min-h-11 items-center hover:text-ink-inverse numbers-ltr" href={`tel:${company("phone").replace(/[^\d+]/g, "") || company("phone")}`}>
                    {company("phone")}
                  </a>
                </p>
                <p>
                  <a className="inline-flex min-h-11 items-center hover:text-ink-inverse" href={`mailto:${company("email")}`}>
                    {company("email")}
                  </a>
                </p>
              </address>
            </div>
            <div className="md:col-span-3">
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
            <div className="md:col-span-4">
              <p className="text-sm font-extrabold">{t("languageHelp")}</p>
              <p className="mt-4 max-w-sm text-sm leading-6 text-ink-inverse-muted">{t("languageHelpDescription")}</p>
            </div>
          </div>
          <div className="site-container mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-surface-soft pt-6 text-xs font-semibold text-ink-inverse-muted">
            <Link className="inline-flex min-h-11 items-center hover:text-ink-inverse" href={`${base}/kontakt`}>{t("contact")}</Link>
            <Link className="inline-flex min-h-11 items-center hover:text-ink-inverse" href={`${base}/villkor`}>{t("terms")}</Link>
            <Link className="inline-flex min-h-11 items-center hover:text-ink-inverse" href={`${base}/integritet`}>{t("privacy")}</Link>
            <Link className="inline-flex min-h-11 items-center hover:text-ink-inverse" href={`${base}/cookies`}>{t("cookies")}</Link>
          </div>
        </footer>
        <BottomTabBar tabs={tabs} />
        <ScrollToTop label={t("scrollTop")} />
        <CookieConsent locale={params.locale} />
        <ServiceWorkerRegistration />
      </div>
    </NextIntlClientProvider>
  );
}
