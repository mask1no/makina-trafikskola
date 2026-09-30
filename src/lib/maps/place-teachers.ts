export type MapPoint = { lat: number; lng: number };

const CLUSTER_DIGITS = 5;
const RING_RADIUS_DEGREES = 0.0032;

export function fanOutPositions<T extends { position: MapPoint }>(
  markers: T[],
): Array<T & { displayPosition: MapPoint }> {
  const groups = new Map<string, T[]>();
  for (const marker of markers) {
    const key = `${marker.position.lat.toFixed(CLUSTER_DIGITS)}:${marker.position.lng.toFixed(CLUSTER_DIGITS)}`;
    const group = groups.get(key);
    if (group) group.push(marker);
    else groups.set(key, [marker]);
  }

  const placed: Array<T & { displayPosition: MapPoint }> = [];
  for (const group of groups.values()) {
    if (group.length === 1) {
      const marker = group[0];
      if (!marker) continue;
      placed.push({ ...marker, displayPosition: marker.position });
      continue;
    }

    group.forEach((marker, index) => {
      const angle = (2 * Math.PI * index) / group.length - Math.PI / 2;
      const cosLat = Math.cos((marker.position.lat * Math.PI) / 180);
      placed.push({
        ...marker,
        displayPosition: {
          lat: marker.position.lat + RING_RADIUS_DEGREES * Math.sin(angle),
          lng:
            marker.position.lng +
            (RING_RADIUS_DEGREES * Math.cos(angle)) / (cosLat || 1),
        },
      });
    });
  }
  return placed;
}
