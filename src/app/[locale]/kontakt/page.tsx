import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { LazyTeacherMap } from "@/components/LazyTeacherMap";
import { isLocale } from "@/i18n/routing";
import {
  companyOpeningHours,
  isOpenNow,
  openingHoursSpecification,
  todayHours,
} from "@/lib/company/opening-hours";
import { displayPhone, telHref } from "@/lib/format/phone";
import { publicAddress } from "@/lib/locations/address";
import { db } from "@/lib/db";
import { bookingEnabled } from "@/lib/launch";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

const publicStaff = [
  { name: "Aron Kessete", role: "trafikskolechef" },
  { name: "Goitom Mikael", role: "utbildningsledare" },
  { name: "Kidane Askelawi", role: "trafiklarare" },
  { name: "Azizullah Hasanzada", role: "trafiklarare" },
  { name: "Habtom Negassi Araya", role: "trafiklarare" },
  { name: "Daniel Araya", role: "trafiklarare" },
] as const;

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

  const [t, shell, company, locations] = await Promise.all([
    getTranslations("contact"),
    getTranslations("shell"),
    getTranslations("company"),
    db.location.findMany({
      where: { active: true },
      orderBy: { name: "asc" },
    }),
  ]);

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
    availableLanguage: ["sv", "en", "ti", "ar"],
    openingHoursSpecification: openingHoursSpecification(),
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
            <span className="numbers-ltr">{displayPhone(phone)}</span>
          </a>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Badge tone={open ? "success" : "neutral"}>{open ? shell("openNow") : shell("closed")}</Badge>
            <p className="text-sm text-ink-muted">
              {hours ? <span className="numbers-ltr">{hours.open}–{hours.close}</span> : shell("closed")}
            </p>
          </div>
          <table className="mt-6 hidden w-full text-sm md:table">
            <tbody>
              {companyOpeningHours.map((day, index) => (
                <tr key={index} className="border-t border-border">
                  <th scope="row" className="py-2 text-start font-bold">{t(`day.${index}`)}</th>
                  <td className="py-2 text-end numbers-ltr">{day ? `${day.open}–${day.close}` : shell("closed")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-sm leading-6">{visiting}</p>
          <a className="mt-2 inline-flex min-h-11 items-center font-bold underline underline-offset-4" href={directions} rel="noreferrer" target="_blank">
            {shell("directions")}
          </a>
          <dl className="mt-6 grid gap-4 border-t border-border pt-6 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("orgnr")}</dt>
              <dd className="mt-1 numbers-ltr">{orgnr}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("email")}</dt>
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
          <ul className="mt-6 grid gap-3 lg:grid-cols-3">
            {publicStaff.map((staffMember) => (
              <li key={staffMember.name} className="flex items-center gap-3 rounded-md border border-border bg-card p-3">
                <Avatar name={staffMember.name} size="sm" />
                <div className="min-w-0">
                  <p className="truncate font-extrabold">{staffMember.name}</p>
                  <p className="text-sm text-ink-muted">{t(`staffRoles.${staffMember.role}`)}</p>
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
              <LazyTeacherMap
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
                bookingAvailable={bookingEnabled()}
                center={{ lat: locations[0].lat, lng: locations[0].lng }}
                label={t("locationsTitle")}
                missingKeyTitle={t("locationsTitle")}
                missingKeyDescription={t("locationsDescription")}
                fallbackHref={mapsDirections(
                  locations[0].address,
                  locations[0].city,
                  locations[0].postalCode,
                )}
                fallbackLabel={t("directions")}
                markers={locations.map((location) => ({
                  id: location.id,
                  teacherId: location.id,
                  title: location.name,
                  position: { lat: location.lat, lng: location.lng },
                }))}
              />
            </div>
          ) : null}
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {locations.map((location) => (
              <article key={location.id} className="rounded-md border border-border bg-card p-5 shadow-soft">
                <h3 className="text-lg font-extrabold">{location.name}</h3>
                <p className="mt-2 text-sm leading-6 text-ink-muted">
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
          <p className="mt-3 max-w-[70ch] leading-7 text-ink-muted">{t("languagesBody")}</p>
          <p className="mt-3 text-sm text-ink-muted">{postal}</p>
        </section>
        </div>
        </div>
      </div>
    </div>
  );
}
