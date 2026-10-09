import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { Notice } from "@/components/Notice";
import { PageHeader } from "@/components/PageHeader";
import { StaticMapArtwork } from "@/components/StaticMapArtwork";
import { isLocale } from "@/i18n/routing";
import { db } from "@/lib/db";
import { isAddressConfirmed } from "@/lib/locations/address";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; stad: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const location = await db.location.findFirst({
    where: { slug: params.stad },
    select: { city: true, status: true },
  });
  if (!location) return {};
  if (location.status === "COMING_SOON") {
    return { robots: { index: false, follow: false }, title: location.city };
  }
  const t = await getTranslations({
    locale: params.locale,
    namespace: "localSchool",
  });
  const title = t("metadataTitle", { city: location.city });
  const description = t("metadataDescription", { city: location.city });
  const canonical = pageCanonical(
    params.locale,
    `/trafikskola/${params.stad}`,
  );
  return {
    title,
    description,
    alternates: { canonical },
    ...withSocial({
      title,
      description,
      canonical,
      locale: params.locale,
    }),
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
  const [t, location, areas] = await Promise.all([
    getTranslations("localSchool"),
    db.location.findFirst({
      where: { slug: params.stad },
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
    db.location.findMany({
      where: { status: "ACTIVE" },
      select: {
        name: true,
        address: true,
        city: true,
        postalCode: true,
        lat: true,
        lng: true,
      },
    }),
  ]);
  if (!location) notFound();
  if (location.status === "COMING_SOON") {
    return (
      <div className="section-shell">
        <div className="site-container max-w-xl">
          <h1 className="text-h1 font-black">{location.city}</h1>
          <p className="mt-4 text-ink-muted">{t("comingSoon")}</p>
        </div>
      </div>
    );
  }
  const hasConfirmedAddress = isAddressConfirmed(location.address);
  const localStructuredData = {
    "@context": "https://schema.org",
    "@graph": areas
      .filter((area) => isAddressConfirmed(area.address))
      .map((area) => ({
        "@type": "DrivingSchool",
        name: area.name,
        address: {
          "@type": "PostalAddress",
          streetAddress: area.address,
          postalCode: area.postalCode,
          addressLocality: area.city,
          addressCountry: "SE",
        },
        ...(Number.isFinite(area.lat) && Number.isFinite(area.lng)
          ? {
              geo: {
                "@type": "GeoCoordinates",
                latitude: area.lat,
                longitude: area.lng,
              },
            }
          : {}),
      })),
  };

  return (
    <div className="section-shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(localStructuredData).replace(/</g, "\\u003c"),
        }}
      />
      <div className="site-container max-w-6xl">
        <PageHeader eyebrow={t("eyebrow")} title={t("title", { city: location.city })} description={t("description", { city: location.city })} />
        <section className="mt-10 grid overflow-hidden rounded-lg border border-border bg-card shadow-card md:grid-cols-[.75fr_1.25fr]">
          <div className="p-6 sm:p-8">
          <h2 className="text-2xl font-black">{location.name}</h2>
          {hasConfirmedAddress ? (
            <p className="mt-3 text-ink-muted">{location.address}, {location.postalCode} {location.city}</p>
          ) : (
            <Notice className="mt-5">{t("addressPending")}</Notice>
          )}
          </div>
          <div className="relative min-h-72 border-t border-border md:border-s md:border-t-0" role="img" aria-label={t("title", { city: location.city })}>
            <StaticMapArtwork className="absolute inset-0 size-full" />
          </div>
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
