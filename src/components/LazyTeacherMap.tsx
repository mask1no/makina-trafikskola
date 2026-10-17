"use client";

import { useEffect, useState, type ComponentProps } from "react";

import type { TeacherMap } from "@/components/TeacherMap";

type TeacherMapProps = ComponentProps<typeof TeacherMap>;

export function LazyTeacherMap(props: TeacherMapProps) {
  const [MapComponent, setMapComponent] = useState<typeof TeacherMap | null>(
    null,
  );
  const home = props.variant === "home";

  useEffect(() => {
    let cancelled = false;
    void import("@/components/TeacherMap").then((mod) => {
      if (!cancelled) setMapComponent(() => mod.TeacherMap);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  if (!MapComponent) {
    return (
      <div
        className={
          home
            ? "h-full min-h-[280px] overflow-hidden rounded-lg border border-border bg-page"
            : "min-h-[30rem] rounded-lg border border-border bg-page"
        }
        aria-hidden="true"
      />
    );
  }

  return (
    <div className={home ? "h-full min-h-[280px]" : undefined}>
      <MapComponent {...props} />
    </div>
  );
}
