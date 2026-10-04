"use client";

import { useState, type ComponentProps } from "react";

import type { TeacherMap } from "@/components/TeacherMap";

type TeacherMapProps = ComponentProps<typeof TeacherMap>;

export function LazyTeacherMap(props: TeacherMapProps) {
  const [MapComponent, setMapComponent] = useState<typeof TeacherMap | null>(null);

  if (MapComponent) return <MapComponent {...props} />;

  return (
    <div className="grid min-h-[30rem] place-items-center rounded-lg border border-border bg-page">
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-sm bg-surface px-5 font-bold text-ink-inverse"
        onClick={() => {
          void import("@/components/TeacherMap").then((mod) => {
            setMapComponent(() => mod.TeacherMap);
          });
        }}
      >
        {props.fallbackLabel ?? props.label}
      </button>
    </div>
  );
}
