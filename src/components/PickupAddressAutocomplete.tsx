"use client";

import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useLocale } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { reportMapFailure } from "@/lib/maps/report-failure";

type Coordinates = { lat: number; lng: number };

type Props = {
  apiKey: string;
  label: string;
  value: string;
  onChange: (value: string, coordinates?: Coordinates) => void;
};

function PlacesInput({ label, value, onChange }: Omit<Props, "apiKey">) {
  const places = useMapsLibrary("places");
  const hostRef = useRef<HTMLDivElement>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const host = hostRef.current;
    if (!places || !host) return;
    const autocomplete = new places.PlaceAutocompleteElement({
      includedRegionCodes: ["se"],
    });
    autocomplete.id = "booking-pickup-address";
    autocomplete.setAttribute("autocomplete", "street-address");
    const select = async (event: google.maps.places.PlacePredictionSelectEvent) => {
      const place = event.placePrediction.toPlace();
      await place.fetchFields({ fields: ["formattedAddress", "location"] });
      const location = place.location;
      if (!place.formattedAddress || !location) return;
      onChangeRef.current(place.formattedAddress, {
        lat: location.lat(),
        lng: location.lng(),
      });
    };
    autocomplete.addEventListener("gmp-select", select);
    host.replaceChildren(autocomplete);
    return () => {
      autocomplete.removeEventListener("gmp-select", select);
      autocomplete.remove();
    };
  }, [places]);

  return (
    <div className="grid gap-2">
      <label htmlFor="booking-pickup-address" className="text-sm font-semibold">
        {label}
      </label>
      <div ref={hostRef} data-initial-value={value} />
    </div>
  );
}

export default function PickupAddressAutocomplete(props: Props) {
  const locale = useLocale();
  const [loadFailed, setLoadFailed] = useState(false);

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      reportMapFailure();
      setLoadFailed(true);
    };
    return () => {
      window.gm_authFailure = previous;
    };
  }, []);

  if (loadFailed) {
    return (
      <div className="grid gap-2">
        <label htmlFor="booking-pickup-address" className="text-sm font-semibold">
          {props.label}
        </label>
        <input
          id="booking-pickup-address"
          value={props.value}
          onChange={(event) => props.onChange(event.target.value)}
          autoComplete="street-address"
          className="min-h-11 rounded-sm border border-border bg-card px-3 text-base text-ink"
        />
      </div>
    );
  }

  return (
    <APIProvider
      apiKey={props.apiKey}
      language={locale}
      region="SE"
      onError={() => {
        reportMapFailure();
        setLoadFailed(true);
      }}
    >
      <PlacesInput
        label={props.label}
        value={props.value}
        onChange={props.onChange}
      />
    </APIProvider>
  );
}
