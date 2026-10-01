import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { Avatar } from "@/components/Avatar";
import { isLocale } from "@/i18n/routing";
import { LinkButton } from "@/components/LinkButton";
import { StaticMapArtwork } from "@/components/StaticMapArtwork";
import { bookingEnabled, instructorsEnabled } from "@/lib/launch";
import { pageCanonical, withSocial } from "@/lib/seo/metadata";

import { getTeacher } from "../../_lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  if (!instructorsEnabled()) return { robots: { index: false, follow: false } };
  const teacher = await getTeacher(params.locale, params.slug);
  if (!teacher) return {};
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`;
  const t = await getTranslations({
    locale: params.locale,
    namespace: "metadata",
  });
  const title = name;
  const description = teacher.translation?.bio?.trim() || t("description");
  const canonical = pageCanonical(params.locale, `/larare/${params.slug}`);
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

export default async function TeacherDetailPage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  if (!instructorsEnabled()) notFound();
  setRequestLocale(params.locale);
  const [t, teacher] = await Promise.all([
    getTranslations(),
    getTeacher(params.locale, params.slug),
  ]);
  if (!teacher) notFound();
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`;
  const canBook = bookingEnabled();

  return (
    <div className="section-shell">
      <article className="site-container">
        <div className="grid overflow-hidden rounded-lg border border-border bg-card shadow-card md:grid-cols-[.8fr_1.2fr]">
          <div className="grid min-h-72 place-items-center bg-surface p-8 text-ink-inverse">
            <Avatar
              name={name}
              imageUrl={teacher.photoUrl}
              size="hero"
            />
          </div>
          <div className="p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              {t("teacher.profileEyebrow")}
            </p>
            <h1 className="mt-2 text-4xl font-black">
              <bdi>{name}</bdi>
            </h1>
            <p className="mt-3 text-ink-muted">
              {t("teacher.yearsExperience", { count: teacher.yearsExperience, n: String(teacher.yearsExperience) })}
            </p>
            {teacher.swedishOnly ? (
              <span className="mt-4 inline-block rounded-full bg-page px-3 py-1 text-xs text-ink-muted">
                {t("common.swedishOnly")}
              </span>
            ) : null}
            {teacher.translation?.bio ? (
              <p className="mt-6 whitespace-pre-line text-lg leading-8">
                {teacher.translation.bio}
              </p>
            ) : (
              <p className="mt-6 text-ink-muted">{t("teacher.bioPending")}</p>
            )}

            <dl className="mt-8 grid gap-5 sm:grid-cols-2">
              <div>
                <dt className="text-sm font-bold text-ink-muted">{t("teacher.languages")}</dt>
                <dd className="mt-2">{teacher.languages.map((item) => t(`language.${item}`)).join(" · ")}</dd>
              </div>
              <div>
                <dt className="text-sm font-bold text-ink-muted">{t("teacher.transmissions")}</dt>
                <dd className="mt-2">
                  {teacher.transmissions
                    .map((item) => t(`teacher.transmission.${item.toLowerCase()}`))
                    .join(" · ")}
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-bold text-ink-muted">{t("teacher.locations")}</dt>
                <dd className="mt-2">
                  {teacher.locations.map(({ location }) => location.name).join(" · ")}
                </dd>
              </div>
            </dl>
            <LinkButton
              href={`/${params.locale}/${canBook ? `boka?teacher=${teacher.id}` : "kontakt"}`}
              className="mt-8"
            >
              {canBook
                ? t("teacher.bookWith", { name: teacher.user.firstName })
                : t("shell.contact")}
            </LinkButton>
          </div>
        </div>
        <section className="mt-8 grid overflow-hidden rounded-lg border border-border bg-card md:grid-cols-[.7fr_1.3fr]" aria-labelledby="teacher-location-title">
          <div className="p-6 sm:p-8">
            <h2 id="teacher-location-title" className="text-2xl font-black">{t("teacher.locations")}</h2>
            <p className="mt-3 leading-7 text-ink-muted">
              {teacher.locations.length
                ? teacher.locations.map(({ location }) => location.name).join(" · ")
                : t("map.unavailableDescription")}
            </p>
          </div>
          <div className="relative min-h-64 border-t border-border md:border-s md:border-t-0" role="img" aria-label={t("map.staticLabel")}>
            <StaticMapArtwork className="absolute inset-0 size-full" />
          </div>
        </section>
      </article>
    </div>
  );
}
