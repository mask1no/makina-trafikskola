"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";

import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { BottomSheet } from "@/components/BottomSheet";
import { fanOutPositions } from "@/lib/maps/place-teachers";

export type TeacherMarker = {
  id: string;
  teacherId: string;
  title: string;
  position: { lat: number; lng: number };
  photoUrl?: string | null;
  languages?: string[];
  transmission?: string;
  locationName?: string;
};

type GoogleMapClientProps = {
  apiKey: string;
  bookingAvailable: boolean;
  center: { lat: number; lng: number };
  label: string;
  markers: TeacherMarker[];
  selectedTeacherId?: string;
  onSelectTeacher?: (teacherId: string) => void;
};

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0] ?? "")
    .join("")
    .toLocaleUpperCase();
}

function firstName(name: string) {
  const word = name.trim().split(/\s+/)[0] ?? name;
  return word.length > 12 ? `${word.slice(0, 11)}…` : word;
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function personMarkerIcon(name: string, selected: boolean) {
  const ring = selected ? "#F5B429" : "#FFFFFF";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="104" height="86" viewBox="0 0 104 86"><circle cx="52" cy="24" r="20" fill="#0D0D0F" stroke="${ring}" stroke-width="3"/><text x="52" y="29" text-anchor="middle" font-family="Arial,sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">${escapeXml(initials(name))}</text><rect x="6" y="50" width="92" height="28" rx="14" fill="#0D0D0F"/><text x="52" y="69" text-anchor="middle" font-family="Arial,sans-serif" font-size="13" font-weight="700" fill="#FFFFFF">${escapeXml(firstName(name))}</text></svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function PersonPin({
  name,
  selected,
}: {
  name: string;
  selected: boolean;
}) {
  return (
    <span className="grid justify-items-center">
      <span
        className={`grid size-11 place-items-center rounded-full border-2 bg-surface text-sm font-black text-ink-inverse ${
          selected ? "border-accent" : "border-card"
        }`}
      >
        {initials(name)}
      </span>
      <span className="mt-1 rounded-full bg-surface px-2 py-0.5 text-xs font-bold text-ink-inverse shadow-soft">
        {firstName(name)}
      </span>
    </span>
  );
}

function FrameTeachers({
  positions,
}: {
  positions: Array<{ lat: number; lng: number }>;
}) {
  const map = useMap();
  const positionsRef = useRef(positions);
  positionsRef.current = positions;
  const key = positions
    .map((position) => `${position.lat.toFixed(5)},${position.lng.toFixed(5)}`)
    .join("|");

  useEffect(() => {
    if (!map || positionsRef.current.length === 0) return;
    const bounds = new google.maps.LatLngBounds();
    for (const position of positionsRef.current) bounds.extend(position);
    map.fitBounds(bounds, { top: 72, right: 48, bottom: 72, left: 48 });
    const listener = google.maps.event.addListenerOnce(map, "idle", () => {
      const zoom = map.getZoom();
      if (zoom == null) return;
      if (zoom > 16) map.setZoom(16);
      if (zoom < 13) map.setZoom(13);
    });
    return () => {
      google.maps.event.removeListener(listener);
    };
  }, [key, map]);

  return null;
}

function MarkerDetails({
  bookingAvailable,
  marker,
}: {
  bookingAvailable: boolean;
  marker: TeacherMarker;
}) {
  const t = useTranslations("map");
  const locale = useLocale();
  return (
    <div className="grid gap-3 text-start">
      <div className="flex items-center gap-3">
        <Avatar name={marker.title} imageUrl={marker.photoUrl} size="sm" />
        <p className="font-black">{marker.title}</p>
      </div>
      {marker.languages?.length ? (
        <div className="flex flex-wrap gap-2">
          {marker.languages.map((language) => (
            <Badge key={language}>{language}</Badge>
          ))}
        </div>
      ) : null}
      {marker.transmission ? <p className="text-sm">{marker.transmission}</p> : null}
      {marker.locationName ? (
        <p className="text-sm text-ink-muted">{marker.locationName}</p>
      ) : null}
      <Link
        href={
          bookingAvailable
            ? `/${locale}/boka?teacher=${marker.teacherId}`
            : `/${locale}/kontakt`
        }
        className="inline-flex min-h-11 items-center justify-center rounded-sm bg-accent px-4 font-bold text-accent-ink"
      >
        {t(bookingAvailable ? "book" : "contact")}
      </Link>
    </div>
  );
}

export default function GoogleMapClient({
  apiKey,
  bookingAvailable,
  center,
  label,
  markers,
  selectedTeacherId,
  onSelectTeacher,
}: GoogleMapClientProps) {
  const t = useTranslations("map");
  const mapId = process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID;
  const [openId, setOpenId] = useState<string | null>(null);
  const [mobile, setMobile] = useState(false);
  const placed = useMemo(() => fanOutPositions(markers), [markers]);
  const openMarker = placed.find((marker) => marker.id === openId) ?? null;
  const teacherChoices = markers.filter(
    (marker, index) =>
      markers.findIndex(
        (candidate) => candidate.teacherId === marker.teacherId,
      ) === index,
  );

  useEffect(() => {
    const query = window.matchMedia("(max-width: 767px)");
    const update = () => setMobile(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  function select(marker: TeacherMarker) {
    onSelectTeacher?.(marker.teacherId);
    setOpenId(marker.id);
  }

  return (
    <APIProvider apiKey={apiKey}>
      {teacherChoices.length > 1 ? (
        <div className="mb-3 flex gap-2 overflow-x-auto">
          {teacherChoices.map((marker) => (
            <button
              key={marker.teacherId}
              type="button"
              aria-pressed={openMarker?.teacherId === marker.teacherId}
              onClick={() => select(marker)}
              className="flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-border bg-card pe-4 ps-2 text-sm font-bold text-ink shadow-soft transition duration-500 ease-premium hover:border-border-strong aria-pressed:border-accent aria-pressed:bg-accent-soft"
            >
              <Avatar
                name={marker.title}
                imageUrl={marker.photoUrl}
                size="sm"
              />
              {marker.title}
            </button>
          ))}
        </div>
      ) : null}
      <div
        className="rtl-no-mirror relative h-[28rem] overflow-hidden rounded-lg"
        aria-label={label}
      >
        <Map
          defaultCenter={center}
          defaultZoom={13}
          gestureHandling="cooperative"
          disableDefaultUI
          mapId={mapId || undefined}
        >
          <FrameTeachers
            positions={placed.map((marker) => marker.displayPosition)}
          />
          {mapId
            ? placed.map((marker) => {
                const selected =
                  selectedTeacherId === marker.teacherId ||
                  openMarker?.id === marker.id;
                return (
                  <AdvancedMarker
                    key={marker.id}
                    position={marker.displayPosition}
                    title={marker.title}
                    zIndex={selected ? 10 : 1}
                    onClick={() => select(marker)}
                  >
                    <PersonPin name={marker.title} selected={selected} />
                  </AdvancedMarker>
                );
              })
            : placed.map((marker) => {
                const selected =
                  selectedTeacherId === marker.teacherId ||
                  openMarker?.id === marker.id;
                const person = Boolean(marker.languages?.length);
                return (
                  <Marker
                    key={marker.id}
                    position={marker.displayPosition}
                    title={marker.title}
                    icon={
                      person
                        ? personMarkerIcon(marker.title, selected)
                        : undefined
                    }
                    zIndex={selected ? 10 : 1}
                    clickable
                    onClick={() => select(marker)}
                  />
                );
              })}
          {openMarker && !mobile ? (
            <InfoWindow
              position={openMarker.displayPosition}
              onCloseClick={() => setOpenId(null)}
            >
              <MarkerDetails
                bookingAvailable={bookingAvailable}
                marker={openMarker}
              />
            </InfoWindow>
          ) : null}
        </Map>
      </div>
      {openMarker && mobile ? (
        <BottomSheet title={openMarker.title} open>
          <MarkerDetails
            bookingAvailable={bookingAvailable}
            marker={openMarker}
          />
          <button
            type="button"
            className="mt-4 inline-flex min-h-11 items-center font-bold underline"
            onClick={() => setOpenId(null)}
          >
            {t("close")}
          </button>
        </BottomSheet>
      ) : null}
    </APIProvider>
  );
}
