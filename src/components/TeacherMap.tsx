"use client";

import dynamic from "next/dynamic";
import type { TeacherMarker } from "./GoogleMapClient";

const GoogleMapClient = dynamic(() => import("./GoogleMapClient"), {
  ssr: false,
});

type TeacherMapProps = {
  apiKey?: string;
  center: { lat: number; lng: number };
  label: string;
  missingKeyTitle: string;
  missingKeyDescription: string;
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
  markers = [],
  selectedTeacherId,
  onSelectTeacher,
}: TeacherMapProps) {
  if (!apiKey) {
    return (
      <div className="rtl-no-mirror static-map relative grid min-h-[30rem] place-items-center overflow-hidden rounded-lg border border-border p-6 shadow-card">
        <div className="relative max-w-sm rounded-md border border-border bg-card p-6 text-center shadow-card">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-accent text-xl text-accent-ink" aria-hidden="true">⌖</span>
          <h2 className="mt-4 text-lg font-black">{missingKeyTitle}</h2>
          <p className="mt-2 text-sm leading-6 text-ink-muted">
            {missingKeyDescription}
          </p>
        </div>
      </div>
    );
  }

  return (
    <GoogleMapClient
      apiKey={apiKey}
      center={center}
      label={label}
      markers={markers}
      selectedTeacherId={selectedTeacherId}
      onSelectTeacher={onSelectTeacher}
    />
  );
}
