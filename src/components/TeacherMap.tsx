"use client";

import dynamic from "next/dynamic";
import { Component, useEffect, useRef, useState, type ReactNode } from "react";
import { MapFallback } from "@/components/MapFallback";
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

function DeferredMap({ label, map }: { label: string; map: ReactNode }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node || visible) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setVisible(true);
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return (
    <div ref={ref} className="min-h-[30rem]">
      {visible ? (
        map
      ) : (
        <div className="grid min-h-[30rem] place-items-center rounded-lg border border-border bg-page">
          <button type="button" className="inline-flex min-h-11 items-center rounded-sm bg-surface px-5 font-bold text-ink-inverse" onClick={() => setVisible(true)}>
            {label}
          </button>
        </div>
      )}
    </div>
  );
}
