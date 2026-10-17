import { boundaryRings } from "@/lib/areas/geo";
import type { MapArea } from "@/lib/maps/area-style";
import { staticMapWithAreasUrl } from "@/lib/maps/static-map";

function projectRings(areas: MapArea[]) {
  const rings = areas.flatMap((area) =>
    boundaryRings(area.boundary).map((ring) => ({ area, ring })),
  );
  const points = rings.flatMap(({ ring }) => ring);
  if (!points.length) return null;
  const lngs = points.map(([lng]) => lng ?? 0);
  const lats = points.map(([, lat]) => lat ?? 0);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const width = Math.max(maxLng - minLng, 0.0001);
  const height = Math.max(maxLat - minLat, 0.0001);
  const pad = 8;
  const project = (lng: number, lat: number) => ({
    x: pad + ((lng - minLng) / width) * (100 - pad * 2),
    y: pad + (1 - (lat - minLat) / height) * (100 - pad * 2),
  });
  return { rings, project };
}

/** Real boundary shapes when Static Maps / JS Maps are unavailable — never plain squares. */
export function AreasOutlineArtwork({
  areas,
  label,
  className = "",
}: {
  areas: MapArea[];
  label: string;
  className?: string;
}) {
  const projected = projectRings(areas);
  if (!projected) {
    return (
      <div
        className={`grid place-items-center bg-page text-small text-ink-muted ${className}`}
      >
        {label}
      </div>
    );
  }
  const { rings, project } = projected;

  return (
    <div
      className={`rtl-no-mirror relative overflow-hidden bg-page ${className}`}
      aria-label={label}
    >
      <svg
        viewBox="0 0 100 100"
        className="absolute inset-0 size-full"
        role="img"
        aria-label={label}
        preserveAspectRatio="xMidYMid meet"
      >
        {rings.map(({ area, ring }, index) => (
          <polygon
            key={`${area.id}-${index}`}
            points={ring
              .map((point) => {
                const [lng = 0, lat = 0] = point;
                const { x, y } = project(lng, lat);
                return `${x},${y}`;
              })
              .join(" ")}
            fill="var(--accent)"
            fillOpacity="0.25"
            stroke="var(--accent)"
            strokeWidth="1.25"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      <ul className="absolute inset-x-3 bottom-3 flex flex-wrap gap-2">
        {areas.map((area) => (
          <li
            key={area.id}
            className="rounded-sm border border-accent bg-card/95 px-2 py-0.5 text-xs font-bold text-ink shadow-soft"
          >
            {area.name}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AreasStaticFallback({
  apiKey,
  areas,
  label,
  className = "",
  width = 640,
  height = 360,
}: {
  apiKey?: string;
  areas: MapArea[];
  label: string;
  className?: string;
  width?: number;
  height?: number;
}) {
  const url = apiKey
    ? staticMapWithAreasUrl({ apiKey, areas, width, height })
    : null;

  if (url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- Static Maps URL is dynamic
      <img
        src={url}
        alt={label}
        className={`rtl-no-mirror size-full object-cover ${className}`}
        loading="lazy"
        decoding="async"
      />
    );
  }

  return (
    <AreasOutlineArtwork areas={areas} label={label} className={className} />
  );
}
