"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";
import { Select } from "@/components/Select";

type Hour = { dayOfWeek: number; startTime: string; endTime: string; locationId: string };
type Location = { id: string; name: string };

const KNOWN_ERRORS = new Set([
  "HOURS_OVERLAP",
  "LOCATION_NOT_ASSIGNED",
  "INVALID_INPUT",
  "TEACHER_NOT_FOUND",
  "UNAUTHENTICATED",
  "FORBIDDEN",
]);

function weekday(day: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + day)),
  );
}

export function HoursEditor({
  locale,
  initial,
  locations,
}: {
  locale: string;
  initial: Hour[];
  locations: Location[];
}) {
  const t = useTranslations("teacherPortal.hours");
  const [hours, setHours] = useState<Hour[]>(initial);
  const [status, setStatus] = useState<{ tone: "success" | "danger"; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  function update(index: number, patch: Partial<Hour>) {
    setHours((current) =>
      current.map((hour, hourIndex) => (hourIndex === index ? { ...hour, ...patch } : hour)),
    );
  }

  async function save() {
    setBusy(true);
    setStatus(null);
    try {
      const response = await fetch("/api/teacher/availability", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ hours }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => null);
        const code = String(body?.error?.code ?? "UNKNOWN");
        setStatus({
          tone: "danger",
          text: t(`errors.${KNOWN_ERRORS.has(code) ? code : "UNKNOWN"}`),
        });
        return;
      }
      setStatus({ tone: "success", text: t("saved") });
    } catch {
      setStatus({ tone: "danger", text: t("errors.UNKNOWN") });
    } finally {
      setBusy(false);
    }
  }

  if (!locations.length) {
    return <Notice tone="danger" className="mt-5">{t("noLocations")}</Notice>;
  }

  return (
    <div className="mt-5 grid gap-4">
      {hours.length ? null : <p className="text-ink-muted">{t("empty")}</p>}
      {hours.map((hour, index) => (
        <fieldset
          key={index}
          className="grid gap-3 rounded-md border border-border bg-page p-4 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_1fr_1.2fr_auto] lg:items-end"
        >
          <legend className="sr-only">{t("row", { n: index + 1 })}</legend>
          <Select
            id={`hours-day-${index}`}
            label={t("day")}
            value={hour.dayOfWeek}
            onChange={(event) => update(index, { dayOfWeek: Number(event.target.value) })}
          >
            {[1, 2, 3, 4, 5, 6, 0].map((day) => (
              <option key={day} value={day}>{weekday(day, locale)}</option>
            ))}
          </Select>
          <Input
            id={`hours-from-${index}`}
            type="time"
            label={t("from")}
            value={hour.startTime}
            onChange={(event) => update(index, { startTime: event.target.value })}
            dir="ltr"
            required
          />
          <Input
            id={`hours-to-${index}`}
            type="time"
            label={t("to")}
            value={hour.endTime}
            onChange={(event) => update(index, { endTime: event.target.value })}
            dir="ltr"
            required
          />
          <Select
            id={`hours-area-${index}`}
            label={t("area")}
            value={hour.locationId}
            onChange={(event) => update(index, { locationId: event.target.value })}
          >
            {locations.map((location) => (
              <option key={location.id} value={location.id}>{location.name}</option>
            ))}
          </Select>
          <Button
            type="button"
            variant="ghost"
            className="min-h-11"
            onClick={() => setHours((current) => current.filter((_, hourIndex) => hourIndex !== index))}
          >
            {t("remove")}
          </Button>
        </fieldset>
      ))}
      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          variant="secondary"
          onClick={() =>
            setHours((current) => [
              ...current,
              { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", locationId: locations[0]?.id ?? "" },
            ])
          }
        >
          {t("add")}
        </Button>
        <Button type="button" onClick={() => void save()} disabled={busy}>
          {t("save")}
        </Button>
      </div>
      {status ? <Notice tone={status.tone}>{status.text}</Notice> : null}
    </div>
  );
}
