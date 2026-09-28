"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map,
  Marker,
} from "@vis.gl/react-google-maps";

import { Avatar } from "@/components/Avatar";
import { Badge } from "@/components/Badge";
import { BottomSheet } from "@/components/BottomSheet";

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
  const openMarker = markers.find((marker) => marker.id === openId) ?? null;

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
      <div
        className="rtl-no-mirror h-[28rem] overflow-hidden rounded-lg"
        aria-label={label}
      >
        <Map
          defaultCenter={center}
          defaultZoom={11}
          gestureHandling="cooperative"
          disableDefaultUI
          mapId={mapId || undefined}
        >
          {mapId
            ? markers.map((marker) => {
                const selected = selectedTeacherId === marker.teacherId;
                return (
                  <AdvancedMarker
                    key={marker.id}
                    position={marker.position}
                    title={marker.title}
                    onClick={() => select(marker)}
                  >
                    <span
                      className={`inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 bg-surface px-3 text-sm font-black text-ink-inverse ${
                        selected ? "border-accent" : "border-transparent"
                      }`}
                    >
                      {initials(marker.title)}
                    </span>
                  </AdvancedMarker>
                );
              })
            : markers.map((marker) => (
                <Marker
                  key={marker.id}
                  position={marker.position}
                  title={marker.title}
                  clickable={Boolean(onSelectTeacher) || Boolean(marker.languages)}
                  opacity={
                    selectedTeacherId && selectedTeacherId !== marker.teacherId
                      ? 0.65
                      : 1
                  }
                  onClick={() => select(marker)}
                />
              ))}
          {openMarker && !mobile ? (
            <InfoWindow
              position={openMarker.position}
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
