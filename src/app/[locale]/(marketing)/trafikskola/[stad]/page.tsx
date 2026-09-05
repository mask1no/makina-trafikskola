import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; stad: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const location = await db.location.findFirst({
    where: { slug: params.stad, active: true },
    select: { city: true },
  });
  if (!location) return {};
  const t = await getTranslations({
    locale: params.locale,
    namespace: "localSchool",
  });
  return {
    title: t("metadataTitle", { city: location.city }),
    description: t("metadataDescription", { city: location.city }),
  };
}

export default async function TrafikskolaPage(
  props: {
    params: Promise<{ locale: string; stad: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const [t, location] = await Promise.all([
    getTranslations("localSchool"),
    db.location.findFirst({
      where: { slug: params.stad, active: true },
      include: {
        teachers: {
          where: { teacher: { active: true } },
          include: {
            teacher: {
              select: {
                id: true,
                slug: true,
                user: { select: { firstName: true, lastName: true } },
              },
            },
          },
        },
      },
    }),
  ]);
  if (!location) notFound();
  const hasConfirmedAddress = !location.address.trim().toUpperCase().startsWith("TODO");
  const hasCoordinates =
    Number.isFinite(location.lat) &&
    Number.isFinite(location.lng) &&
    Math.abs(location.lat) <= 90 &&
    Math.abs(location.lng) <= 180;
  const localStructuredData =
    hasConfirmedAddress && hasCoordinates
      ? {
          "@context": "https://schema.org",
          "@type": "DrivingSchool",
          name: location.name,
          address: {
            "@type": "PostalAddress",
            streetAddress: location.address,
            postalCode: location.postalCode,
            addressLocality: location.city,
            addressCountry: "SE",
          },
          geo: {
            "@type": "GeoCoordinates",
            latitude: location.lat,
            longitude: location.lng,
          },
        }
      : null;

  return (
    <div className="px-4 py-12 sm:py-20">
      {localStructuredData ? (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(localStructuredData).replace(/</g, "\\u003c"),
          }}
        />
      ) : null}
      <div className="mx-auto max-w-5xl">
        <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
          {t("eyebrow")}
        </p>
        <h1 className="mt-2 text-4xl font-black sm:text-5xl">
          {t("title", { city: location.city })}
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-ink-muted">
          {t("description", { city: location.city })}
        </p>
        <section className="mt-10 rounded-lg border border-border bg-card p-6">
          <h2 className="text-2xl font-black">{location.name}</h2>
          <p className="mt-3 text-ink-muted">
            {hasConfirmedAddress
              ? `${location.address}, ${location.postalCode} ${location.city}`
              : t("addressPending")}
          </p>
        </section>
        <section className="mt-8">
          <h2 className="text-2xl font-black">{t("teachersTitle")}</h2>
          {location.teachers.length ? (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {location.teachers.map(({ teacher }) => (
                <li key={teacher.id} className="rounded-md border border-border bg-card p-5">
                  {teacher.user.firstName} {teacher.user.lastName}
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-4">
              <EmptyState title={t("emptyTitle")} description={t("emptyDescription")} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
