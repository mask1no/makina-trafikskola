import Link from "next/link";

import { HomeAreaSearch } from "@/components/GoogleMapClient";
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
  focusSlug,
  reviewsTitle,
  reviewsBody,
  reviewsCta,
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
  focusSlug?: string;
  reviewsTitle: string;
  reviewsBody: string;
  reviewsCta: string;
}) {
  return (
    <section id="hitta-larare" className="section-shell scroll-mt-28 border-t border-[var(--line)]">
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
                  className="inline-flex min-h-11 items-center rounded-full border border-ink bg-card px-4 text-small font-bold shadow-soft transition duration-150 hover:bg-page"
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
          <div className="grid gap-3">
          <HomeAreaSearch apiKey={mapsConfig.apiKey} areas={mapAreas} />
          <div className="min-h-[280px] w-full">
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
              focusSlug={focusSlug}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            {mapAreas.map((area) => (
              <Link
                key={area.id}
                href={area.slug ? `/${locale}?omrade=${area.slug}#hitta-larare` : `/${locale}#hitta-larare`}
                aria-current={focusSlug && area.slug === focusSlug ? "true" : undefined}
                className="flex min-h-16 items-center justify-center rounded-md border border-border bg-card px-4 text-center font-black shadow-soft aria-[current=true]:border-ink"
              >
                {area.name}
              </Link>
            ))}
          </div>
          <a
            href="https://www.google.com/maps/search/?api=1&query=Makina%20Trafikskola%20Centralv%C3%A4gen%205%20Upplands%20V%C3%A4sby"
            target="_blank"
            rel="noreferrer"
            className="flex min-h-16 items-center justify-between gap-3 rounded-md border border-border bg-card px-4 py-3 shadow-soft"
          >
            <span>
              <span className="block font-black">{reviewsTitle}</span>
              <span className="text-small text-ink-muted">{reviewsBody}</span>
            </span>
            <span className="text-small font-bold">{reviewsCta}</span>
          </a>
          </div>
        </div>
      </div>
    </section>
  );
}
