"use client";

import { useEffect, useRef, useState, type ComponentProps } from "react";

import type { TeacherMap } from "@/components/TeacherMap";

type TeacherMapProps = ComponentProps<typeof TeacherMap>;

export function LazyTeacherMap(props: TeacherMapProps) {
  const [MapComponent, setMapComponent] = useState<typeof TeacherMap | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    let cancelled = false;
    const load = () => {
      void import("@/components/TeacherMap").then((mod) => {
        if (!cancelled) setMapComponent(() => mod.TeacherMap);
      });
    };
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          observer.disconnect();
          load();
        }
      },
      { rootMargin: "200px" },
    );
    observer.observe(node);
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, []);

  if (MapComponent) return <MapComponent {...props} />;

  return (
    <div ref={ref} className="grid min-h-[30rem] place-items-center rounded-lg border border-border bg-page">
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
