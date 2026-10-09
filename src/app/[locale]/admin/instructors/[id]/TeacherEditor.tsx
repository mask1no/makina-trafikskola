"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Card } from "@/components/Card";

type Hour = { dayOfWeek: number; startTime: string; endTime: string; locationId: string };
type Location = { id: string; name: string };

const languages = ["sv", "en", "ti", "ku"] as const;
const gearboxes = ["MANUAL", "AUTOMATIC"] as const;

function weekday(day: number, locale: string) {
  return new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" }).format(
    new Date(Date.UTC(2024, 0, 7 + day)),
  );
}

export function TeacherEditor({
  locale,
  teacherId,
  initial,
  locations,
}: {
  locale: string;
  teacherId: string;
  locations: Location[];
  initial: {
    phone: string;
    languages: string[];
    transmissions: string[];
    locationIds: string[];
    yearsExperience: number;
    googleCalendarEmail: string;
    payRateKr: string;
    hours: Hour[];
    daysOff: string[];
  };
}) {
  const t = useTranslations("admin.editor");
  const [form, setForm] = useState(initial);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  function toggle(list: string[], value: string) {
    return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
  }

  async function save() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/instructors/${teacherId}/profile`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...form,
          yearsExperience: Number(form.yearsExperience),
          payRateKr: form.payRateKr.trim() === "" ? null : Number(form.payRateKr),
        }),
      });
      const body = await response.json().catch(() => null);
      if (!response.ok) throw new Error(body?.error?.code ?? "UNKNOWN");
      setMessage(t("saved"));
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function upload(file: File) {
    const data = new FormData();
    data.set("image", file);
    const response = await fetch(`/api/admin/instructors/${teacherId}/image`, {
      method: "POST",
      body: data,
    });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? t("saved") : body?.error?.code ?? "UNKNOWN");
  }

  async function testCalendar() {
    const response = await fetch(`/api/admin/instructors/${teacherId}/calendar`, { method: "POST" });
    const body = await response.json().catch(() => null);
    setMessage(body?.ok ? "OK" : body?.message ?? body?.error?.code ?? "UNKNOWN");
  }

  return (
    <Card className="grid gap-5">
      <label className="grid gap-2 text-small font-semibold">
        {t("phone")} *
        <input className="min-h-11 rounded-sm border border-border px-3" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
      </label>
      <fieldset>
        <legend className="text-small font-semibold">{t("languages")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {languages.map((code) => (
            <label key={code} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3">
              <input type="checkbox" checked={form.languages.includes(code)} onChange={() => setForm({ ...form, languages: toggle(form.languages, code) })} />
              {code}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-small font-semibold">{t("gearbox")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {gearboxes.map((code) => (
            <label key={code} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3">
              <input type="checkbox" checked={form.transmissions.includes(code)} onChange={() => setForm({ ...form, transmissions: toggle(form.transmissions, code) })} />
              {code === "MANUAL" ? t("manual") : t("automatic")}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-small font-semibold">{t("areas")}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {locations.map((location) => (
            <label key={location.id} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-border px-3">
              <input type="checkbox" checked={form.locationIds.includes(location.id)} onChange={() => setForm({ ...form, locationIds: toggle(form.locationIds, location.id) })} />
              {location.name}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="grid gap-2 text-small font-semibold">
        {t("years")}
        <input className="min-h-11 rounded-sm border border-border px-3" inputMode="numeric" value={form.yearsExperience} onChange={(event) => setForm({ ...form, yearsExperience: Number(event.target.value) })} />
      </label>
      <div className="grid gap-3">
        <p className="text-small font-semibold">{t("hours")}</p>
        {form.hours.map((hour, index) => (
          <div key={index} className="grid gap-2 sm:grid-cols-4">
            <select className="min-h-11 rounded-sm border border-border px-3" value={hour.dayOfWeek} onChange={(event) => {
              const hours = [...form.hours];
              hours[index] = { ...hour, dayOfWeek: Number(event.target.value) };
              setForm({ ...form, hours });
            }}>
              {[0, 1, 2, 3, 4, 5, 6].map((day) => <option key={day} value={day}>{weekday(day, locale)}</option>)}
            </select>
            <input className="min-h-11 rounded-sm border border-border px-3" value={hour.startTime} onChange={(event) => {
              const hours = [...form.hours];
              hours[index] = { ...hour, startTime: event.target.value };
              setForm({ ...form, hours });
            }} />
            <input className="min-h-11 rounded-sm border border-border px-3" value={hour.endTime} onChange={(event) => {
              const hours = [...form.hours];
              hours[index] = { ...hour, endTime: event.target.value };
              setForm({ ...form, hours });
            }} />
            <select className="min-h-11 rounded-sm border border-border px-3" value={hour.locationId} onChange={(event) => {
              const hours = [...form.hours];
              hours[index] = { ...hour, locationId: event.target.value };
              setForm({ ...form, hours });
            }}>
              {locations.map((location) => <option key={location.id} value={location.id}>{location.name}</option>)}
            </select>
          </div>
        ))}
        <Button type="button" variant="secondary" onClick={() => setForm({
          ...form,
          hours: [...form.hours, { dayOfWeek: 1, startTime: "09:00", endTime: "17:00", locationId: locations[0]?.id ?? "" }],
        })}>{t("addHour")}</Button>
      </div>
      <label className="grid gap-2 text-small font-semibold">
        {t("daysOff")}
        <input className="min-h-11 rounded-sm border border-border px-3" placeholder="2026-01-14" onKeyDown={(event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const value = event.currentTarget.value;
          if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return;
          setForm({ ...form, daysOff: [...form.daysOff, value] });
          event.currentTarget.value = "";
        }} />
        <span className="font-normal text-ink-muted">{form.daysOff.join(", ")}</span>
      </label>
      <label className="grid gap-2 text-small font-semibold">
        {t("photo")}
        <input className="min-h-11" type="file" accept="image/jpeg,image/png,image/webp" onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void upload(file);
        }} />
      </label>
      <label className="grid gap-2 text-small font-semibold">
        {t("calendarEmail")}
        <input className="min-h-11 rounded-sm border border-border px-3" value={form.googleCalendarEmail} onChange={(event) => setForm({ ...form, googleCalendarEmail: event.target.value })} />
      </label>
      <Button type="button" variant="secondary" onClick={() => void testCalendar()}>{t("testCalendar")}</Button>
      <label className="grid gap-2 text-small font-semibold">
        {t("payRate")}
        <input className="min-h-11 rounded-sm border border-border px-3" inputMode="numeric" value={form.payRateKr} onChange={(event) => setForm({ ...form, payRateKr: event.target.value })} />
      </label>
      {message ? <p className="text-small font-bold">{message}</p> : null}
      <Button type="button" onClick={() => void save()} disabled={busy}>{t("save")}</Button>
    </Card>
  );
}
