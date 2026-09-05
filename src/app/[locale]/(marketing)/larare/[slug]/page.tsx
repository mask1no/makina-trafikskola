import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";

import { isLocale } from "@/i18n/routing";

import { getTeacher } from "../../_lib/data";

export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
): Promise<Metadata> {
  const params = await props.params;
  if (!isLocale(params.locale)) return {};
  const teacher = await getTeacher(params.locale, params.slug);
  if (!teacher) return {};
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`;
  const t = await getTranslations({
    locale: params.locale,
    namespace: "metadata",
  });
  return {
    title: name,
    description: teacher.translation?.bio?.trim() || t("description"),
    ...(teacher.photoUrl ? { openGraph: { images: [teacher.photoUrl] } } : {}),
  };
}

export default async function TeacherDetailPage(
  props: {
    params: Promise<{ locale: string; slug: string }>;
  }
) {
  const params = await props.params;
  if (!isLocale(params.locale)) notFound();
  setRequestLocale(params.locale);
  const [t, teacher] = await Promise.all([
    getTranslations(),
    getTeacher(params.locale, params.slug),
  ]);
  if (!teacher) notFound();
  const name = `${teacher.user.firstName} ${teacher.user.lastName}`;
  const initials = `${teacher.user.firstName[0] ?? ""}${teacher.user.lastName[0] ?? ""}`;

  return (
    <div className="px-4 py-12 sm:py-20">
      <article className="mx-auto max-w-5xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <div className="grid md:grid-cols-[.75fr_1.25fr]">
          <div className="grid min-h-72 place-items-center bg-surface p-8 text-ink-inverse">
            {teacher.photoUrl ? (
              <Image
                src={teacher.photoUrl}
                alt={name}
                width={320}
                height={400}
                className="rtl-no-mirror h-full max-h-[28rem] w-full rounded-md object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="grid size-40 place-items-center rounded-full bg-surface-raised text-5xl font-black"
              >
                {initials}
              </div>
            )}
          </div>
          <div className="p-6 sm:p-10">
            <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
              {t("teacher.profileEyebrow")}
            </p>
            <h1 className="mt-2 text-4xl font-black">{name}</h1>
            {teacher.slug === "sara-johansson" ? (
              <span className="mt-3 inline-block rounded-full bg-accent px-3 py-1 text-sm font-bold text-accent-ink">
                {t("teacher.demoProfile")}
              </span>
            ) : null}
            <p className="mt-3 text-ink-muted">
              {t("teacher.yearsExperience", { count: teacher.yearsExperience })}
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
            <Link
              href={`/${params.locale}/boka?teacher=${teacher.id}`}
              className="mt-8 inline-flex min-h-11 items-center rounded-sm bg-accent px-5 font-bold text-accent-ink hover:bg-accent-hover"
            >
              {t("teacher.bookWith", { name: teacher.user.firstName })}
            </Link>
          </div>
        </div>
      </article>
    </div>
  );
}
