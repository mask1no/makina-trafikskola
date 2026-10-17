import Link from "next/link";

import { LazyTeacherMap } from "@/components/LazyTeacherMap";
import { SectionHeader } from "@/components/SectionHeader";
import type { TeacherMarker } from "@/components/GoogleMapClient";
import type { MapArea } from "@/lib/maps/area-style";
import type { Locale } from "@/i18n/routing";

export function TeachersMapSection({
  locale,
  canBook,
  eyebrow,
  title,
  description,
  languageLabel,
  offeredLanguages,
  languageNames,
  cta,
  mapLabel,
  unavailableTitle,
  unavailableDescription,
  mapsConfig,
  mapCenter,
  mapMarkers,
  mapAreas,
}: {
  locale: Locale;
  canBook: boolean;
  eyebrow: string;
  title: string;
  description: string;
  languageLabel: string;
  offeredLanguages: string[];
  languageNames: Record<string, string>;
  cta: string;
  mapLabel: string;
  unavailableTitle: string;
  unavailableDescription: string;
  mapsConfig: { apiKey?: string; mapId?: string };
  mapCenter: { lat: number; lng: number };
  mapMarkers: TeacherMarker[];
  mapAreas: MapArea[];
}) {
  return (
    <section className="section-shell">
      <div className="site-container">
        <div className="grid gap-8 lg:grid-cols-2 lg:items-stretch">
          <div className="flex flex-col justify-center">
            <SectionHeader eyebrow={eyebrow} title={title} intro={description} />
            <nav
              className="mt-6 flex flex-wrap gap-2"
              aria-label={languageLabel}
            >
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
            <Link
              href={`/${locale}/larare`}
              className="mt-6 inline-flex min-h-11 w-fit items-center justify-center rounded-sm bg-accent px-5 font-bold text-accent-ink transition hover:bg-accent-hover"
            >
              {cta}
            </Link>
          </div>
          <div className="h-[280px] w-full lg:h-full lg:min-h-[280px]">
            <LazyTeacherMap
              apiKey={mapsConfig.apiKey}
              mapId={mapsConfig.mapId}
              bookingAvailable={canBook}
              center={mapCenter}
              label={mapLabel}
              missingKeyTitle={unavailableTitle}
              missingKeyDescription={unavailableDescription}
              fallbackHref={`/${locale}/larare`}
              fallbackLabel={cta}
              markers={mapMarkers}
              areas={mapAreas}
              variant="home"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
