"use client";

import { useEffect, useMemo } from "react";
import { AdvancedMarker, APIProvider, Map, useMap } from "@vis.gl/react-google-maps";

import { boundaryLatLngs } from "@/lib/areas/geo";
import { reportMapFailure } from "@/lib/maps/report-failure";

function mapColours() {
  const styles = getComputedStyle(document.documentElement);
  return {
    stroke: styles.getPropertyValue("--ink").trim(),
    fill: styles.getPropertyValue("--accent").trim(),
  };
}

function Outline({
  rings,
}: {
  rings: Array<Array<{ lat: number; lng: number }>>;
}) {
  const map = useMap();
  useEffect(() => {
    if (!map || rings.length === 0) return;
    const colours = mapColours();
    const polygons = rings.map(
      (path) =>
        new google.maps.Polygon({
          paths: path,
          map,
          strokeColor: colours.stroke,
          strokeWeight: 2,
          fillColor: colours.fill,
          fillOpacity: 0.35,
          clickable: false,
        }),
    );
    const bounds = new google.maps.LatLngBounds();
    for (const ring of rings) {
      for (const point of ring) bounds.extend(point);
    }
    map.fitBounds(bounds, 32);
    return () => {
      for (const polygon of polygons) polygon.setMap(null);
    };
  }, [map, rings]);
  return null;
}

export default function AreaOutlineMap({
  apiKey,
  mapId,
  boundary,
  label,
  marker,
  onFailure,
}: {
  apiKey: string;
  mapId: string;
  boundary: unknown;
  label: string;
  marker?: { lat: number; lng: number } | null;
  onFailure: () => void;
}) {
  const rings = useMemo(() => boundaryLatLngs(boundary), [boundary]);

  useEffect(() => {
    const previous = window.gm_authFailure;
    window.gm_authFailure = () => {
      reportMapFailure();
      onFailure();
    };
    return () => {
      window.gm_authFailure = previous;
    };
  }, [onFailure]);

  if (!rings.length) return null;

  return (
    <APIProvider
      apiKey={apiKey}
      onError={() => {
        reportMapFailure();
        onFailure();
      }}
    >
      <div className="rtl-no-mirror h-72" aria-label={label}>
        <Map
          defaultCenter={rings[0]?.[0]}
          defaultZoom={12}
          gestureHandling="cooperative"
          disableDefaultUI
          mapId={mapId}
          className="size-full"
        >
          <Outline rings={rings} />
          {marker ? <AdvancedMarker position={marker} /> : null}
        </Map>
      </div>
    </APIProvider>
  );
}
