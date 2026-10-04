import { getTranslations, setRequestLocale } from "next-intl/server";
import Link from "next/link";
import { notFound } from "next/navigation";

import { EmptyState } from "@/components/EmptyState";
import { PageHeader } from "@/components/PageHeader";
import { Select } from "@/components/Select";
import { TeacherCard } from "@/components/TeacherCard";
import { SelectableTeacherMap } from "@/components/SelectableTeacherMap";
import { isLocale } from "@/i18n/routing";
import {
  isTeachingLanguage,
  TEACHING_LANGUAGES,
  type TeachingLanguage,
} from "@/lib/teachers/languages";
import { activeTeacherLanguages } from "@/lib/teachers/query";
import { bookingEnabled, instructorsEnabled } from "@/lib/launch";
import { googleMapsBrowserConfig } from "@/lib/maps/config";

import { getLocations, getTeachers } from "../_lib/data";
import type { Transmission } from "@prisma/client";

export const dynamic = "force-dynamic";

function FilterChoice({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: string;
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "true" : undefined}
      className="inline-flex min-h-11 items-center rounded-full border border-border bg-page px-3 text-sm font-bold text-ink transition duration-200 ease-premium hover:border-ink aria-[current=true]:border-ink aria-[current=true]:bg-surface aria-[current=true]:text-ink-inverse"
    >
      {children}
    </Link>
  );
}

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
  const mapsConfig = googleMapsBrowserConfig();
  setRequestLocale(params.locale);
  const t = await getTranslations();
  const [locations, activeLanguages] = await Promise.all([
    getLocations(),
    activeTeacherLanguages(),
  ]);
  const language = isTeachingLanguage(searchParams.language ?? "")
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
    TEACHING_LANGUAGES.map((option) => [
      option,
      allTeachers.filter((teacher) => teacher.languages.includes(option)).length,
    ]),
  ) as Record<TeachingLanguage, number>;
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

        <section className="mt-12 rounded-lg border border-border bg-card p-5 shadow-soft sm:p-6" aria-label={t("teachers.languageQuestion")}>
          <div className="grid gap-8 lg:grid-cols-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("teachers.languageFilter")}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                <FilterChoice
                  href={filterHref(params.locale, undefined, location, transmission)}
                  active={!language}
                >
                  {t("teachers.anyLanguage")}
                </FilterChoice>
                {activeLanguages.map((option) => {
                  const count = languageCounts[option];
                  const name = `${t(`language.${option}`)} (${count})`;
                  return (
                    <FilterChoice
                      key={option}
                      href={filterHref(params.locale, option, location, transmission)}
                      active={language === option}
                    >
                      {name}
                    </FilterChoice>
                  );
                })}
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-ink-muted">
                {t("teachers.locationFilter")}
              </h3>
              {locations.length <= 4 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <FilterChoice
                    href={filterHref(params.locale, language, undefined, transmission)}
                    active={!location}
                  >
                    {t("common.allLocations")}
                  </FilterChoice>
                  {locations.map((item) => (
                    <FilterChoice
                      key={item.id}
                      href={filterHref(params.locale, language, item.id, transmission)}
                      active={location === item.id}
                    >
                      {item.name}
                    </FilterChoice>
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
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    [undefined, t("teachers.allTransmissions")],
                    ["MANUAL", t("teacher.transmission.manual")],
                    ["AUTOMATIC", t("teacher.transmission.automatic")],
                  ] as const
                ).map(([value, choiceLabel]) => (
                  <FilterChoice
                    key={value ?? "all"}
                    href={filterHref(params.locale, language, location, value)}
                    active={transmission === value || (!transmission && !value)}
                  >
                    {choiceLabel}
                  </FilterChoice>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm font-semibold text-ink-muted">
              {t("teachers.resultCount", { count: teachers.length, n: String(teachers.length) })}
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
                    experienceLabel={
                      teacher.yearsExperience > 0
                        ? t("teacher.yearsExperience", {
                            count: teacher.yearsExperience,
                            n: String(teacher.yearsExperience),
                          })
                        : ""
                    }
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
            <div className="mb-3 rounded-md border border-border bg-card p-4 shadow-soft">
              <p className="text-sm font-bold">{t("map.interactionTitle")}</p>
              <p className="mt-1 text-sm leading-6 text-ink-muted">
                {t("map.interactionHint")}
              </p>
            </div>
            <SelectableTeacherMap
              apiKey={mapsConfig.apiKey}
              mapId={mapsConfig.mapId}
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
