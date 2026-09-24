"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { Component, type ReactNode } from "react";
import type { TeacherMarker } from "./GoogleMapClient";

class MapBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
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
  if (!apiKey) {
    return (
      <div className="rtl-no-mirror grid min-h-[30rem] place-items-center overflow-hidden rounded-lg border border-border bg-page p-6">
        <div className="max-w-sm text-center">
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="mx-auto size-12 text-ink-subtle"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.5"
          >
            <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
            <circle cx="12" cy="10" r="2.5" />
          </svg>
          <h2 className="mt-4 text-lg font-black">{missingKeyTitle}</h2>
          {missingKeyDescription ? (
            <p className="mt-2 text-sm leading-6 text-ink-muted">
              {missingKeyDescription}
            </p>
          ) : null}
          {fallbackHref && fallbackLabel ? (
            <Link
              href={fallbackHref}
              className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm border border-border-strong bg-card px-4 font-bold text-ink shadow-soft transition hover:border-ink"
            >
              {fallbackLabel}
            </Link>
          ) : null}
        </div>
      </div>
    );
  }

  const fallback = (
    <div className="rtl-no-mirror grid min-h-[30rem] place-items-center overflow-hidden rounded-lg border border-border bg-page p-6 text-center">
      <div>
        <h2 className="text-lg font-black">{missingKeyTitle}</h2>
        {fallbackHref && fallbackLabel ? (
          <Link
            href={fallbackHref}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-sm border border-border-strong bg-card px-4 font-bold text-ink"
          >
            {fallbackLabel}
          </Link>
        ) : null}
      </div>
    </div>
  );

  return (
    <MapBoundary fallback={fallback}>
      <GoogleMapClient
        apiKey={apiKey}
        center={center}
        label={label}
        markers={markers}
        selectedTeacherId={selectedTeacherId}
        onSelectTeacher={onSelectTeacher}
      />
    </MapBoundary>
  );
}
