import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { PillFilter } from "@/components/PillFilter";
import { Select } from "@/components/Select";
import { TeacherCard } from "@/components/TeacherCard";
import { SelectableTeacherMap } from "@/components/SelectableTeacherMap";
import { isLocale, locales } from "@/i18n/routing";
import { bookingEnabled, instructorsEnabled } from "@/lib/launch";

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
  if (!instructorsEnabled()) notFound();
  const canBook = bookingEnabled();
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
        <PageHeader
          eyebrow={t("teachers.eyebrow")}
          title={t("teachers.title")}
          description={t("teachers.description")}
        />

        <section className="mt-12" aria-labelledby="language-filter">
          <h2 id="language-filter" className="text-2xl font-black tracking-tight sm:text-3xl">
            {t("teachers.languageQuestion")}
          </h2>
          <div className="mt-6 flex flex-wrap gap-2">
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
            <PillFilter
              label={t("teachers.anyLanguage")}
              value=""
              active={!language}
              href={filterHref(params.locale, undefined, location, transmission)}
            />
          </div>

          <div className="mt-10 grid gap-8 border-t border-border pt-8 md:grid-cols-2">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("teachers.locationFilter")}
              </h3>
              {locations.length <= 4 ? (
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                  <Link
                    href={filterHref(params.locale, language, undefined, transmission)}
                    aria-current={!location ? "true" : undefined}
                    className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm font-bold text-ink-muted transition aria-[current=true]:border-ink aria-[current=true]:text-ink"
                  >
                    {t("common.allLocations")}
                  </Link>
                  {locations.map((item) => (
                    <Link
                      key={item.id}
                      href={filterHref(params.locale, language, item.id, transmission)}
                      aria-current={location === item.id ? "true" : undefined}
                      className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm font-bold text-ink-muted transition aria-[current=true]:border-ink aria-[current=true]:text-ink"
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              ) : (
                <form className="mt-4 flex items-end gap-3" action={`/${params.locale}/larare`}>
                  {language ? <input type="hidden" name="language" value={language} /> : null}
                  {transmission ? (
                    <input type="hidden" name="transmission" value={transmission} />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <Select
                      label={t("teachers.locationFilter")}
                      id="location"
                      name="location"
                      defaultValue={location ?? ""}
                    >
                      <option value="">{t("common.allLocations")}</option>
                      {locations.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </Select>
                  </div>
                  <button className="min-h-11 rounded-sm border border-border bg-card px-4 font-bold">
                    {t("common.applyFilter")}
                  </button>
                </form>
              )}
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("teachers.transmissionFilter")}
              </h3>
              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2">
                {(
                  [
                    [undefined, t("teachers.allTransmissions")],
                    ["MANUAL", t("teacher.transmission.manual")],
                    ["AUTOMATIC", t("teacher.transmission.automatic")],
                  ] as const
                ).map(([value, label]) => (
                  <Link
                    key={value ?? "all"}
                    href={filterHref(params.locale, language, location, value)}
                    aria-current={
                      transmission === value || (!transmission && !value)
                        ? "true"
                        : undefined
                    }
                    className="inline-flex min-h-11 items-center border-b-2 border-transparent text-sm font-bold text-ink-muted transition aria-[current=true]:border-ink aria-[current=true]:text-ink"
                  >
                    {label}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-muted">
              {t("teachers.resultCount", { count: teachers.length })}
            </p>
            {hasActiveFilter ? (
              <Link
                href={`/${params.locale}/larare`}
                className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
              >
                {t("teachers.clearFilters")}
              </Link>
            ) : null}
          </div>
        </section>

        <div className="mt-10 grid gap-10 lg:grid-cols-[.9fr_1.1fr]">
          <section id="teacher-results" aria-label={t("teachers.results")} className="order-2 lg:order-1">
            {teachers.length ? (
              <div className="grid gap-8">
                {teachers.map((teacher) => (
                  <TeacherCard
                    key={teacher.id}
                    cardId={`teacher-${teacher.id}`}
                    locale={params.locale}
                    slug={teacher.slug}
                    name={`${teacher.user.firstName} ${teacher.user.lastName}`}
                    photoUrl={teacher.photoUrl}
                    languages={teacher.languages.map((item) => t(`language.${item}`))}
                    transmissions={teacher.transmissions.map((item) =>
                      t(`teacher.transmission.${item.toLowerCase()}`),
                    )}
                    locationNames={teacher.locations.map(
                      ({ location: item }) => item.name,
                    )}
                    experienceLabel={t("teacher.yearsExperience", {
                      count: teacher.yearsExperience,
                    })}
                    detailsLabel={t("teacher.viewProfile")}
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
          <section
            aria-label={t("map.title")}
            className="order-1 lg:sticky lg:top-24 lg:order-2 lg:self-start"
          >
            <SelectableTeacherMap
              apiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_KEY}
              bookingAvailable={canBook}
              center={center}
              markers={teachers.flatMap((teacher) =>
                teacher.locations.map(({ location }, index) => ({
                  id: `${teacher.id}-${index}`,
                  teacherId: teacher.id,
                  title: `${teacher.user.firstName} ${teacher.user.lastName}`,
                  position: { lat: location.lat, lng: location.lng },
                  photoUrl: teacher.photoUrl,
                  languages: teacher.languages.map((item) => t(`language.${item}`)),
                  transmission: teacher.transmissions
                    .map((item) => t(`teacher.transmission.${item.toLowerCase()}`))
                    .join(", "),
                  locationName: location.name,
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
