"use client";

import dynamic from "next/dynamic";
import { Component, type ReactNode } from "react";

import { AreasStaticFallback } from "@/components/map/AreasStaticFallback";
import { MapFallback } from "@/components/MapFallback";
import type { MapArea } from "@/lib/maps/area-style";
import { reportMapFailure } from "@/lib/maps/report-failure";
import type { MapVariant, TeacherMarker } from "./GoogleMapClient";

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
  areas?: MapArea[];
  variant?: MapVariant;
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
  areas = [],
  variant = "directory",
  selectedTeacherId,
  onSelectTeacher,
}: TeacherMapProps) {
  const home = variant === "home";
  const areasFallback = (
    <div
      className={
        home
          ? "h-full min-h-[280px] overflow-hidden rounded-lg border border-border"
          : "min-h-[30rem] overflow-hidden rounded-lg border border-border"
      }
    >
      <AreasStaticFallback
        apiKey={apiKey}
        areas={areas}
        label={label}
        className="size-full"
        height={home ? 280 : 448}
      />
    </div>
  );

  if (!apiKey || !mapId) {
    if (home && areas.length) return areasFallback;
    return (
      <MapFallback
        title={missingKeyTitle}
        description={missingKeyDescription}
        href={fallbackHref}
        linkLabel={fallbackLabel}
      />
    );
  }

  const fallback =
    home && areas.length ? (
      areasFallback
    ) : (
      <MapFallback
        title={missingKeyTitle}
        description={missingKeyDescription}
        href={fallbackHref}
        linkLabel={fallbackLabel}
      />
    );

  const map = (
    <MapBoundary fallback={fallback}>
      <GoogleMapClient
        apiKey={apiKey}
        mapId={mapId}
        bookingAvailable={bookingAvailable}
        center={center}
        label={label}
        markers={markers}
        areas={areas}
        variant={variant}
        selectedTeacherId={selectedTeacherId}
        onSelectTeacher={onSelectTeacher}
      />
    </MapBoundary>
  );

  if (home) {
    return <div className="h-full min-h-[280px]">{map}</div>;
  }

  return <div className="min-h-[24rem] sm:min-h-[28rem]">{map}</div>;
}
