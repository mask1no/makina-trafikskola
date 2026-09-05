"use client";

import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useEffect, useRef } from "react";

type Coordinates = { lat: number; lng: number };

type Props = {
  apiKey: string;
  label: string;
  value: string;
  onChange: (value: string, coordinates?: Coordinates) => void;
};

function PlacesInput({ label, value, onChange }: Omit<Props, "apiKey">) {
  const places = useMapsLibrary("places");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!places || !inputRef.current) return;
    const autocomplete = new places.Autocomplete(inputRef.current, {
      componentRestrictions: { country: "se" },
      fields: ["formatted_address", "geometry"],
      types: ["address"],
    });
    const listener = autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      const location = place.geometry?.location;
      if (!place.formatted_address || !location) return;
      onChange(place.formatted_address, {
        lat: location.lat(),
        lng: location.lng(),
      });
    });
    return () => listener.remove();
  }, [onChange, places]);

  return (
    <div className="grid gap-2">
      <label htmlFor="booking-pickup-address" className="text-sm font-semibold">
        {label}
      </label>
      <input
        ref={inputRef}
        id="booking-pickup-address"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        autoComplete="street-address"
        className="min-h-11 w-full rounded-sm border border-border bg-card px-4 text-ink"
      />
    </div>
  );
}

export default function PickupAddressAutocomplete(props: Props) {
  return (
    <APIProvider apiKey={props.apiKey}>
      <PlacesInput
        label={props.label}
        value={props.value}
        onChange={props.onChange}
      />
    </APIProvider>
  );
}
