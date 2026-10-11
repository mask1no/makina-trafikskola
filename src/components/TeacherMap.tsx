"use client";

import dynamic from "next/dynamic";
import { Component, useState, type ReactNode } from "react";
import { MapFallback } from "@/components/MapFallback";
import { StaticMapArtwork } from "@/components/StaticMapArtwork";
import { reportMapFailure } from "@/lib/maps/report-failure";
import type { TeacherMarker } from "./GoogleMapClient";

class MapBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch() {
    reportMapFailure();
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const GoogleMapClient = dynamic(() => import("./GoogleMapClient"), {
  ssr: false,
});

type TeacherMapProps = {
  apiKey?: string;
  mapId?: string;
  bookingAvailable?: boolean;
  center: { lat: number; lng: number };
  label: string;
  missingKeyTitle: string;
  missingKeyDescription?: string;
  fallbackHref?: string;
  fallbackLabel?: string;
  loadDescription?: string;
  markers?: TeacherMarker[];
  selectedTeacherId?: string;
  onSelectTeacher?: (teacherId: string) => void;
};

export function TeacherMap({
  apiKey,
  mapId,
  bookingAvailable = true,
  center,
  label,
  missingKeyTitle,
  missingKeyDescription,
  fallbackHref,
  fallbackLabel,
  loadDescription,
  markers = [],
  selectedTeacherId,
  onSelectTeacher,
}: TeacherMapProps) {
  if (!apiKey || !mapId) {
    return (
      <MapFallback title={missingKeyTitle} description={missingKeyDescription} href={fallbackHref} linkLabel={fallbackLabel} />
    );
  }

  const fallback = (
    <MapFallback title={missingKeyTitle} description={missingKeyDescription} href={fallbackHref} linkLabel={fallbackLabel} />
  );

  return (
    <DeferredMap
      label={fallbackLabel ?? label}
      description={loadDescription}
      map={
        <MapBoundary fallback={fallback}>
          <GoogleMapClient
            apiKey={apiKey}
            mapId={mapId}
            bookingAvailable={bookingAvailable}
            center={center}
            label={label}
            markers={markers}
            selectedTeacherId={selectedTeacherId}
            onSelectTeacher={onSelectTeacher}
          />
        </MapBoundary>
      }
    />
  );
}

function DeferredMap({
  label,
  description,
  map,
}: {
  label: string;
  description?: string;
  map: ReactNode;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="min-h-[24rem] sm:min-h-[28rem]">
      {visible ? (
        map
      ) : (
        <div className="relative grid min-h-[24rem] place-items-center overflow-hidden rounded-lg border border-surface-soft bg-surface p-6 text-center text-ink-inverse shadow-soft sm:min-h-[28rem]">
          <StaticMapArtwork className="absolute inset-0 size-full opacity-45" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,color-mix(in_srgb,var(--surface)_25%,transparent),var(--surface)_92%)]" />
          <div className="relative max-w-md rounded-md border border-ink-inverse/15 bg-surface-raised/95 p-5 shadow-float">
            {description ? (
              <p className="text-small leading-6 text-ink-inverse-muted">
                {description}
              </p>
            ) : null}
            <button
              type="button"
              className={`${description ? "mt-4" : ""} inline-flex min-h-11 items-center rounded-sm bg-accent px-5 font-bold text-accent-ink`}
              onClick={() => setVisible(true)}
            >
              {label}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
