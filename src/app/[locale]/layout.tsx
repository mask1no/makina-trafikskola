import Link from "next/link";
import type { Metadata } from "next";
import { headers } from "next/headers";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { BottomTabBar } from "@/components/BottomTabBar";
import { CookieConsent } from "@/components/CookieConsent";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { isLocale, locales } from "@/i18n/routing";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
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
  const languages = Object.fromEntries(
    locales.map((locale) => [
      locale,
      siteOrigin ? `${siteOrigin}${localizedPath(locale)}` : localizedPath(locale),
    ]),
  );
  return {
    title: {
      default: t("title"),
      template: `%s · ${t("brand")}`,
    },
    description: t("description"),
    alternates: {
      canonical: siteOrigin
        ? `${siteOrigin}${localizedPath(params.locale)}`
        : localizedPath(params.locale),
      languages: {
        ...languages,
        "x-default": siteOrigin
          ? `${siteOrigin}${localizedPath("sv")}`
          : localizedPath("sv"),
      },
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
  const t = await getTranslations("shell");
  const base = `/${params.locale}`;
  const siteUrl = validSiteOrigin();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: "Makina Trafikskola",
    areaServed: { "@type": "City", name: "Stockholm" },
    availableLanguage: [...locales],
    ...(siteUrl ? { url: `${siteUrl}/${params.locale}` } : {}),
  };

  const tabs = [
    { href: base, label: t("home"), symbol: "⌂" },
    { href: `${base}/korlektioner`, label: t("packages"), symbol: "▦" },
    { href: `${base}/mina-sidor/bokningar`, label: t("bookings"), symbol: "□" },
    { href: `${base}/mina-sidor/meddelanden`, label: t("messages"), symbol: "◇" },
    { href: `${base}/mina-sidor/profil`, label: t("profile"), symbol: "○" },
  ];

  return (
    <NextIntlClientProvider>
      <div className="min-h-screen bg-page pb-20 md:pb-0">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
          }}
        />
        <header className="sticky top-0 z-40 border-b border-card/10 bg-surface text-ink-inverse">
          <div className="mx-auto flex min-h-16 max-w-7xl items-center gap-4 px-4 sm:px-6 lg:px-8">
            <Link href={base} className="rtl-no-mirror text-lg font-black tracking-tight">
              Makina Trafikskola
            </Link>
            <nav className="ms-auto hidden items-center gap-1 md:flex" aria-label={t("navigation")}>
              <Link className="min-h-11 px-3 py-3 text-sm font-semibold hover:text-ink-muted" href={base}>
                {t("home")}
              </Link>
              <Link className="min-h-11 px-3 py-3 text-sm font-semibold hover:text-ink-muted" href={`${base}/korlektioner`}>
                {t("lessons")}
              </Link>
              <Link className="min-h-11 px-3 py-3 text-sm font-semibold hover:text-ink-muted" href={`${base}/larare`}>
                {t("teachers")}
              </Link>
            </nav>
            <LanguageSwitcher />
            <Link
              href={`${base}/boka`}
              className="inline-flex min-h-11 items-center rounded-sm bg-accent px-3 text-sm font-bold text-accent-ink hover:bg-accent-hover sm:px-4"
            >
              {t("book")}
            </Link>
          </div>
        </header>
        <main>{children}</main>
        <footer className="bg-surface px-4 py-12 text-ink-inverse">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-3">
            <div>
              <p className="font-black">Makina Trafikskola</p>
              <p className="mt-3 max-w-sm text-sm leading-6 text-ink-muted">
                {t("footerDescription")}
              </p>
            </div>
            <div>
              <p className="font-bold">{t("explore")}</p>
              <div className="mt-3 grid gap-2 text-sm">
                <Link href={`${base}/korlektioner`}>{t("lessons")}</Link>
                <Link href={`${base}/larare`}>{t("teachers")}</Link>
                <Link href={`${base}/villkor`}>{t("terms")}</Link>
                <Link href={`${base}/integritet`}>{t("privacy")}</Link>
                <Link href={`${base}/cookies`}>{t("cookies")}</Link>
              </div>
            </div>
            <div>
              <p className="font-bold">{t("languageHelp")}</p>
              <p className="mt-3 text-sm leading-6 text-ink-muted">{t("languageHelpDescription")}</p>
            </div>
          </div>
        </footer>
        <BottomTabBar tabs={tabs} />
        <CookieConsent locale={params.locale} />
        <ServiceWorkerRegistration />
      </div>
    </NextIntlClientProvider>
  );
}
