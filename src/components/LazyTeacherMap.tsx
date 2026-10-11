"use client";

import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ComponentProps,
} from "react";

import type { TeacherMap } from "@/components/TeacherMap";

type TeacherMapProps = ComponentProps<typeof TeacherMap>;

export function LazyTeacherMap(props: TeacherMapProps) {
  const [MapComponent, setMapComponent] = useState<typeof TeacherMap | null>(null);
  const placeholderRef = useRef<HTMLDivElement>(null);
  const loadMap = useCallback(() => {
    void import("@/components/TeacherMap").then((mod) => {
      setMapComponent(() => mod.TeacherMap);
    });
  }, []);

  useEffect(() => {
    const placeholder = placeholderRef.current;
    if (!placeholder || MapComponent) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        loadMap();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(placeholder);
    return () => observer.disconnect();
  }, [MapComponent, loadMap]);

  if (MapComponent) return <MapComponent {...props} />;

  return (
    <div
      ref={placeholderRef}
      className="grid min-h-[30rem] place-items-center rounded-lg border border-border bg-page"
    >
      <button
        type="button"
        className="inline-flex min-h-11 items-center rounded-sm bg-surface px-5 font-bold text-ink-inverse"
        onClick={loadMap}
      >
        {props.fallbackLabel ?? props.label}
      </button>
    </div>
  );
}
