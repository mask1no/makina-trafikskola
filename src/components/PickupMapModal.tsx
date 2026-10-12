"use client";

import {
  APIProvider,
  Map,
  useMap,
  useMapsLibrary,
} from "@vis.gl/react-google-maps";
import { useLocale, useTranslations } from "next-intl";
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { Button } from "@/components/Button";
import { boundaryLatLngs, pointInGeoJson } from "@/lib/areas/geo";
import { reportMapFailure } from "@/lib/maps/report-failure";

type Coordinates = { lat: number; lng: number };

export type PickupMapArea = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMING_SOON";
  lat: number;
  lng: number;
  boundary: unknown;
};

type Props = {
  apiKey: string;
  mapId: string;
  areas: PickupMapArea[];
  /** Area the map opens on when there is no earlier pickup point. */
  initialAreaId?: string;
  initialPoint?: Coordinates | null;
  initialAddress?: string;
  onConfirm: (address: string, coordinates: Coordinates, areaId: string) => void;
  onClose: () => void;
  onFailure: () => void;
};

const STOCKHOLM: Coordinates = { lat: 59.3293, lng: 18.0686 };

function cssColour(name: string) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function AreaPolygons({
  areas,
  initialAreaId,
  fitInitial,
}: {
  areas: PickupMapArea[];
  initialAreaId?: string;
  fitInitial: boolean;
}) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (!map) return;
    const stroke = cssColour("--ink");
    const fill = cssColour("--success-strong");
    const polygons: google.maps.Polygon[] = [];
    for (const area of areas) {
      for (const path of boundaryLatLngs(area.boundary)) {
        polygons.push(
          new google.maps.Polygon({
            paths: path,
            map,
            strokeColor: stroke,
            strokeWeight: 1,
            strokeOpacity: 0.9,
            fillColor: fill,
            fillOpacity: 0.35,
            clickable: false,
          }),
        );
      }
    }
    if (fitInitial && !fitted.current) {
      fitted.current = true;
      const target = areas.find((area) => area.id === initialAreaId) ?? areas[0];
      const rings = target ? boundaryLatLngs(target.boundary) : [];
      if (rings.length) {
        const bounds = new google.maps.LatLngBounds();
        for (const ring of rings) for (const point of ring) bounds.extend(point);
        map.fitBounds(bounds, 32);
      } else if (target) {
        map.setCenter({ lat: target.lat, lng: target.lng });
        map.setZoom(13);
      }
    }
    return () => {
      for (const polygon of polygons) polygon.setMap(null);
    };
  }, [areas, fitInitial, initialAreaId, map]);

  return null;
}

function CentreTracker({
  onMoveStart,
  onSettled,
}: {
  onMoveStart: () => void;
  onSettled: (point: Coordinates) => void;
}) {
  const map = useMap();
  const startRef = useRef(onMoveStart);
  const settledRef = useRef(onSettled);

  useEffect(() => {
    startRef.current = onMoveStart;
    settledRef.current = onSettled;
  }, [onMoveStart, onSettled]);

  useEffect(() => {
    if (!map) return;
    const listeners = [
      map.addListener("dragstart", () => startRef.current()),
      map.addListener("zoom_changed", () => startRef.current()),
      map.addListener("idle", () => {
        const centre = map.getCenter();
        if (centre) settledRef.current({ lat: centre.lat(), lng: centre.lng() });
      }),
    ];
    return () => {
      for (const listener of listeners) listener.remove();
    };
  }, [map]);

  return null;
}

