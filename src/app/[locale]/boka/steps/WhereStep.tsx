"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";

import { Input } from "@/components/Input";
import { Select } from "@/components/Select";

import type { Location, PlaceMode } from "./state";

const PickupAddressAutocomplete = dynamic(
  () => import("@/components/PickupAddressAutocomplete"),
  { ssr: false },
);

export function WhereStep({
  locations,
  placeMode,
  locationId,
  pickupAddress,
  mapApiKey,
  onPlaceMode,
  onLocationId,
  onPickup,
}: {
  locations: Location[];
  placeMode: PlaceMode;
  locationId: string;
  pickupAddress: string;
  mapApiKey?: string;
  onPlaceMode: (mode: PlaceMode) => void;
  onLocationId: (id: string) => void;
  onPickup: (address: string, coordinates: { lat: number; lng: number } | null) => void;
}) {
  const t = useTranslations("booking");
  return (
    <section>
      <h2 className="text-3xl font-black">{t("step.where.title")}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(["school", "pickup"] as const).map((mode) => (
          <button
            type="button"
            key={mode}
            onClick={() => onPlaceMode(mode)}
            aria-pressed={placeMode === mode}
            className={`min-h-24 break-words hyphens-auto border-b px-1 py-5 text-start font-bold transition ${
              placeMode === mode
                ? "border-ink"
                : "border-border hover:border-ink-muted"
            }`}
          >
            {t(`step.where.${mode}`)}
          </button>
        ))}
      </div>
      {placeMode === "school" ? (
        <div className="mt-5">
          <Select
            label={t("step.where.location")}
            id="booking-location"
            value={locationId}
            onChange={(event) => onLocationId(event.target.value)}
          >
            {locations.map((location) => (
              <option value={location.id} key={location.id}>
                {location.name}
              </option>
            ))}
          </Select>
        </div>
      ) : (
        <div className="mt-5">
          {mapApiKey ? (
            <PickupAddressAutocomplete
              apiKey={mapApiKey}
              label={t("step.where.address")}
              value={pickupAddress}
              onChange={(value, coordinates) => {
                onPickup(value, coordinates ?? null);
              }}
            />
          ) : (
            <Input
              label={t("step.where.address")}
              value={pickupAddress}
              onChange={(event) => {
                onPickup(event.target.value, null);
              }}
              autoComplete="street-address"
            />
          )}
        </div>
      )}
    </section>
  );
}
