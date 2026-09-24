import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/PageHeader";
import { TeacherMap } from "@/components/TeacherMap";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string }>;
  },
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const t = await getTranslations({ locale: params.locale, namespace: "contact" });
  return { title: t("title"), description: t("metadata") };
}

function mapsDirections(address: string, city: string, postalCode: string) {
  const query = encodeURIComponent(`${address}, ${postalCode} ${city}, Sweden`);
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

function telHref(phone: string) {
  const digits = phone.replace(/[^\d+]/g, "");
  return digits.startsWith("+") || digits.startsWith("0") ? `tel:${digits}` : `tel:${phone}`;
}

export default async function ContactPage(
  props: {
    params: Promise<{ locale: string }>;
  },
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);

  const [t, company, locations] = await Promise.all([
    getTranslations("contact"),
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
    availableLanguage: ["sv", "en", "ti", "ar", "so"],
    ...(siteUrl ? { url: `${siteUrl}/${params.locale}/kontakt` } : {}),
    department: locations.map((location) => ({
      "@type": "Place",
      name: location.name,
      address: {
        "@type": "PostalAddress",
        streetAddress: location.address,
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
      <div className="site-container max-w-5xl">
        <PageHeader
          eyebrow={t("eyebrow")}
          title={t("title")}
          description={t("description")}
        />

        <section className="mt-10 rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="text-xl font-black">{legalName}</h2>
          <dl className="mt-5 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("orgnr")}</dt>
              <dd className="mt-1 numbers-ltr">{orgnr}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("openingHours")}</dt>
              <dd className="mt-1">{t("openingHoursValue")}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("visitingAddress")}</dt>
              <dd className="mt-1">{visiting}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("postalAddress")}</dt>
              <dd className="mt-1">{postal}</dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("phone")}</dt>
              <dd className="mt-1">
                <a className="inline-flex min-h-11 items-center font-bold underline underline-offset-4 numbers-ltr" href={telHref(phone)}>
                  {phone}
                </a>
              </dd>
            </div>
            <div>
              <dt className="text-sm font-bold text-ink-muted">{t("email")}</dt>
              <dd className="mt-1">
                <a className="inline-flex min-h-11 items-center font-bold underline underline-offset-4" href={`mailto:${email}`}>
                  {email}
                </a>
              </dd>
            </div>
          </dl>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">{t("locationsTitle")}</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">{t("locationsDescription")}</p>
          {locations[0] ? (
            <div className="mt-6">
              <TeacherMap
                apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
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
                  {location.address}
                  <br />
                  <span className="numbers-ltr">{location.postalCode}</span> {location.city}
                </p>
                <a
                  className="mt-3 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
                  href={mapsDirections(location.address, location.city, location.postalCode)}
                  rel="noreferrer"
                  target="_blank"
                >
                  {t("directions")}
                </a>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10 rounded-lg border border-border bg-card p-6 shadow-soft sm:p-8">
          <h2 className="text-xl font-black">{t("languagesTitle")}</h2>
          <p className="mt-3 max-w-2xl leading-7 text-ink-muted">{t("languagesBody")}</p>
        </section>
      </div>
    </div>
  );
}
