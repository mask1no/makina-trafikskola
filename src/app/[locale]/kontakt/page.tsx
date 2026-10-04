import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { ClickToLoadMapEmbed } from "@/components/ClickToLoadMapEmbed";
import { isLocale } from "@/i18n/routing";
import {
  companyOpeningHours,
  isOpenNow,
  openingHoursSpecification,
  todayHours,
} from "@/lib/company/opening-hours";
import {
  COMING_SOON_TEACHING_LANGUAGES,
  formatLanguageList,
  offeredTeachingLanguages,
  publicStaff,
} from "@/lib/company/staff";
import { displayPhone, smsHref, telHref } from "@/lib/format/phone";
import { publicAddress } from "@/lib/locations/address";
import { db } from "@/lib/db";
import {
  getPublishedReviewSummary,
  shouldShowPublicReviews,
} from "@/lib/reviews/public";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  },
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({ locale: params.locale, namespace: "contact" });
  const title = t("title");
  const description = t("metadata");
  const canonical = pageCanonical(params.locale, "/kontakt");
  return {
    title,
    description,
    alternates: { canonical },
    ...withSocial({ title, description, canonical, locale: params.locale }),
  };
}

function mapsDirections(address: string, city: string, postalCode: string) {
  const query = encodeURIComponent(`${address}, ${postalCode} ${city}, Sweden`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

export default async function ContactPage(
  props: {
    params: Promise<{ locale: string }>;
  },
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);

  const [t, shell, company, languageNames, locations, staffPhotos, reviewSummary] = await Promise.all([
    getTranslations("contact"),
    getTranslations("shell"),
    getTranslations("company"),
    getTranslations("language"),
    db.location.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
    db.teacherProfile.findMany({
      where: {
        slug: {
          in: publicStaff
            .map((staffMember) => staffMember.teacherSlug)
            .filter((slug): slug is string => Boolean(slug)),
        },
      },
      select: {
        slug: true,
        photoUrl: true,
      },
    }),
    getPublishedReviewSummary(),
  ]);
  const photoBySlug = new Map(staffPhotos.map((teacher) => [teacher.slug, teacher.photoUrl]));

  const legalName = company("legalName");
  const orgnr = company("orgnr");
  const visiting = company("visitingAddress");
  const postal = company("postalAddress");
  const phone = company("phone");
  const email = company("email");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const now = new Date();
  const open = isOpenNow(now);
  const hours = todayHours(now);
  const offeredLanguages = offeredTeachingLanguages();
  const offeredLanguageNames = formatLanguageList(
    offeredLanguages,
    params.locale,
    (code) => languageNames(code),
  );
  const comingSoonLanguageNames = formatLanguageList(
    COMING_SOON_TEACHING_LANGUAGES,
    params.locale,
    (code) => languageNames(code),
  );
  const directions = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(`${visiting}, Sweden`)}`;

  const structuredData = {
    "@context": "https://schema.org",
    "@type": ["LocalBusiness", "DrivingSchool"],
    name: legalName,
    taxID: orgnr,
    telephone: phone,
    email,
    address: {
      "@type": "PostalAddress",
      streetAddress: visiting,
      addressCountry: "SE",
    },
    areaServed: { "@type": "City", name: "Stockholm" },
    availableLanguage: offeredLanguages,
    openingHoursSpecification: openingHoursSpecification(),
    ...(shouldShowPublicReviews(reviewSummary.count)
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: reviewSummary.average.toFixed(1),
            reviewCount: reviewSummary.count,
            bestRating: "5",
            worstRating: "1",
          },
        }
      : {}),
    ...(siteUrl ? { url: `${siteUrl}/${params.locale}/kontakt` } : {}),
    department: locations.map((location) => ({
      "@type": "Place",
      name: location.name,
      address: {
        "@type": "PostalAddress",
        ...(publicAddress(location.address)
          ? { streetAddress: publicAddress(location.address) }
          : {}),
        addressLocality: location.city,
        postalCode: location.postalCode,
        addressCountry: "SE",
      },
      geo: {
        "@type": "GeoCoordinates",
        latitude: location.lat,
        longitude: location.lng,
      },
    })),
  };

  return (
    <div className="section-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div className="site-container">
        <div className="grid items-start gap-8 lg:grid-cols-2">
        <section className="rounded-lg border border-border bg-card p-6 shadow-card sm:p-8">
          <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-ink-muted">{t("eyebrow")}</p>
          <h1 className="section-title mt-3">{t("title")}</h1>
          <p className="mt-4 max-w-[70ch] leading-7 text-ink-muted">{t("description")}</p>
          <a className="mt-6 inline-flex min-h-16 w-full items-center justify-center rounded-sm bg-accent px-5 text-2xl font-black text-accent-ink" href={telHref(phone)}>
            {shell.rich("callName", {
              phone: () => (
                <bdi dir="ltr" className="numbers-ltr">
                  {displayPhone(phone)}
                </bdi>
              ),
            })}
          </a>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Badge tone={open ? "success" : "neutral"}>{open ? shell("openNow") : shell("closed")}</Badge>
            <p className="text-small text-ink-muted">
              {hours ? <span className="numbers-ltr">{hours.open}–{hours.close}</span> : shell("closed")}
            </p>
          </div>
          <details className="mt-4 rounded-sm border border-border bg-page p-3 text-small md:hidden">
            <summary className="cursor-pointer font-bold">{t("openingHours")}</summary>
            <table className="mt-3 w-full text-small">
              <tbody>
                {companyOpeningHours.map((day, index) => (
                  <tr key={index} className="border-t border-border">
                    <th scope="row" className="py-2 text-start font-bold">{t(`day.${index}`)}</th>
                    <td className="py-2 text-end numbers-ltr">{day ? `${day.open}–${day.close}` : shell("closed")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
          <table className="mt-6 hidden w-full text-small md:table">
            <tbody>
              {companyOpeningHours.map((day, index) => (
                <tr key={index} className="border-t border-border">
                  <th scope="row" className="py-2 text-start font-bold">{t(`day.${index}`)}</th>
                  <td className="py-2 text-end numbers-ltr">{day ? `${day.open}–${day.close}` : shell("closed")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 max-w-[70ch] text-body leading-7">{visiting}</p>
          <a className="mt-2 inline-flex min-h-11 items-center font-bold underline underline-offset-4" href={directions} rel="noreferrer" target="_blank">
            {shell("directions")}
          </a>
          <a className="mt-1 inline-flex min-h-11 items-center text-small font-bold text-ink-muted underline underline-offset-4" href={smsHref(phone)}>
            {t("sendSms")}
          </a>
          <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-small font-bold text-ink-muted">{t("orgnr")}</dt>
              <dd className="mt-1 numbers-ltr">{orgnr}</dd>
            </div>
            <div>
              <dt className="text-small font-bold text-ink-muted">{t("email")}</dt>
              <dd className="mt-1 break-all">
                <a className="inline-flex min-h-11 items-center font-bold underline underline-offset-4" href={`mailto:${email}`}>{email}</a>
              </dd>
            </div>
          </dl>
        </section>
        <div className="grid gap-8">
        <section>
          <h2 className="text-2xl font-black">{t("staffTitle")}</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">{t("staffDescription")}</p>
          <ul className="mt-6 grid gap-3 lg:grid-cols-2">
            {publicStaff.map((staffMember) => (
              <li key={staffMember.name} className="flex items-start gap-3 rounded-md border border-border bg-card p-3">
                <Avatar
                  name={staffMember.name}
                  imageUrl={
                    staffMember.teacherSlug
                      ? (photoBySlug.get(staffMember.teacherSlug) ?? null)
                      : null
                  }
                  size="sm"
                />
                <div className="min-w-0">
                  <p className="font-extrabold">{staffMember.name}</p>
                  <p className="text-small text-ink-muted">{t(`staffRoles.${staffMember.role}`)}</p>
                  <p className="mt-1 max-w-[70ch] text-body leading-7 text-ink-muted">
                    {t("speaks", {
                      languages: formatLanguageList(
                        staffMember.languages,
                        params.locale,
                        (code) => languageNames(code),
                      ),
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">{t("locationsTitle")}</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">{t("locationsDescription")}</p>
          {locations[0] ? (
            <div className="mt-6">
              <ClickToLoadMapEmbed
                address={`${visiting}, Sweden`}
                buttonLabel={shell("showMap")}
                title={t("locationsTitle")}
                privacy={shell("mapPrivacy")}
              />
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {locations.map((location) => (
              <article key={location.id} className="rounded-md border border-border bg-card p-5 shadow-soft">
                <h3 className="text-lg font-extrabold">{location.name}</h3>
                <p className="mt-2 max-w-[70ch] text-body leading-7 text-ink-muted">
                  {publicAddress(location.address) ?? location.city}
                  <br />
                  <span className="numbers-ltr">{location.postalCode}</span> {location.city}
                </p>
                <a
                  className="mt-3 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                  href={mapsDirections(publicAddress(location.address) ?? location.city, location.city, location.postalCode)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("directions")}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="rounded-lg border border-border bg-card p-6 shadow-soft">
          <h2 className="text-xl font-black">{t("languagesTitle")}</h2>
          <p className="mt-3 max-w-[70ch] leading-7 text-ink-muted">
            {t("languagesBody", {
              languages: offeredLanguageNames,
              comingSoonLanguages: comingSoonLanguageNames,
            })}
          </p>
          <p className="mt-3 text-small text-ink-muted">{postal}</p>
        </section>
        {shouldShowPublicReviews(reviewSummary.count) ? (
          <section className="rounded-lg border border-border bg-card p-6 shadow-soft">
            <h2 className="text-xl font-black">{t("reviewsTitle")}</h2>
            <p className="mt-2 text-small text-ink-muted">
              {t("reviewsSummary", {
                count: reviewSummary.count,
                average: reviewSummary.average.toFixed(1),
              })}
            </p>
            <ul className="mt-5 grid gap-4">
              {reviewSummary.latest.map((review) => (
                <li key={review.id} className="rounded-sm border border-border bg-page p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-bold">{review.studentName}</p>
                    <p className="numbers-ltr text-small font-bold text-ink-muted">
                      {review.rating}/5
                    </p>
                  </div>
                  {review.comment ? (
                    <p className="mt-2 max-w-[70ch] text-body leading-7 text-ink-muted">
                      {review.comment}
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        </div>
        </div>
      </div>
    </div>
  );
}
