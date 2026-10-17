"use client";

import { useEffect, useMemo } from "react";
import { AdvancedMarker, useMap } from "@vis.gl/react-google-maps";

import { boundaryLatLngs } from "@/lib/areas/geo";
import {
  areaLabelPosition,
  areaPolygonOptions,
  boundsForAreas,
  readAreaColours,
  type MapArea,
} from "@/lib/maps/area-style";

function AreaPolygons({ areas }: { areas: MapArea[] }) {
  const map = useMap();
  const ringsKey = useMemo(
    () =>
      areas
        .map((area) =>
          boundaryLatLngs(area.boundary)
            .map((ring) => ring.map((p) => `${p.lat},${p.lng}`).join(";"))
            .join("|"),
        )
        .join("/"),
    [areas],
  );

  useEffect(() => {
    if (!map || !areas.length) return;
    const colours = readAreaColours();
    const options = areaPolygonOptions(colours);
    const polygons: google.maps.Polygon[] = [];
    for (const area of areas) {
      for (const path of boundaryLatLngs(area.boundary)) {
        polygons.push(
          new google.maps.Polygon({
            ...options,
            paths: path,
            map,
          }),
        );
      }
    }
    return () => {
      for (const polygon of polygons) polygon.setMap(null);
    };
  }, [areas, map, ringsKey]);

  return null;
}

function AreaLabels({ areas }: { areas: MapArea[] }) {
  return (
    <>
      {areas.map((area) => {
        const position = areaLabelPosition(area);
        if (!position) return null;
        return (
          <AdvancedMarker
            key={`label-${area.id}`}
            position={position}
            zIndex={0}
            title={area.name}
          >
            <span className="rounded-sm border border-accent bg-card/95 px-2 py-0.5 text-xs font-bold text-ink shadow-soft">
              {area.name}
            </span>
          </AdvancedMarker>
        );
      })}
    </>
  );
}

const FIT_PADDING = { top: 48, right: 40, bottom: 48, left: 40 };

export function FrameAreas({
  areas,
  extraPoints = [],
}: {
  areas: MapArea[];
  extraPoints?: Array<{ lat: number; lng: number }>;
}) {
  const map = useMap();
  const { points } = boundsForAreas(areas);
  const key = [...points, ...extraPoints]
    .map((p) => `${p.lat.toFixed(4)},${p.lng.toFixed(4)}`)
    .join("|");

  useEffect(() => {
    if (!map) return;
    const { points: areaPoints } = boundsForAreas(areas);
    const all = [...areaPoints, ...extraPoints];
    if (all.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const point of all) bounds.extend(point);
    map.fitBounds(bounds, FIT_PADDING);
  }, [areas, extraPoints, key, map]);

  return null;
}

export function AreasLayer({
  areas,
  fit = false,
  focusId = null,
  extraFitPoints = [],
}: {
  areas: MapArea[];
  fit?: boolean;
  focusId?: string | null;
  extraFitPoints?: Array<{ lat: number; lng: number }>;
}) {
  if (!areas.length) return null;
  const focused = focusId ? areas.filter((area) => area.id === focusId) : [];
  const fitted = focused.length ? focused : areas;
  return (
    <>
      <AreaPolygons areas={areas} />
      <AreaLabels areas={areas} />
      {fit ? <FrameAreas areas={fitted} extraPoints={extraFitPoints} /> : null}
    </>
  );
}