function PlaceSearch({ label, onPlace }: { label: string; onPlace: (point: Coordinates) => void }) {
  const places = useMapsLibrary("places");
  const hostRef = useRef<HTMLDivElement>(null);
  const onPlaceRef = useRef(onPlace);
  const labelId = useId();

  useEffect(() => {
    onPlaceRef.current = onPlace;
  }, [onPlace]);

  useEffect(() => {
    const host = hostRef.current;
    if (!places || !host) return;
    const autocomplete = new places.PlaceAutocompleteElement({
      includedRegionCodes: ["se"],
    });
    autocomplete.name = "pickup-map-search";
    autocomplete.placeholder = label;
    autocomplete.setAttribute("autocomplete", "street-address");
    autocomplete.setAttribute("aria-labelledby", labelId);
    autocomplete.requestedLanguage = document.documentElement.lang || "sv";
    autocomplete.requestedRegion = "se";
    autocomplete.className = "pickup-map-search-control";

    const select = async (event: google.maps.places.PlacePredictionSelectEvent) => {
      try {
        const place = event.placePrediction.toPlace();
        await place.fetchFields({ fields: ["location"] });
        const location = place.location;
        if (location) onPlaceRef.current({ lat: location.lat(), lng: location.lng() });
      } catch {
        reportMapFailure();
      }
    };
    const error = () => reportMapFailure();
    autocomplete.addEventListener("gmp-select", select);
    autocomplete.addEventListener("gmp-error", error);
    host.replaceChildren(autocomplete);
    return () => {
      autocomplete.removeEventListener("gmp-select", select);
      autocomplete.removeEventListener("gmp-error", error);
      autocomplete.remove();
    };
  }, [label, labelId, places]);

  return (
    <div className="min-w-0 flex-1">
      <label id={labelId} className="sr-only">
        {label}
      </label>
      <div
        ref={hostRef}
        className="pickup-map-search-host min-h-11 rounded-sm border border-border bg-card text-base shadow-soft focus-within:border-ink"
      />
      <style jsx global>{`
        .pickup-map-search-host .pickup-map-search-control {
          display: block;
          min-height: 44px;
          direction: inherit;
        }
        .pickup-map-search-host .pickup-map-search-control::part(input) {
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

function CentrePin({ lifted }: { lifted: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      <span className="absolute size-2 rounded-full bg-ink/40" />
      <svg
        viewBox="0 0 40 48"
        className={`h-12 w-10 drop-shadow transition-transform duration-150 ${
          lifted ? "-translate-y-9" : "-translate-y-6"
        }`}
      >
        <path
          d="M20 47C20 47 3 29.5 3 18a17 17 0 0 1 34 0c0 11.5-17 29-17 29Z"
          fill="var(--surface)"
          stroke="var(--accent)"
          strokeWidth="2"
        />
        <circle cx="20" cy="18" r="6" fill="var(--accent)" />
      </svg>
    </div>
  );
}

function PickupMapBody({
  areas,
  initialAreaId,
  initialPoint,
  initialAddress,
  mapId,
  onConfirm,
  onClose,
}: Omit<Props, "apiKey" | "onFailure">) {
  const t = useTranslations("booking.step.pickup.map");
  const locale = useLocale();
  const geocoding = useMapsLibrary("geocoding");
  const map = useMap();
  const closeRef = useRef<HTMLButtonElement>(null);
  const requestRef = useRef(0);
  const [moving, setMoving] = useState(false);
  const [centre, setCentre] = useState<Coordinates | null>(initialPoint ?? null);
  const [address, setAddress] = useState(initialAddress ?? "");
  const [resolving, setResolving] = useState(false);

  const activeAreas = useMemo(
    () => areas.filter((area) => area.status === "ACTIVE" && boundaryLatLngs(area.boundary).length),
    [areas],
  );
  const matchedArea = useMemo(
    () =>
      centre
        ? activeAreas.find((area) => pointInGeoJson({ lng: centre.lng, lat: centre.lat }, area.boundary))
        : undefined,
    [activeAreas, centre],
  );
  const initialArea = activeAreas.find((area) => area.id === initialAreaId) ?? activeAreas[0];
  const startCentre = initialPoint ?? (initialArea ? { lat: initialArea.lat, lng: initialArea.lng } : STOCKHOLM);

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose]);

  const settled = useCallback(
    (point: Coordinates) => {
      setMoving(false);
      setCentre(point);
      if (!geocoding) return;
      const request = ++requestRef.current;
      setResolving(true);
      new geocoding.Geocoder()
        .geocode({ location: point, language: locale })
        .then(({ results }) => {
          if (request !== requestRef.current) return;
          const best =
            results.find((result) => result.types.includes("street_address")) ?? results[0];
          setAddress(best?.formatted_address ?? "");
        })
        .catch(() => {
          if (request !== requestRef.current) return;
          setAddress("");
        })
        .finally(() => {
          if (request === requestRef.current) setResolving(false);
        });
    },
    [geocoding, locale],
  );

  const moveTo = useCallback(
    (point: Coordinates) => {
      if (!map) return;
      map.panTo(point);
      map.setZoom(17);
    },
    [map],
  );

  const outside = Boolean(centre) && !matchedArea;
  const canConfirm = Boolean(centre && matchedArea) && !moving && !resolving;
  const addressLabel = resolving ? t("addressLoading") : address || t("addressUnknown");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-[100] flex flex-col bg-page"
    >
      <div className="relative z-10 flex items-center gap-2 border-b border-border bg-card p-3">
        <button
          ref={closeRef}
          type="button"
          aria-label={t("close")}
          onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <PlaceSearch label={t("search")} onPlace={moveTo} />
      </div>
      <div className="rtl-no-mirror relative min-h-0 flex-1" aria-label={t("areaLabel")}>
        <Map
          defaultCenter={startCentre}
          defaultZoom={initialPoint ? 16 : 13}
          gestureHandling="greedy"
          disableDefaultUI
          zoomControl
          {...(mapId ? { mapId } : {})}
          className="size-full"
        >
          <AreaPolygons areas={activeAreas} initialAreaId={initialAreaId} fitInitial={!initialPoint} />
          <CentreTracker onMoveStart={() => setMoving(true)} onSettled={settled} />
        </Map>
        <CentrePin lifted={moving} />
      </div>
      <div className="rounded-t-lg border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-soft">
        <h2 className="text-base font-black">{t("sheetTitle")}</h2>
        <p className="mt-2 min-h-6 break-words font-semibold" dir="auto">
          {addressLabel}
        </p>
        <p
          className={`mt-1 min-h-6 text-small leading-6 ${outside ? "text-danger" : "text-ink-muted"}`}
          role="status"
        >
          {outside ? t("outsideHint") : matchedArea ? t("inside") : ""}
        </p>
        <Button
          size="lg"
          className="mt-3 w-full"
          disabled={!canConfirm}
          onClick={() => {
            if (!centre || !matchedArea) return;
            onConfirm(address || t("addressUnknown"), centre, matchedArea.id);
          }}
        >
          {t("confirm")}
        </Button>
      </div>
    </div>
  );
}

function FallbackMapShell({
  areas,
  initialAreaId,
  onClose,
}: {
  areas: PickupMapArea[];
  initialAreaId?: string;
  onClose: () => void;
}) {
  const t = useTranslations("booking.step.pickup.map");
  const active = areas.filter(
    (area) => area.status === "ACTIVE" && boundaryLatLngs(area.boundary).length,
  );
  const ordered = [
    ...active.filter((area) => area.id === initialAreaId),
    ...active.filter((area) => area.id !== initialAreaId),
  ];
  const allPoints = ordered.flatMap((area) => boundaryLatLngs(area.boundary).flat());
  const lngs = allPoints.map((point) => point.lng);
  const lats = allPoints.map((point) => point.lat);
  const minLng = lngs.length ? Math.min(...lngs) : 0;
  const maxLng = lngs.length ? Math.max(...lngs) : 1;
  const minLat = lats.length ? Math.min(...lats) : 0;
  const maxLat = lats.length ? Math.max(...lats) : 1;
  const width = Math.max(maxLng - minLng, 0.01);
  const height = Math.max(maxLat - minLat, 0.01);
  const ringPath = (ring: Array<{ lat: number; lng: number }>) =>
    ring
      .map((point) => {
        const x = ((point.lng - minLng) / width) * 100;
        const y = (1 - (point.lat - minLat) / height) * 100;
        return `${x},${y}`;
      })
      .join(" ");

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-[100] flex flex-col bg-page"
    >
      <div className="relative z-10 flex items-center gap-2 border-b border-border bg-card p-3">
        <button
          type="button"
          aria-label={t("close")}
          onClick={onClose}
          className="inline-flex size-11 shrink-0 items-center justify-center rounded-sm border border-border bg-card text-ink"
        >
          <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
        <label className="sr-only" htmlFor="pickup-fallback-search">
          {t("search")}
        </label>
        <input
          id="pickup-fallback-search"
          type="search"
          readOnly
          placeholder={t("search")}
          className="min-h-11 min-w-0 flex-1 rounded-sm border border-border bg-card px-3 text-base"
        />
      </div>
      <div className="rtl-no-mirror relative min-h-0 flex-1 bg-[color-mix(in_srgb,var(--page)_92%,var(--ink))]" aria-label={t("areaLabel")}>
        {allPoints.length ? (
          <svg viewBox="0 0 100 100" className="size-full p-8" role="img" aria-label={t("areaLabel")}>
            {ordered.flatMap((area) =>
              boundaryLatLngs(area.boundary).map((ring, index) => (
                <polygon
                  key={`${area.id}-${index}`}
                  points={ringPath(ring)}
                  fill="color-mix(in srgb, var(--success-strong) 45%, transparent)"
                  stroke="var(--ink)"
                  strokeWidth="0.35"
                />
              )),
            )}
          </svg>
        ) : null}
        <CentrePin lifted={false} />
      </div>
      <div className="rounded-t-lg border-t border-border bg-card p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-soft">
        <h2 className="text-base font-black">{t("sheetTitle")}</h2>
        <p className="mt-2 min-h-6 break-words font-semibold">{t("addressUnknown")}</p>
        <p className="mt-1 min-h-6 text-small leading-6 text-ink-muted" role="status">
          {t("outsideHint")}
        </p>
        <Button size="lg" className="mt-3 w-full" disabled>
          {t("confirm")}
        </Button>
      </div>
    </div>
  );
}

export default function PickupMapModal(props: Props) {
  const locale = useLocale();
  const { onFailure } = props;
  const [failed, setFailed] = useState(false);

  const markFailed = useCallback(() => {
    reportMapFailure();
    onFailure();
    setFailed(true);
  }, [onFailure]);

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      markFailed();
    };
    return () => {
      window.gm_authFailure = previous;
    };
  }, [markFailed]);

  // Without a Map ID the vector map/tiles are unreliable; show the green
  // boundary fallback so pickup selection still works offline for screenshots.
  if (failed || !props.apiKey || !props.mapId) {
    return (
      <FallbackMapShell
        areas={props.areas}
        initialAreaId={props.initialAreaId}
        onClose={props.onClose}
      />
    );
  }

  return (
    <APIProvider
      apiKey={props.apiKey}
      language={locale}
      region="SE"
      onError={markFailed}
    >
      <PickupMapBody
        areas={props.areas}
        initialAreaId={props.initialAreaId}
        initialPoint={props.initialPoint}
        initialAddress={props.initialAddress}
        mapId={props.mapId}
        onConfirm={props.onConfirm}
        onClose={props.onClose}
      />
    </APIProvider>
  );
}
