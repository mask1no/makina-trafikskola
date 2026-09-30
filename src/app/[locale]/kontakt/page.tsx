import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { TeacherMap } from "@/components/TeacherMap";
import { isLocale } from "@/i18n/routing";
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
        <header className="relative overflow-hidden rounded-lg bg-surface p-7 text-ink-inverse shadow-float sm:p-10 lg:p-14">
          <div
            aria-hidden="true"
            className="absolute -end-16 -top-20 size-64 rounded-full bg-accent opacity-20 blur-3xl"
          />
          <div className="relative grid gap-10 lg:grid-cols-[1fr_auto] lg:items-end">
            <div className="max-w-2xl">
              <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-accent">
                {t("eyebrow")}
              </p>
              <h1 className="section-title mt-3">{t("title")}</h1>
              <p className="mt-5 text-lg leading-8 text-ink-inverse-muted">
                {t("description")}
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-sm bg-accent px-5 font-black text-accent-ink"
                href={telHref(phone)}
              >
                <span className="numbers-ltr">{phone}</span>
              </a>
              <a
                className="inline-flex min-h-12 items-center justify-center rounded-sm border border-ink-inverse/25 px-5 font-bold text-ink-inverse"
                href={`mailto:${email}`}
              >
                {email}
              </a>
            </div>
          </div>
        </header>

        <section className="relative z-10 mx-3 -mt-4 rounded-lg border border-border bg-card p-6 shadow-card sm:mx-6 sm:p-8">
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
          <h2 className="text-2xl font-black">{t("staffTitle")}</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">{t("staffDescription")}</p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {publicStaff.map((staffMember) => (
              <article
                key={staffMember.name}
                className="group flex min-h-64 flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-card transition duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-float"
              >
                <div className="flex items-center gap-4">
                  <Avatar name={staffMember.name} size="lg" />
                  <div>
                    <h3 className="text-lg font-extrabold">{staffMember.name}</h3>
                    <p className="mt-1 text-sm text-ink-muted">
                      {t(`staffRoles.${staffMember.role}`)}
                    </p>
                  </div>
                </div>
                <div className="mt-6 border-t border-border pt-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-ink-subtle">
                    {t("contactViaSchool")}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-4 text-sm font-bold">
                    <a
                      className="inline-flex min-h-11 items-center underline underline-offset-4"
                      href={telHref(phone)}
                    >
                      {t("callSchool")}
                    </a>
                    <a
                      className="inline-flex min-h-11 items-center underline underline-offset-4"
                      href={`mailto:${email}`}
                    >
                      {t("emailSchool")}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-2xl font-black">{t("locationsTitle")}</h2>
          <p className="mt-3 max-w-2xl text-ink-muted">{t("locationsDescription")}</p>
          {locations[0] ? (
            <div className="mt-6">
              <TeacherMap
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
