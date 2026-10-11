import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { auth } from "@/auth";
import { CloseDetailsOnNavigate } from "@/components/CloseDetailsOnNavigate";
import { CookieConsent } from "@/components/CookieConsent";
import {
  MobileTabBar,
  type MobileTabIcon,
} from "@/components/MobileTabBar";
import { ScrollToTop } from "@/components/ScrollToTop";
import { ServiceWorkerRegistration } from "@/components/ServiceWorkerRegistration";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { isLocale, locales } from "@/i18n/routing";
import { openingHoursSpecification } from "@/lib/company/opening-hours";
import { offeredTeachingLanguagesFrom } from "@/lib/company/staff";
import { db } from "@/lib/db";
import { telHref } from "@/lib/format/phone";
import { loadPublicNavData } from "@/lib/layout/public-nav";
import {
  bookingEnabled,
  instructorsEnabled,
  theoryNavVisible,
} from "@/lib/launch";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

function validSiteOrigin() {
  try {
    const url = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "");
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.origin
      : null;
  } catch {
    return null;
  }
}

export async function generateMetadata(props: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({
    locale: params.locale,
    namespace: "metadata",
  });
  const pathname =
    (await headers()).get("x-makina-pathname") ?? `/${params.locale}`;
  const suffix = pathname.replace(/^\/(?:sv|en|ti|ar)/, "") || "/";
  const siteOrigin = validSiteOrigin();
  const localizedPath = (locale: string) =>
    `/${locale}${suffix === "/" ? "" : suffix}`;
  const canonical = siteOrigin
    ? `${siteOrigin}${localizedPath(params.locale)}`
    : localizedPath(params.locale);
  const languages = Object.fromEntries(
    locales.map((locale) => [
      locale,
      siteOrigin
        ? `${siteOrigin}${localizedPath(locale)}`
        : localizedPath(locale),
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
      images: [
        {
          url: `/api/og?title=${encodeURIComponent(t("title"))}`,
          alt: t("brand"),
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("title"),
      description: t("description"),
      images: [`/api/og?title=${encodeURIComponent(t("title"))}`],
    },
    manifest: "/manifest.webmanifest",
  };
}

export default async function LocaleLayout(props: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const params = await props.params;
  const { children } = props;

  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const [t, adminT, teacherT, company, session] = await Promise.all([
    getTranslations("shell"),
    getTranslations("admin.nav"),
    getTranslations("teacherPortal"),
    getTranslations("company"),
    auth(),
  ]);
  const { places: publicPlaces, languages: activeLanguages } =
    await loadPublicNavData();
  const offeredLanguages = offeredTeachingLanguagesFrom(activeLanguages);
  const headerStore = await headers();
  const pathname = headerStore.get("x-makina-pathname") ?? "";
  const account = session?.user.id
    ? await db.user.findUnique({
        where: { id: session.user.id },
        select: {
          googleSub: true,
          phoneVerifiedAt: true,
          deletedAt: true,
          role: true,
          phone: true,
          teacherProfile: { select: { photoUrl: true } },
        },
      })
    : null;
  if (account && !pathname.includes("/verifiera-mobil")) {
    const teacherHasPhone =
      account.role === "TEACHER" && Boolean(account.phone);
    if (
      account.googleSub &&
      !account.phoneVerifiedAt &&
      !account.deletedAt &&
      !teacherHasPhone
    ) {
      redirect(`/${params.locale}/verifiera-mobil`);
    }
  }

  const base = `/${params.locale}`;
  const currentPage = (href: string) =>
    pathname === href ||
    (href !== base && pathname.startsWith(`${href}/`));
  const canBook = bookingEnabled();
  const showInstructors = instructorsEnabled();
  const showTheory = theoryNavVisible();
  const navItems = [
    { href: `${base}/korlektioner`, label: t("lessons") },
    { href: `${base}/kurser`, label: t("courses") },
    { href: `${base}/priser`, label: t("prices") },
    ...(showTheory ? [{ href: `${base}/teori`, label: t("theory") }] : []),
    { href: `${base}/kontakt`, label: t("contact") },
  ].map((item) => ({ ...item, current: currentPage(item.href) }));
  const siteUrl = validSiteOrigin();
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "DrivingSchool",
    name: company("legalName"),
    areaServed: { "@type": "City", name: "Stockholm" },
    availableLanguage: offeredLanguages,
    openingHoursSpecification: openingHoursSpecification(),
    ...(siteUrl ? { url: `${siteUrl}/${params.locale}` } : {}),
  };
  const storeLinks = (
    [
      ["APP_STORE_URL", t("appStore")],
      ["GOOGLE_PLAY_URL", t("googlePlay")],
      ["INSTAGRAM_URL", t("instagram")],
      ["FACEBOOK_URL", t("facebook")],
      ["TIKTOK_URL", t("tiktok")],
    ] as const
  ).flatMap(([key, label]) => {
    const url = process.env[key]?.trim();
    return url?.startsWith("https://") ? [{ url, label }] : [];
  });
  const centerTab = {
    href: canBook ? `${base}/boka` : telHref(company("phone")),
    label: canBook ? t("book") : t("callUs"),
    icon: canBook ? "bookings" : "call",
  } as const;
  const tabs = (
    session?.user.role === "ADMIN"
      ? [
          { href: `${base}/admin`, label: t("admin"), icon: "profile" },
          {
            href: `${base}/admin/calendar`,
            label: t("calendar"),
            icon: "bookings",
          },
          { href: base, label: t("home"), icon: "home" },
          {
            href: `${base}/admin/students`,
            label: t("students"),
            icon: "messages",
          },
        ]
      : session?.user.role === "TEACHER"
        ? [
            {
              href: `${base}/larare-portal`,
              label: teacherT("eyebrow"),
              icon: "bookings",
            },
            { href: base, label: t("home"), icon: "home" },
            {
              href: `${base}/korlektioner`,
              label: t("lessonsShort"),
              icon: "packages",
            },
            {
              href: showTheory ? `${base}/teori` : `${base}/kurser`,
              label: showTheory ? t("theory") : t("courses"),
              icon: "messages" as const,
            },
          ]
        : [
            { href: base, label: t("home"), icon: "home" },
            {
              href: `${base}/korlektioner`,
              label: t("lessonsShort"),
              icon: "packages",
            },
            {
              href: showTheory ? `${base}/teori` : `${base}/kurser`,
              label: showTheory ? t("theory") : t("courses"),
              icon: "messages" as const,
            },
            {
              href: session?.user
                ? `${base}/mina-sidor`
                : `${base}/logga-in`,
              label: session?.user ? t("myPages") : t("signIn"),
              icon: "profile",
            },
          ]
  ) satisfies { href: string; label: string; icon: MobileTabIcon }[];

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
        <SiteHeader
          base={base}
          canBook={canBook}
          companyName={company("legalName")}
          labels={{
            account: t("account"),
            adminPanel: t("adminPanel"),
            balance: t("balance"),
            book: t("book"),
            bookings: t("bookings"),
            calendar: t("calendar"),
            callUs: t("callUs"),
            myPages: t("myPages"),
            navigation: t("navigation"),
            profile: t("profile"),
            reviews: adminT("reviews"),
            signIn: t("signIn"),
            signOut: t("signOut"),
            students: t("students"),
            teacherPortal: t("teacherPortal"),
          }}
          navItems={navItems}
          phone={company("phone")}
          user={
            session?.user
              ? {
                  ...session.user,
                  imageUrl: account?.teacherProfile?.photoUrl ?? null,
                }
              : null
          }
        />
        <main
          id="main"
          tabIndex={-1}
          className="pb-[var(--tab-bar-height)] md:pb-0"
        >
          {children}
        </main>
        <SiteFooter
          base={base}
          company={{
            email: company("email"),
            legalName: company("legalName"),
            phone: company("phone"),
          }}
          labels={{
            callUs: t("callUs"),
            comingSoonPlace: (town) => t("comingSoonPlace", { town }),
            contact: t("contact"),
            cookies: t("cookies"),
            copyright: t("copyright", { year: new Date().getFullYear() }),
            courses: t("courses"),
            explore: t("explore"),
            footerDescription: t("footerDescription"),
            here: t("here"),
            languageHelp: t("languageHelp"),
            languageHelpDescription: (languages) =>
              t("languageHelpDescription", { languages }),
            languageNames: {
              sv: t("languagePage.sv"),
              en: t("languagePage.en"),
              ti: t("languagePage.ti"),
              ku: t("languagePage.ku"),
            },
            legal: t("legal"),
            lessons: t("lessons"),
            mailUs: t("mailUs"),
            privacy: t("privacy"),
            schoolIn: (town) => t("schoolIn", { town }),
            teachers: t("teachers"),
            terms: t("terms"),
            theory: t("theory"),
          }}
          locale={params.locale}
          offeredLanguages={offeredLanguages}
          places={publicPlaces}
          showInstructors={showInstructors}
          showTheory={showTheory}
          storeLinks={storeLinks}
        />
        <MobileTabBar tabs={tabs} center={centerTab} />
        <CloseDetailsOnNavigate />
        <ScrollToTop label={t("scrollTop")} />
        <CookieConsent locale={params.locale} />
        <ServiceWorkerRegistration />
      </div>
    </NextIntlClientProvider>
  );
}
