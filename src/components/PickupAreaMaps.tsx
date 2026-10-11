import { boundaryRings } from "@/lib/areas/geo";

type PickupArea = {
  id: string;
  name: string;
  boundary: unknown;
  marker: { lat: number; lng: number };
};

export function PickupAreaMaps({
  areas,
  label,
}: {
  areas: PickupArea[];
  label: string;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {areas.map((area) => {
        const rings = boundaryRings(area.boundary);
        const points = rings.flat();
        if (!points.length) return null;
        const lngs = points.map(([lng]) => lng);
        const lats = points.map(([, lat]) => lat);
        const minLng = Math.min(...lngs);
        const maxLng = Math.max(...lngs);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const width = Math.max(maxLng - minLng, 0.0001);
        const height = Math.max(maxLat - minLat, 0.0001);
        const project = (point: number[]) => {
          const [lng = minLng, lat = minLat] = point;
          return {
            x: 10 + ((lng - minLng) / width) * 80,
            y: 10 + (1 - (lat - minLat) / height) * 80,
          };
        };
        const marker = project([area.marker.lng, area.marker.lat]);

        return (
          <figure
            key={area.id}
            className="overflow-hidden rounded-md border border-surface-soft bg-surface text-ink-inverse shadow-soft"
          >
            <div className="relative h-64 overflow-hidden bg-surface-raised sm:h-72">
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-30 [background-image:linear-gradient(var(--surface-soft)_1px,transparent_1px),linear-gradient(90deg,var(--surface-soft)_1px,transparent_1px)] [background-size:2rem_2rem]"
              />
              <svg
                viewBox="0 0 100 100"
                className="rtl-no-mirror absolute inset-0 size-full p-5"
                role="img"
                aria-label={`${label}: ${area.name}`}
                preserveAspectRatio="xMidYMid meet"
              >
                {rings.map((ring, index) => (
                  <polygon
                    key={index}
                    points={ring
                      .map((point) => {
                        const projected = project(point);
                        return `${projected.x},${projected.y}`;
                      })
                      .join(" ")}
                    fill="var(--accent)"
                    fillOpacity="0.24"
                    stroke="var(--accent)"
                    strokeWidth="1.5"
                    vectorEffect="non-scaling-stroke"
                  />
                ))}
                <circle
                  cx={marker.x}
                  cy={marker.y}
                  r="2.8"
                  fill="var(--accent)"
                  stroke="var(--accent-ink)"
                  strokeWidth="1.2"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <figcaption className="flex items-center gap-2 px-4 py-3 text-small font-extrabold">
              <span aria-hidden="true" className="size-2 rounded-full bg-accent" />
              {area.name}
            </figcaption>
          </figure>
        );
      })}
    </div>
  );
}
