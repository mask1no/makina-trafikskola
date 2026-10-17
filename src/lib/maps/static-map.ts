import { boundaryLatLngs } from "@/lib/areas/geo";

import {
  AREA_FILL_OPACITY,
  AREA_GOLD_HEX,
  AREA_STROKE_WEIGHT,
  type MapArea,
  boundsForAreas,
} from "./area-style";

const MAX_RING_POINTS = 48;
const MIN_RING_POINTS = 4;

/** Light roadmap styles aligned with --page / --card / muted ink. */
export const LIGHT_STATIC_STYLES = [
  "feature:poi|visibility:off",
  "feature:transit|visibility:off",
  "element:geometry|color:0xF5F5F7",
  "element:labels.text.fill|color:0x6B6B73",
  "element:labels.text.stroke|color:0xFFFFFF",
  "feature:road|element:geometry|color:0xFFFFFF",
  "feature:road.arterial|element:geometry|color:0xE5E5EA",
  "feature:road.highway|element:geometry|color:0xD3D3D8",
  "feature:water|element:geometry|color:0xDCE8F5",
  "feature:landscape|element:geometry|color:0xF5F5F7",
] as const;

function downsampleRing(
  ring: Array<{ lat: number; lng: number }>,
  maxPoints: number,
): Array<{ lat: number; lng: number }> {
  if (ring.length <= maxPoints) return ring;
  const step = (ring.length - 1) / (maxPoints - 1);
  const points: Array<{ lat: number; lng: number }> = [];
  for (let index = 0; index < maxPoints - 1; index += 1) {
    const point = ring[Math.round(index * step)];
    if (point) points.push(point);
  }
  const last = ring[ring.length - 1];
  if (last) points.push(last);
  return points;
}

function fillColour() {
  const alpha = Math.round(AREA_FILL_OPACITY * 255)
    .toString(16)
    .padStart(2, "0")
    .toUpperCase();
  return `0x${AREA_GOLD_HEX}${alpha}`;
}

function strokeColour() {
  return `0x${AREA_GOLD_HEX}F2`;
}

function pathParam(ring: Array<{ lat: number; lng: number }>) {
  const points = downsampleRing(ring, MAX_RING_POINTS)
    .map((point) => `${point.lat.toFixed(5)},${point.lng.toFixed(5)}`)
    .join("|");
  return `fillcolor:${fillColour()}|color:${strokeColour()}|weight:${AREA_STROKE_WEIGHT}|${points}`;
}

function centreAndZoom(areas: MapArea[]) {
  const { points } = boundsForAreas(areas);
  if (!points.length) {
    return { center: "59.35,18.0", zoom: 9 };
  }
  const lats = points.map((point) => point.lat);
  const lngs = points.map((point) => point.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const center = `${((minLat + maxLat) / 2).toFixed(5)},${((minLng + maxLng) / 2).toFixed(5)}`;
  const span = Math.max(maxLat - minLat, maxLng - minLng);
  let zoom = 11;
  if (span > 0.45) zoom = 9;
  else if (span > 0.25) zoom = 10;
  else if (span > 0.12) zoom = 11;
  else zoom = 12;
  return { center, zoom };
}

export function staticMapWithAreasUrl({
  apiKey,
  areas,
  width = 640,
  height = 360,
}: {
  apiKey: string;
  areas: MapArea[];
  width?: number;
  height?: number;
}): string | null {
  if (!apiKey || !areas.length) return null;

  const paths = areas.flatMap((area) =>
    boundaryLatLngs(area.boundary)
      .filter((ring) => ring.length >= MIN_RING_POINTS)
      .map((ring) => pathParam(ring)),
  );
  if (!paths.length) return null;

  const { center, zoom } = centreAndZoom(areas);
  const params = new URLSearchParams({
    key: apiKey,
    size: `${Math.min(width, 640)}x${Math.min(height, 640)}`,
    scale: "2",
    maptype: "roadmap",
    center,
    zoom: String(zoom),
  });
  for (const style of LIGHT_STATIC_STYLES) params.append("style", style);
  for (const path of paths) params.append("path", path);

  const url = `https://maps.googleapis.com/maps/api/staticmap?${params.toString()}`;
  // Google rejects URLs past ~8192; drop island rings if needed.
  if (url.length <= 8000) return url;

  const mainPaths = areas.flatMap((area) => {
    const rings = boundaryLatLngs(area.boundary)
      .filter((ring) => ring.length >= MIN_RING_POINTS)
      .sort((a, b) => b.length - a.length);
    const main = rings[0];
    return main ? [pathParam(main)] : [];
  });
  const compact = new URLSearchParams({
    key: apiKey,
    size: `${Math.min(width, 640)}x${Math.min(height, 640)}`,
    scale: "2",
    maptype: "roadmap",
    center,
    zoom: String(zoom),
  });
  for (const style of LIGHT_STATIC_STYLES) compact.append("style", style);
  for (const path of mainPaths) compact.append("path", path);
  return `https://maps.googleapis.com/maps/api/staticmap?${compact.toString()}`;
}
