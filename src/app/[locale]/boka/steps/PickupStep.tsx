"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { ChoiceCard } from "@/components/ChoiceCard";
import { Input } from "@/components/Input";
import { boundaryRings } from "@/lib/areas/geo";

import type { Location, MeetMode } from "./state";

const PickupAddressAutocomplete = dynamic(
  () => import("@/components/PickupAddressAutocomplete"),
  { ssr: false },
);

const AreaOutlineMap = dynamic(() => import("@/components/AreaOutlineMap"), {
  ssr: false,
});

function Outline({ boundary, label }: { boundary: unknown; label: string }) {
  const rings = useMemo(() => boundaryRings(boundary), [boundary]);
  const points = rings.flat();
  if (!points.length) return null;
  const lngs = points.map((point) => point[0] ?? 0);
  const lats = points.map((point) => point[1] ?? 0);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const width = Math.max(maxLng - minLng, 0.01);
  const height = Math.max(maxLat - minLat, 0.01);
  const path = rings
    .map((ring) =>
      ring
        .map((point) => {
          const x = (((point[0] ?? 0) - minLng) / width) * 100;
          const y = (1 - ((point[1] ?? 0) - minLat) / height) * 100;
          return `${x},${y}`;
        })
        .join(" "),
    )
    .join(" ");
  return (
    <svg viewBox="0 0 100 100" className="h-48 w-full" role="img" aria-label={label}>
      <polygon
        points={path}
        fill="color-mix(in srgb, var(--accent) 35%, transparent)"
        stroke="var(--ink)"
      />
    </svg>
  );
}

export function PickupStep({
  area,
  meet,
  pickupAddress,
  pickupCoordinates,
  mapApiKey,
  mapId,
  onMeet,
  onPickupTyped,
  onPickupSelected,
}: {
  area: Location | undefined;
  meet: MeetMode;
  pickupAddress: string;
  pickupCoordinates: { lat: number; lng: number } | null;
  mapApiKey?: string;
  mapId?: string;
  onMeet: (mode: MeetMode) => void;
  onPickupTyped: (address: string) => void;
  onPickupSelected: (address: string, coordinates: { lat: number; lng: number }) => void;
}) {
  const t = useTranslations("booking");
  const showHint = meet === "pickup" && pickupAddress.trim().length > 0 && !pickupCoordinates;
  const [mapFailed, setMapFailed] = useState(false);
  const failMap = useCallback(() => setMapFailed(true), []);
  const hasBoundary = useMemo(() => boundaryRings(area?.boundary).length > 0, [area?.boundary]);
  const showMap = Boolean(mapApiKey && mapId) && !mapFailed && hasBoundary;
  return (
    <section>
      <h2 className="text-h2 font-black">{t("step.pickup.title")}</h2>
      <p className="mt-2 text-ink-muted">{t("step.pickup.free")}</p>
      <div className="mt-5 overflow-hidden rounded-md border border-[var(--line)] bg-card shadow-soft">
        {showMap ? (
          <AreaOutlineMap
            apiKey={mapApiKey ?? ""}
            mapId={mapId ?? ""}
            boundary={area?.boundary}
            label={t("step.pickup.outline")}
            marker={pickupCoordinates}
            onFailure={failMap}
          />
        ) : (
          <Outline boundary={area?.boundary} label={t("step.pickup.outline")} />
        )}
      </div>
      {area?.officeAddress ? (
        <div className="mt-4">
          <ChoiceCard selected={meet === "office"} onClick={() => onMeet("office")}>
            <span className="block">{t("step.pickup.office")}</span>
            <span className="mt-1 block text-small font-semibold">{area.officeAddress}</span>
          </ChoiceCard>
        </div>
      ) : null}
      <div className="mt-4">
        <ChoiceCard selected={meet === "pickup"} onClick={() => onMeet("pickup")}>
          {t("step.where.pickup")}
        </ChoiceCard>
      </div>
      {meet === "pickup" ? (
        <div className="mt-5">
          {mapApiKey ? (
            <PickupAddressAutocomplete
              apiKey={mapApiKey}
              label={t("step.pickup.address")}
              value={pickupAddress}
              onChange={(value, coordinates) => {
                if (coordinates) {
                  onPickupSelected(value, coordinates);
                  return;
                }
                onPickupTyped(value);
              }}
            />
          ) : (
            <Input
              label={t("step.pickup.address")}
              value={pickupAddress}
              onChange={(event) => onPickupTyped(event.target.value)}
              autoComplete="street-address"
            />
          )}
          {showHint ? (
            <p className="mt-2 text-small leading-6 text-ink-muted">{t("step.where.selectFromList")}</p>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
