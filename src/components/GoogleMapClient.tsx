"use client";

import { APIProvider, Map, Marker } from "@vis.gl/react-google-maps";

export type TeacherMarker = {
  id: string;
  teacherId: string;
  title: string;
  position: { lat: number; lng: number };
};

type GoogleMapClientProps = {
  apiKey: string;
  center: { lat: number; lng: number };
  label: string;
  markers: TeacherMarker[];
  selectedTeacherId?: string;
  onSelectTeacher?: (teacherId: string) => void;
};

export default function GoogleMapClient({
  apiKey,
  center,
  label,
  markers,
  selectedTeacherId,
  onSelectTeacher,
}: GoogleMapClientProps) {
  return (
    <APIProvider apiKey={apiKey}>
      <div
        className="rtl-no-mirror h-[28rem] overflow-hidden rounded-lg"
        aria-label={label}
      >
        <Map
          defaultCenter={center}
          defaultZoom={11}
          gestureHandling="cooperative"
          disableDefaultUI
        >
          {markers.map((marker) => (
            <Marker
              key={marker.id}
              position={marker.position}
              title={marker.title}
              clickable={Boolean(onSelectTeacher)}
              opacity={
                selectedTeacherId && selectedTeacherId !== marker.teacherId
                  ? 0.65
                  : 1
              }
              onClick={() => onSelectTeacher?.(marker.teacherId)}
            />
          ))}
        </Map>
      </div>
    </APIProvider>
  );
}
