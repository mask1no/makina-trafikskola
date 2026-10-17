import { boundaryLatLngs } from "@/lib/areas/geo";

/** Gold fill ~25%. Maps APIs need hex; components read CSS vars at runtime. */
export const AREA_GOLD_HEX = "F5B429";
export const AREA_FILL_OPACITY = 0.25;
export const AREA_STROKE_WEIGHT = 1.5;
export const AREA_STROKE_OPACITY = 0.95;

export type MapArea = {
  id: string;
  name: string;
  slug?: string;
  boundary: unknown;
  /** Preferred label anchor (office / zone centre). */
  marker?: { lat: number; lng: number } | null;
};

export function readAreaColours() {
  const styles = getComputedStyle(document.documentElement);
  return {
    fill: styles.getPropertyValue("--accent").trim() || `#${AREA_GOLD_HEX}`,
    stroke: styles.getPropertyValue("--accent").trim() || `#${AREA_GOLD_HEX}`,
  };
}

export function areaPolygonOptions(
  colours: { fill: string; stroke: string },
): Omit<google.maps.PolygonOptions, "paths" | "map"> {
  return {
    strokeColor: colours.stroke,
    strokeWeight: AREA_STROKE_WEIGHT,
    strokeOpacity: AREA_STROKE_OPACITY,
    fillColor: colours.fill,
    fillOpacity: AREA_FILL_OPACITY,
    clickable: false,
  };
}

/** Label / pin anchor: preferred marker if inside, else ring centroid. */
export function areaLabelPosition(area: MapArea): { lat: number; lng: number } | null {
  const rings = boundaryLatLngs(area.boundary);
  if (!rings.length) return null;
  if (area.marker) return area.marker;
  const ring = rings[0];
  if (!ring?.length) return null;
  let lat = 0;
  let lng = 0;
  for (const point of ring) {
    lat += point.lat;
    lng += point.lng;
  }
  return { lat: lat / ring.length, lng: lng / ring.length };
}

export function boundsForAreas(areas: MapArea[]): {
  points: Array<{ lat: number; lng: number }>;
} {
  const points = areas.flatMap((area) => boundaryLatLngs(area.boundary).flat());
  return { points };
}
