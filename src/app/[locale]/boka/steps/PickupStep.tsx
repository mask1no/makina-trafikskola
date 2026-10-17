"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Input } from "@/components/Input";
import { boundaryRings, pointInGeoJson } from "@/lib/areas/geo";

import type { Location } from "./state";

const PickupAddressAutocomplete = dynamic(
  () => import("@/components/PickupAddressAutocomplete"),
  { ssr: false },
);

const PickupMapModal = dynamic(() => import("@/components/PickupMapModal"), {
  ssr: false,
});

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
        fill="color-mix(in srgb, var(--success-strong) 40%, transparent)"
        stroke="var(--ink)"
        strokeWidth="0.5"
      />
    </svg>
  );
}

export function PickupStep({
  area,
  locations,
  pickupAddress,
  pickupCoordinates,
  mapApiKey,
  mapId,
  onPickupTyped,
  onPickupSelected,
}: {
  area: Location | undefined;
  locations: Location[];
  pickupAddress: string;
  pickupCoordinates: { lat: number; lng: number } | null;
  mapApiKey?: string;
  mapId?: string;
  onPickupTyped: (address: string) => void;
  /** areaId is set when the point lies inside an active location's boundary. */
  onPickupSelected: (
    address: string,
    coordinates: { lat: number; lng: number },
    areaId?: string,
  ) => void;
}) {
  const t = useTranslations("booking");
  const shell = useTranslations("shell");
  const showHint = pickupAddress.trim().length > 0 && !pickupCoordinates;
  const [mapFailed, setMapFailed] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const failMap = useCallback(() => setMapFailed(true), []);
  const closeModal = useCallback(() => setModalOpen(false), []);
  const confirmPickup = useCallback(
    (address: string, coordinates: { lat: number; lng: number }, areaId: string) => {
      onPickupSelected(address, coordinates, areaId);
      setModalOpen(false);
    },
    [onPickupSelected],
  );
  const canPickOnMap = locations.some(
    (location) =>
      location.status === "ACTIVE" && boundaryRings(location.boundary).length > 0,
  );
  const hasBoundary = useMemo(() => boundaryRings(area?.boundary).length > 0, [area?.boundary]);
  const canLoadMap = Boolean(mapApiKey && mapId) && !mapFailed && hasBoundary;
  return (
    <section>
      <h2 className="text-h2 font-black">{t("step.pickup.title")}</h2>
      <p className="mt-2 text-ink-muted">{t("step.pickup.free")}</p>
      <div className="mt-5 overflow-hidden rounded-md border border-[var(--line)] bg-card shadow-soft">
        {canLoadMap && mapLoaded ? (
          <AreaOutlineMap
            apiKey={mapApiKey ?? ""}
            mapId={mapId ?? ""}
            boundary={area?.boundary}
            label={t("step.pickup.outline")}
            marker={pickupCoordinates}
            onFailure={failMap}
          />
        ) : (
          <div className="grid justify-items-center p-4">
            <Outline boundary={area?.boundary} label={t("step.pickup.outline")} />
            {canLoadMap ? (
              <>
                <p className="mt-2 text-center text-small leading-6 text-ink-muted">
                  {shell("mapPrivacy")}
                </p>
                <button
                  type="button"
                  className="mt-3 inline-flex min-h-11 items-center rounded-sm bg-surface px-5 font-bold text-ink-inverse"
                  onClick={() => setMapLoaded(true)}
                >
                  {shell("showMap")}
                </button>
              </>
            ) : null}
          </div>
        )}
      </div>
      <div className="mt-5">
        {mapApiKey ? (
          <PickupAddressAutocomplete
            apiKey={mapApiKey}
            label={t("step.pickup.address")}
            value={pickupAddress}
            onChange={(value, coordinates) => {
              if (coordinates) {
                onPickupSelected(
                  value,
                  coordinates,
                  locations.find(
                    (location) =>
                      location.status === "ACTIVE" &&
                      pointInGeoJson(coordinates, location.boundary),
                  )?.id,
                );
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
        {canPickOnMap ? (
          <button
            type="button"
            className="mt-3 inline-flex min-h-11 items-center rounded-sm bg-surface px-5 font-bold text-ink-inverse"
            onClick={() => setModalOpen(true)}
          >
            {t("step.pickup.map.open")}
          </button>
        ) : null}
        {mapApiKey ? (
          <p className="mt-2 text-small leading-6 text-ink-muted">
            {shell("mapPrivacy")}
          </p>
        ) : null}
        {showHint ? (
          <p className="mt-2 text-small leading-6 text-ink-muted">{t("step.where.selectFromList")}</p>
        ) : null}
      </div>
      {modalOpen && canPickOnMap ? (
        <PickupMapModal
          apiKey={mapApiKey ?? ""}
          mapId={mapId ?? ""}
          areas={locations}
          initialAreaId={area?.id}
          initialPoint={pickupCoordinates}
          initialAddress={pickupAddress}
          onConfirm={confirmPickup}
          onClose={closeModal}
          onFailure={failMap}
        />
      ) : null}
    </section>
  );
}
