export type LngLat = { lng: number; lat: number };

type Ring = number[][];

export function boundaryRings(value: unknown): Ring[] {
  return ringsFromGeoJson(value);
}

export function boundaryLatLngs(value: unknown) {
  return boundaryRings(value)
    .map((ring) =>
      ring.flatMap((point) => {
        const lng = point[0];
        const lat = point[1];
        if (lng === undefined || lat === undefined) return [];
        return [{ lat, lng }];
      }),
    )
    .filter((ring) => ring.length >= 3);
}

function ringsFromGeoJson(value: unknown): Ring[] {
  if (!value || typeof value !== "object") return [];
  const record = value as { type?: string; geometry?: unknown; coordinates?: unknown; features?: unknown };
  if (record.type === "Feature") return ringsFromGeoJson(record.geometry);
  if (record.type === "FeatureCollection" && Array.isArray(record.features)) {
    return record.features.flatMap((feature) => ringsFromGeoJson(feature));
  }
  if (record.type === "Polygon" && Array.isArray(record.coordinates)) {
    const ring = record.coordinates[0];
    return Array.isArray(ring) ? [ring as Ring] : [];
  }
  if (record.type === "MultiPolygon" && Array.isArray(record.coordinates)) {
    return record.coordinates.flatMap((polygon) => {
      const ring = Array.isArray(polygon) ? polygon[0] : null;
      return Array.isArray(ring) ? [ring as Ring] : [];
    });
  }
  return [];
}

function pointInRing(point: LngLat, ring: Ring) {
  let inside = false;
  for (let index = 0, previous = ring.length - 1; index < ring.length; previous = index, index += 1) {
    const current = ring[index];
    const prior = ring[previous];
    if (!current || !prior || current.length < 2 || prior.length < 2) continue;
    const xi = current[0];
    const yi = current[1];
    const xj = prior[0];
    const yj = prior[1];
    if (xi === undefined || yi === undefined || xj === undefined || yj === undefined) continue;
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function pointInGeoJson(point: LngLat, boundary: unknown) {
  const rings = boundaryRings(boundary);
  return rings.some((ring) => pointInRing(point, ring));
}
