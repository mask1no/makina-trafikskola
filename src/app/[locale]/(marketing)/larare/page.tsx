import { getTranslations, setRequestLocale } from "next-intl/server";

import { EmptyState } from "@/components/EmptyState";
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
  const teachers = await getTeachers(
    params.locale,
    language,
    location,
    transmission,
  );
  const center = locations[0]
    ? { lat: locations[0].lat, lng: locations[0].lng }
    : { lat: 59.3293, lng: 18.0686 };

  return (
    <div className="px-4 py-12 sm:py-16">
      <div className="mx-auto max-w-7xl">
        <div className="max-w-3xl">
          <p className="text-sm font-bold uppercase tracking-wider text-ink-muted">
            {t("teachers.eyebrow")}
          </p>
          <h1 className="mt-2 text-4xl font-black sm:text-5xl">{t("teachers.title")}</h1>
          <p className="mt-4 text-lg leading-8 text-ink-muted">{t("teachers.description")}</p>
        </div>

        <section className="mt-8 rounded-md border border-border bg-card p-5" aria-labelledby="language-filter">
          <h2 id="language-filter" className="font-bold">{t("teachers.languageFilter")}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <PillFilter
              label={t("common.all")}
              value=""
              active={!language}
              href={filterHref(params.locale, undefined, location, transmission)}
            />
            {locales.map((option) => (
              <PillFilter
                key={option}
                label={t(`language.${option}`)}
                value={option}
                active={language === option}
                href={filterHref(params.locale, option, location, transmission)}
              />
            ))}
          </div>

          <form className="mt-5 max-w-sm" action={`/${params.locale}/larare`}>
            {language ? <input type="hidden" name="language" value={language} /> : null}
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
            <div className="mt-4">
              <Select
                label={t("teachers.transmissionFilter")}
                id="transmission"
                name="transmission"
                defaultValue={transmission ?? ""}
              >
                <option value="">{t("teachers.allTransmissions")}</option>
                <option value="MANUAL">{t("teacher.transmission.manual")}</option>
                <option value="AUTOMATIC">{t("teacher.transmission.automatic")}</option>
              </Select>
            </div>
            <button
              type="submit"
              className="mt-3 min-h-11 rounded-sm bg-surface px-5 font-bold text-ink-inverse"
            >
              {t("common.applyFilter")}
            </button>
          </form>
        </section>

        <div className="mt-8 grid gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <section aria-label={t("teachers.results")}>
            <p className="mb-4 text-sm font-semibold text-ink-muted">
              {t("teachers.resultCount", { count: teachers.length })}
            </p>
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
              missingKeyTitle={t("map.unavailableTitle")}
              missingKeyDescription={t("map.unavailableDescription")}
            />
          </section>
        </div>
      </div>
    </div>
  );
}
