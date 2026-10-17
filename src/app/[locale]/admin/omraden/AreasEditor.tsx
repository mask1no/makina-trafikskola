"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";
import { Notice } from "@/components/Notice";

type Area = {
  id: string;
  name: string;
  status: "ACTIVE" | "COMING_SOON";
  officeAddress: string;
  boundary: string;
};

function rings(value: string) {
  try {
    const parsed = JSON.parse(value) as { type?: string; geometry?: { coordinates?: number[][][] }; coordinates?: number[][][] };
    const coordinates = parsed.type === "Feature" ? parsed.geometry?.coordinates : parsed.coordinates;
    const ring = coordinates?.[0];
    return Array.isArray(ring) ? ring.filter((point) => point.length >= 2) : [];
  } catch {
    return [];
  }
}

function Preview({ boundary }: { boundary: string }) {
  const points = useMemo(() => rings(boundary), [boundary]);
  if (points.length < 3) return null;
  const lngs = points.map((point) => point[0] ?? 0);
  const lats = points.map((point) => point[1] ?? 0);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const width = Math.max(maxLng - minLng, 0.001);
  const height = Math.max(maxLat - minLat, 0.001);
  const path = points
    .map((point) => {
      const x = (((point[0] ?? 0) - minLng) / width) * 280 + 10;
      const y = (1 - (((point[1] ?? 0) - minLat) / height)) * 160 + 10;
      return `${x},${y}`;
    })
    .join(" ");
  return (
    <svg viewBox="0 0 300 180" className="mt-3 h-44 w-full rounded-md border border-[var(--line)] bg-page" aria-hidden="true">
      <polygon points={path} fill="color-mix(in srgb, var(--accent) 35%, transparent)" stroke="var(--ink)" />
    </svg>
  );
}

export function AreasEditor({ areas }: { areas: Area[] }) {
  const t = useTranslations("admin.editor");
  const [rows, setRows] = useState(areas);
  const [messages, setMessages] = useState<
    Record<string, { tone: "success" | "danger"; text: string }>
  >({});

  async function save(area: Area) {
    setMessages((current) => {
      const next = { ...current };
      delete next[area.id];
      return next;
    });
    let boundary: unknown;
    try {
      boundary = JSON.parse(area.boundary);
    } catch {
      setMessages((current) => ({
        ...current,
        [area.id]: { tone: "danger", text: t("invalidBoundary") },
      }));
      return;
    }
    const response = await fetch(`/api/admin/areas/${area.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: area.status,
        officeAddress: area.officeAddress.trim() || null,
        boundary,
      }),
    });
    const body = await response.json().catch(() => null);
    setMessages((current) => ({
      ...current,
      [area.id]: {
        tone: response.ok ? "success" : "danger",
        text: response.ok ? t("saved") : (body?.error?.code ?? "UNKNOWN"),
      },
    }));
  }

  return (
    <div className="grid gap-6">
      <nav
        aria-label={t("areaNavigation")}
        className="sticky top-24 z-20 flex gap-2 overflow-x-auto rounded-md border border-border bg-card p-2 shadow-soft"
      >
        {rows.map((area) => (
          <a
            key={area.id}
            href={`#area-${area.id}`}
            className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-sm px-3 font-bold hover:bg-page"
          >
            {area.name}
            <span className="text-xs font-semibold text-ink-muted">
              {t(area.status === "ACTIVE" ? "active" : "comingSoon")}
            </span>
          </a>
        ))}
      </nav>
      {rows.map((area, index) => (
        <Card
          key={area.id}
          id={`area-${area.id}`}
          className="grid scroll-mt-40 gap-4"
        >
          <div>
            <h2 className="text-xl font-black">{area.name}</h2>
            <p className="mt-1 text-small text-ink-muted">
              {t(area.status === "ACTIVE" ? "active" : "comingSoon")}
            </p>
          </div>
          <label className="grid gap-1 text-small font-semibold">
            {t("status")}
            <select className="min-h-11 rounded-sm border border-border px-3" value={area.status} onChange={(event) => {
              const next = [...rows];
              next[index] = { ...area, status: event.target.value as Area["status"] };
              setRows(next);
            }}>
              <option value="ACTIVE">{t("active")}</option>
              <option value="COMING_SOON">{t("comingSoon")}</option>
            </select>
          </label>
          <label className="grid gap-1 text-small font-semibold">
            {t("office")}
            <input className="min-h-11 rounded-sm border border-border px-3" value={area.officeAddress} onChange={(event) => {
              const next = [...rows];
              next[index] = { ...area, officeAddress: event.target.value };
              setRows(next);
            }} />
          </label>
          <details className="rounded-sm border border-border bg-page p-4">
            <summary className="flex min-h-11 cursor-pointer items-center font-bold">
              {t("advancedBoundary")}
            </summary>
            <p className="mb-3 text-small text-ink-muted">{t("boundaryHelp")}</p>
            <label className="grid gap-1 text-small font-semibold">
              {t("boundary")}
              <textarea className="min-h-32 rounded-sm border border-border bg-card px-3 py-2 font-mono text-small" value={area.boundary} onChange={(event) => {
                const next = [...rows];
                next[index] = { ...area, boundary: event.target.value };
                setRows(next);
              }} />
            </label>
            <Preview boundary={area.boundary} />
          </details>
          <Button type="button" onClick={() => void save(area)}>{t("save")}</Button>
          {messages[area.id] ? (
            <Notice tone={messages[area.id].tone}>{messages[area.id].text}</Notice>
          ) : null}
        </Card>
      ))}
    </div>
  );
}
