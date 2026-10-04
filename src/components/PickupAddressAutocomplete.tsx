"use client";

import { APIProvider, useMapsLibrary } from "@vis.gl/react-google-maps";
import { useLocale } from "next-intl";
import { useEffect, useId, useRef, useState } from "react";

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
  const elementRef = useRef<google.maps.places.PlaceAutocompleteElement | null>(null);
  const valueRef = useRef(value);
  const labelId = useId();

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    valueRef.current = value;
  }, [value]);

  useEffect(() => {
    const host = hostRef.current;
    if (!places || !host) return;
    const autocomplete = new places.PlaceAutocompleteElement({
      includedRegionCodes: ["se"],
    });
    elementRef.current = autocomplete;
    autocomplete.id = "booking-pickup-address";
    autocomplete.name = "pickup-address";
    autocomplete.placeholder = label;
    autocomplete.value = valueRef.current;
    autocomplete.setAttribute("autocomplete", "street-address");
    autocomplete.setAttribute("aria-labelledby", labelId);
    autocomplete.requestedLanguage = document.documentElement.lang || "sv";
    autocomplete.requestedRegion = "se";
    autocomplete.className = "pickup-autocomplete-control";

    const typed = () => {
      onChangeRef.current(autocomplete.value, undefined);
    };

    const select = async (event: google.maps.places.PlacePredictionSelectEvent) => {
      try {
        const place = event.placePrediction.toPlace();
        await place.fetchFields({ fields: ["formattedAddress", "location"] });
        const location = place.location;
        if (!place.formattedAddress || !location) {
          onChangeRef.current(autocomplete.value, undefined);
          return;
        }
        onChangeRef.current(place.formattedAddress, {
          lat: location.lat(),
          lng: location.lng(),
        });
      } catch {
        reportMapFailure();
        onChangeRef.current(autocomplete.value, undefined);
      }
    };

    const error = () => {
      reportMapFailure();
      onChangeRef.current(autocomplete.value, undefined);
    };
    autocomplete.addEventListener("gmp-select", select);
    autocomplete.addEventListener("input", typed);
    autocomplete.addEventListener("gmp-error", error);
    host.replaceChildren(autocomplete);
    return () => {
      autocomplete.removeEventListener("gmp-select", select);
      autocomplete.removeEventListener("input", typed);
      autocomplete.removeEventListener("gmp-error", error);
      elementRef.current = null;
      autocomplete.remove();
    };
  }, [label, labelId, places, valueRef]);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;
    if (element.value !== value) {
      element.value = value;
    }
  }, [value]);

  return (
    <div className="grid gap-2">
      <label id={labelId} className="text-sm font-semibold">
        {label}
      </label>
      <div
        ref={hostRef}
        className="pickup-autocomplete-host min-h-11 rounded-sm border border-border bg-card text-base shadow-soft focus-within:border-ink"
      />
      <style jsx global>{`
        .pickup-autocomplete-host .pickup-autocomplete-control {
          display: block;
          min-height: 44px;
          direction: inherit;
        }
        .pickup-autocomplete-host .pickup-autocomplete-control::part(input) {
          min-height: 44px;
          border: 0;
          outline: 0;
          padding-inline: 0.75rem;
          font-size: 16px;
          background: transparent;
          color: var(--ink);
          direction: inherit;
          text-align: start;
        }
      `}</style>
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
          onChange={(event) => props.onChange(event.target.value, undefined)}
          autoComplete="street-address"
          dir="auto"
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
