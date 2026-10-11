import Link from "next/link";

import { LazyTeacherMap } from "@/components/LazyTeacherMap";
import { SectionHeader } from "@/components/SectionHeader";
import { StaticMapArtwork } from "@/components/StaticMapArtwork";
import { TeacherCard } from "@/components/TeacherCard";
import type { TeacherMarker } from "@/components/GoogleMapClient";
import type { Locale } from "@/i18n/routing";

type TeacherCardData = {
  id: string;
  name: string;
  photoUrl: string | null;
  languages: string[];
  transmissions: string[];
  locationNames: string[];
  experienceLabel: string;
  nextFreeTime?: string;
  swedishOnly: boolean;
};

export function TeachersMapSection({
  locale,
  canBook,
  eyebrow,
  title,
  description,
  languageLabel,
  offeredLanguages,
  languageNames,
  teachers,
  nextFreeLabel,
  swedishOnlyLabel,
  mapTitle,
  mapDescription,
  mapPrivacy,
  mapCta,
  mapLabel,
  unavailableTitle,
  unavailableDescription,
  mapsConfig,
  mapCenter,
  mapMarkers,
}: {
  locale: Locale;
  canBook: boolean;
  eyebrow: string;
  title: string;
  description: string;
  languageLabel: string;
  offeredLanguages: string[];
  languageNames: Record<string, string>;
  teachers: TeacherCardData[];
  nextFreeLabel: string;
  swedishOnlyLabel: string;
  mapTitle: string;
  mapDescription: string;
  mapPrivacy: string;
  mapCta: string;
  mapLabel: string;
  unavailableTitle: string;
  unavailableDescription: string;
  mapsConfig: { apiKey?: string; mapId?: string };
  mapCenter: { lat: number; lng: number };
  mapMarkers: TeacherMarker[];
}) {
  return (
    <section className="section-shell">
      <div className="site-container">
        <SectionHeader eyebrow={eyebrow} title={title} intro={description} />
        <nav className="mt-8 flex flex-wrap gap-2" aria-label={languageLabel}>
          {offeredLanguages.map((language) => (
            <Link
              key={language}
              href={`/${locale}/larare?language=${language}`}
              lang={language}
              className="inline-flex min-h-11 items-center rounded-full border border-[var(--line)] bg-card px-4 text-small font-bold shadow-soft transition duration-150 hover:border-[var(--line-hover)]"
            >
              {languageNames[language]}
            </Link>
          ))}
        </nav>
        <div className="mt-8 grid gap-3 sm:grid-cols-2">
          {teachers.map((teacher) => (
            <TeacherCard
              key={teacher.id}
              name={teacher.name}
              photoUrl={teacher.photoUrl}
              languages={teacher.languages}
              transmissions={teacher.transmissions}
              locationNames={teacher.locationNames}
              experienceLabel={teacher.experienceLabel}
              nextFreeLabel={nextFreeLabel}
              nextFreeTime={teacher.nextFreeTime}
              swedishOnly={teacher.swedishOnly}
              swedishOnlyLabel={swedishOnlyLabel}
            />
          ))}
        </div>
        <div className="mt-10 grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-center">
          <div>
            <h3 className="text-2xl font-black">{mapTitle}</h3>
            <p className="mt-3 max-w-[70ch] text-body leading-7 text-ink-muted">
              {mapDescription}
            </p>
            <Link
              href={`/${locale}/larare`}
              className="mt-4 inline-flex min-h-11 items-center font-bold underline underline-offset-4"
            >
              {mapCta}
            </Link>
          </div>
          {mapsConfig.apiKey && mapsConfig.mapId && mapMarkers.length ? (
            <LazyTeacherMap
              apiKey={mapsConfig.apiKey}
              mapId={mapsConfig.mapId}
              bookingAvailable={canBook}
              center={mapCenter}
              label={mapLabel}
              loadDescription={mapPrivacy}
              missingKeyTitle={unavailableTitle}
              missingKeyDescription={unavailableDescription}
              fallbackHref={`/${locale}/larare`}
              fallbackLabel={mapCta}
              markers={mapMarkers}
            />
          ) : (
            <Link
              href={`/${locale}/larare`}
              className="group relative min-h-[22rem] overflow-hidden rounded-md bg-surface text-ink-inverse"
              aria-label={mapCta}
            >
              <StaticMapArtwork className="absolute inset-0 size-full" />
              <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_5%,transparent)_0%,var(--surface)_92%)]" />
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
