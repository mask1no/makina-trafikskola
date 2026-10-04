"use client";

import { useState } from "react";

import { TeacherMap } from "@/components/TeacherMap";
import type { TeacherMarker } from "@/components/GoogleMapClient";

type SelectableTeacherMapProps = {
  apiKey?: string;
  mapId?: string;
  bookingAvailable: boolean;
  center: { lat: number; lng: number };
  label: string;
  missingKeyTitle: string;
  fallbackHref: string;
  fallbackLabel: string;
  markers: TeacherMarker[];
};

export function SelectableTeacherMap(props: SelectableTeacherMapProps) {
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>();

  function selectTeacher(teacherId: string) {
    setSelectedTeacherId(teacherId);
    const card = document.getElementById(`teacher-${teacherId}`);
    document.querySelectorAll("[data-teacher]").forEach((node) => {
      node.removeAttribute("data-selected");
    });
    card?.setAttribute("data-selected", "true");
    card?.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  return (
    <TeacherMap
      {...props}
      selectedTeacherId={selectedTeacherId}
      onSelectTeacher={selectTeacher}
    />
  );
}
