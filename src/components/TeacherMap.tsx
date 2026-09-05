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
      <div className="rtl-no-mirror static-map relative grid min-h-[28rem] place-items-center overflow-hidden rounded-lg border border-border p-6">
        <div className="relative max-w-sm rounded-md bg-card p-5 text-center shadow">
          <h2 className="font-bold">{missingKeyTitle}</h2>
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
