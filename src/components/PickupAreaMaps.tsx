"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import { StaticMapArtwork } from "@/components/StaticMapArtwork";

const AreaOutlineMap = dynamic(() => import("@/components/AreaOutlineMap"), {
  ssr: false,
});

type PickupArea = {
  id: string;
  name: string;
  boundary: unknown;
  marker: { lat: number; lng: number };
};

export function PickupAreaMaps({
  apiKey,
  mapId,
  areas,
  label,
}: {
  apiKey: string;
  mapId: string;
  areas: PickupArea[];
  label: string;
}) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {areas.map((area) => (
        <figure key={area.id} className="overflow-hidden rounded-md border border-border bg-page">
          {apiKey && mapId && area.boundary && !failed ? (
            <AreaOutlineMap
              apiKey={apiKey}
              mapId={mapId}
              boundary={area.boundary}
              marker={area.marker}
              label={`${label}: ${area.name}`}
              onFailure={() => setFailed(true)}
            />
          ) : (
            <div className="relative h-72 rtl-no-mirror">
              <StaticMapArtwork className="absolute inset-0 size-full" />
            </div>
          )}
          <figcaption className="px-4 py-3 text-small font-extrabold">{area.name}</figcaption>
        </figure>
      ))}
    </div>
  );
}
