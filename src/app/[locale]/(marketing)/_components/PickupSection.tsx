import Image from "next/image";

import { PickupAreaMaps } from "@/components/PickupAreaMaps";
import { SectionHeader } from "@/components/SectionHeader";

type PickupArea = {
  id: string;
  name: string;
  boundary: unknown;
  marker: { lat: number; lng: number };
};

export function PickupSection({
  eyebrow,
  title,
  description,
  areasLabel,
  imageAlt,
  mapLabel,
  imageExists,
  mapsConfig,
  pickupAreas,
}: {
  eyebrow: string;
  title: string;
  description: string;
  areasLabel: string;
  imageAlt: string;
  mapLabel: string;
  imageExists: boolean;
  mapsConfig: { apiKey?: string; mapId?: string };
  pickupAreas: PickupArea[];
}) {
  return (
    <section className="section-shell border-y border-border bg-card">
      <div className="site-container grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-center">
        <div>
          <SectionHeader eyebrow={eyebrow} title={title} intro={description} />
          <p className="mt-4 text-small font-bold text-ink-muted">{areasLabel}</p>
        </div>
        {imageExists ? (
          <div className="relative min-h-80 overflow-hidden rounded-lg">
            <Image
              src="/images/pickup-feature.png"
              alt={imageAlt}
              fill
              sizes="(min-width: 1024px) 58vw, 100vw"
              className="rtl-no-mirror object-cover"
            />
          </div>
        ) : (
          <PickupAreaMaps
            apiKey={mapsConfig.apiKey ?? ""}
            mapId={mapsConfig.mapId ?? ""}
            areas={pickupAreas}
            label={mapLabel}
          />
        )}
      </div>
    </section>
  );
}
