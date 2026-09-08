import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PillFilter } from "@/components/PillFilter";
import { Select } from "@/components/Select";
import { TeacherCard } from "@/components/TeacherCard";
import { TeacherMap } from "@/components/TeacherMap";
import { isLocale, locales } from "@/i18n/routing";

import { getLocations, getTeachers } from "../_lib/data";
import type { Transmission } from "@prisma/client";

export const dynamic = "force-dynamic";

function filterHref(
  locale: string,
  language?: string,
  locationId?: string,
  transmission?: Transmission,
) {
  const query = new URLSearchParams();
  if (language) query.set("language", language);
  if (locationId) query.set("location", locationId);
  if (transmission) query.set("transmission", transmission);
  const suffix = query.toString();
  return `/${locale}/larare${suffix ? `?${suffix}` : ""}`;
}

export default async function LararePage(
  props: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ language?: string; location?: string; transmission?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const params = await props.params;
  if (!isLocale(params.locale)) return null;
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const locations = await getLocations();
  const language = locales.includes(searchParams.language as (typeof locales)[number])
    ? searchParams.language
    : undefined;
  const location = locations.some((item) => item.id === searchParams.location)
    ? searchParams.location
    : undefined;
  const transmission =
    searchParams.transmission === "MANUAL" ||
    searchParams.transmission === "AUTOMATIC"
      ? searchParams.transmission
      : undefined;
  const allTeachers = await getTeachers(
    params.locale,
    undefined,
    location,
    transmission,
  );
  const languageCounts = Object.fromEntries(
    locales.map((option) => [
      option,
      allTeachers.filter((teacher) => teacher.languages.includes(option)).length,
    ]),
  ) as Record<(typeof locales)[number], number>;
  const teachers = language
    ? allTeachers.filter((teacher) => teacher.languages.includes(language))
    : allTeachers;
  const hasActiveFilter = Boolean(language || location || transmission);
  const center = locations[0]
    ? { lat: locations[0].lat, lng: locations[0].lng }
    : { lat: 59.3293, lng: 18.0686 };

  return (
    <div className="section-shell">
      <div className="site-container">
        <PageHeader eyebrow={t("teachers.eyebrow")} title={t("teachers.title")} description={t("teachers.description")} />

        <section className="mt-10 overflow-hidden rounded-lg border border-border bg-card shadow-soft" aria-labelledby="language-filter">
          <div className="p-5 sm:p-6">
            <h2 id="language-filter" className="text-lg font-black">
              {t("teachers.languageQuestion")}
            </h2>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              {locales.map((option) => {
                const count = languageCounts[option];
                return (
                  <PillFilter
                    key={option}
                    label={`${t(`language.${option}`)} (${count})`}
                    value={option}
                    active={language === option}
                    disabled={count === 0}
                    title={count === 0 ? t("teachers.noneAvailable") : undefined}
                    href={filterHref(params.locale, option, location, transmission)}
                  />
                );
              })}
              <span className="ms-2 border-s border-border ps-4">
                <PillFilter
                  label={t("teachers.anyLanguage")}
                  value=""
                  active={!language}
                  href={filterHref(params.locale, undefined, location, transmission)}
                />
              </span>
            </div>
          </div>

          <div className="border-t border-border p-5 sm:p-6">
            <h3 className="text-sm font-bold">{t("teachers.locationFilter")}</h3>
            {locations.length <= 4 ? (
              <div className="mt-3 flex flex-wrap gap-1 rounded-md border border-border bg-page p-1">
                <Link
                  href={filterHref(params.locale, language, undefined, transmission)}
                  aria-current={!location ? "true" : undefined}
                  className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm px-4 text-center text-sm font-bold text-ink-muted transition aria-[current=true]:bg-card aria-[current=true]:text-ink aria-[current=true]:shadow-soft"
                >
                  {t("common.allLocations")}
                </Link>
                {locations.map((item) => (
                  <Link
                    key={item.id}
                    href={filterHref(params.locale, language, item.id, transmission)}
                    aria-current={location === item.id ? "true" : undefined}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-sm px-4 text-center text-sm font-bold text-ink-muted transition aria-[current=true]:bg-card aria-[current=true]:text-ink aria-[current=true]:shadow-soft"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            ) : (
              <form className="mt-3 flex items-end gap-3" action={`/${params.locale}/larare`}>
                {language ? <input type="hidden" name="language" value={language} /> : null}
                {transmission ? <input type="hidden" name="transmission" value={transmission} /> : null}
                <div className="min-w-0 flex-1">
                  <Select
                    label={t("teachers.locationFilter")}
                    id="location"
                    name="location"
                    defaultValue={location ?? ""}
                  >
                    <option value="">{t("common.allLocations")}</option>
                    {locations.map((item) => (
                      <option key={item.id} value={item.id}>{item.name}</option>
                    ))}
                  </Select>
                </div>
                <button className="min-h-11 rounded-sm border border-border bg-card px-4 font-bold">
                  {t("common.applyFilter")}
                </button>
              </form>
            )}
          </div>

          <div className="border-t border-border p-5 sm:p-6">
            <h3 className="text-sm font-bold">{t("teachers.transmissionFilter")}</h3>
            <div className="mt-3 grid grid-cols-3 gap-1 rounded-md border border-border bg-page p-1">
              {([
                [undefined, t("teachers.allTransmissions")],
                ["MANUAL", t("teacher.transmission.manual")],
                ["AUTOMATIC", t("teacher.transmission.automatic")],
              ] as const).map(([value, label]) => (
                <Link
                  key={value ?? "all"}
                  href={filterHref(params.locale, language, location, value)}
                  aria-current={transmission === value || (!transmission && !value) ? "true" : undefined}
                  className="inline-flex min-h-11 items-center justify-center rounded-sm px-2 text-center text-sm font-bold text-ink-muted transition aria-[current=true]:bg-card aria-[current=true]:text-ink aria-[current=true]:shadow-soft"
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
            <p className="text-sm font-semibold text-ink-muted">
              {t("teachers.resultCount", { count: teachers.length })}
            </p>
            {hasActiveFilter ? (
              <Link
                href={`/${params.locale}/larare`}
                className="inline-flex min-h-11 items-center font-bold underline underline-offset-4 md:min-h-0"
              >
                {t("teachers.clearFilters")}
              </Link>
            ) : null}
          </div>
        </section>

        <div className="mt-10 grid gap-8 lg:grid-cols-[.85fr_1.15fr]">
          <section id="teacher-results" aria-label={t("teachers.results")}>
            {teachers.length ? (
              <div className="grid gap-4">
                {teachers.map((teacher) => (
                  <TeacherCard
                    key={teacher.id}
                    locale={params.locale}
                    slug={teacher.slug}
                    name={`${teacher.user.firstName} ${teacher.user.lastName}`}
                    photoUrl={teacher.photoUrl}
                    languages={teacher.languages.map((item) => t(`language.${item}`))}
                    transmissions={teacher.transmissions.map((item) =>
                      t(`teacher.transmission.${item.toLowerCase()}`),
                    )}
                    locationNames={teacher.locations.map(({ location: item }) => item.name)}
                    experienceLabel={t("teacher.yearsExperience", {
                      count: teacher.yearsExperience,
                    })}
                    detailsLabel={t("teacher.viewProfile")}
                    demoLabel={teacher.slug === "sara-johansson" ? t("teacher.demoProfile") : undefined}
                    swedishOnly={teacher.swedishOnly}
                    swedishOnlyLabel={t("common.swedishOnly")}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                title={t("teachers.emptyTitle")}
                description={t("teachers.emptyDescription")}
              />
            )}
          </section>
          <section aria-label={t("map.title")} className="lg:sticky lg:top-24 lg:self-start">
            <TeacherMap
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
              center={center}
              markers={teachers.flatMap((teacher) =>
                teacher.locations.map(({ location }, index) => ({
                  id: `${teacher.id}-${index}`,
                  teacherId: teacher.id,
                  title: `${teacher.user.firstName} ${teacher.user.lastName}`,
                  position: { lat: location.lat, lng: location.lng },
                })),
              )}
              label={t("map.interactiveLabel")}
              missingKeyTitle={t("map.pendingKey")}
              fallbackHref="#teacher-results"
              fallbackLabel={t("teachers.showAsList")}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
