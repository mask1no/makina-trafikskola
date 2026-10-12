"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { formatInTimeZone, fromZonedTime } from "date-fns-tz";

import { Button } from "@/components/Button";
import { BottomSheet } from "@/components/BottomSheet";
import { Card } from "@/components/Card";

type Course = { id: string; label: string };
type Occasion = {
  id: string;
  courseId: string;
  startsAt: string;
  endsAt: string;
  venueName: string;
  venueAddress: string;
  capacity: number;
  language: string;
  cancelled: boolean;
  booked: number;
};

function localInput(iso: string) {
  return formatInTimeZone(new Date(iso), "Europe/Stockholm", "yyyy-MM-dd'T'HH:mm");
}

function emptyOccasion(courseId = ""): Occasion {
  return {
    id: "",
    courseId,
    startsAt: "",
    endsAt: "",
    venueName: "",
    venueAddress: "",
    capacity: 1,
    language: "sv",
    cancelled: false,
    booked: 0,
  };
}

type Risk1Defaults = {
  id: string;
  recurrenceEnabled: boolean;
  recurrenceDays: number[];
  defaultStartTime: string;
  durationMinutes: number;
  defaultCapacity: number;
  defaultVenueName: string;
  defaultVenueAddress: string;
};

export function CoursesEditor({
  courses,
  initialOccasions,
  risk1Defaults,
}: {
  courses: Course[];
  initialOccasions: Occasion[];
  risk1Defaults?: Risk1Defaults | null;
}) {
  const t = useTranslations("admin.courses");
  const router = useRouter();
  const [rows, setRows] = useState(
    initialOccasions.map((row) => ({
      ...row,
      startsAt: localInput(row.startsAt),
      endsAt: localInput(row.endsAt),
    })),
  );
  const [draft, setDraft] = useState(emptyOccasion(courses[0]?.id));
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState("");
  const [pendingCancel, setPendingCancel] = useState<Occasion | null>(null);
  const [risk1, setRisk1] = useState(risk1Defaults ?? null);

  async function save(row: Occasion, create = false) {
    setBusy(create ? "create" : row.id);
    setMessage("");
    if (
      !row.courseId ||
      !row.startsAt ||
      !row.endsAt ||
      !row.venueName.trim() ||
      !row.venueAddress.trim()
    ) {
      setMessage(t("error"));
      setBusy("");
      return;
    }
    const response = await fetch(
      create ? "/api/admin/courses/occasions" : `/api/admin/courses/occasions/${row.id}`,
      {
        method: create ? "POST" : "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ...(create ? {} : { action: "edit" }),
          courseId: row.courseId,
          startsAt: fromZonedTime(row.startsAt, "Europe/Stockholm").toISOString(),
          endsAt: fromZonedTime(row.endsAt, "Europe/Stockholm").toISOString(),
          venueName: row.venueName,
          venueAddress: row.venueAddress,
          capacity: row.capacity,
          language: row.language,
        }),
      },
    );
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? t(create ? "created" : "saved") : body?.error?.code ?? t("error"));
    setBusy("");
    if (response.ok) {
      if (create) setDraft(emptyOccasion(courses[0]?.id));
      router.refresh();
    }
  }

  async function cancel(id: string) {
    setBusy(id);
    const response = await fetch(`/api/admin/courses/occasions/${id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ action: "cancel", confirm: true }),
    });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? t("cancelled") : body?.error?.code ?? t("error"));
    setBusy("");
    if (response.ok) {
      setRows((value) => value.map((row) => row.id === id ? { ...row, cancelled: true } : row));
      setPendingCancel(null);
      router.refresh();
    }
  }

  function fields(row: Occasion, update: (value: Occasion) => void) {
    return (
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1 text-small font-semibold">
          {t("course")}
          <select className="min-h-11 rounded-sm border border-border bg-card px-3" value={row.courseId} onChange={(event) => update({ ...row, courseId: event.target.value })}>
            {courses.map((course) => <option key={course.id} value={course.id}>{course.label}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-small font-semibold">
          {t("language")}
          <select className="min-h-11 rounded-sm border border-border bg-card px-3" value={row.language} onChange={(event) => update({ ...row, language: event.target.value })}>
            {["sv", "en", "ti", "ku"].map((language) => <option key={language} value={language}>{language.toUpperCase()}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-small font-semibold">
          {t("startsAt")}
          <input required type="datetime-local" className="min-h-11 rounded-sm border border-border px-3" value={row.startsAt} onChange={(event) => update({ ...row, startsAt: event.target.value })} />
        </label>
        <label className="grid gap-1 text-small font-semibold">
          {t("endsAt")}
          <input required type="datetime-local" className="min-h-11 rounded-sm border border-border px-3" value={row.endsAt} onChange={(event) => update({ ...row, endsAt: event.target.value })} />
        </label>
        <label className="grid gap-1 text-small font-semibold">
          {t("venueName")}
          <input required className="min-h-11 rounded-sm border border-border px-3" value={row.venueName} onChange={(event) => update({ ...row, venueName: event.target.value })} />
        </label>
        <label className="grid gap-1 text-small font-semibold">
          {t("venueAddress")}
          <input required className="min-h-11 rounded-sm border border-border px-3" value={row.venueAddress} onChange={(event) => update({ ...row, venueAddress: event.target.value })} />
        </label>
        <label className="grid gap-1 text-small font-semibold">
          {t("capacity")}
          <input required type="number" min={1} max={500} className="min-h-11 rounded-sm border border-border px-3" value={row.capacity} onChange={(event) => update({ ...row, capacity: Number(event.target.value) })} />
        </label>
      </div>
    );
  }

  async function saveRisk1() {
    if (!risk1) return;
    setBusy("risk1");
    setMessage("");
    const response = await fetch(`/api/admin/courses/${risk1.id}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        recurrenceEnabled: risk1.recurrenceEnabled,
        recurrenceDays: risk1.recurrenceDays,
        defaultStartTime: risk1.defaultStartTime,
        durationMinutes: risk1.durationMinutes,
        defaultCapacity: risk1.defaultCapacity,
        defaultVenueName: risk1.defaultVenueName,
        defaultVenueAddress: risk1.defaultVenueAddress,
      }),
    });
    const body = await response.json().catch(() => null);
    setMessage(response.ok ? t("saved") : body?.error?.code ?? t("error"));
    setBusy("");
    if (response.ok) router.refresh();
  }

  return (
    <div className="grid gap-6">
      {risk1 ? (
        <Card className="grid gap-4">
          <h2 className="text-h3 font-black">{t("recurrenceTitle")}</h2>
          <p className="text-ink-muted">{t("recurrenceHelp")}</p>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-small font-semibold">
              {t("startTime")}
              <input
                type="time"
                className="min-h-11 rounded-sm border border-border px-3"
                value={risk1.defaultStartTime}
                onChange={(event) =>
                  setRisk1({ ...risk1, defaultStartTime: event.target.value })
                }
              />
            </label>
            <label className="grid gap-1 text-small font-semibold">
              {t("duration")}
              <input
                type="number"
                min={30}
                max={720}
                className="min-h-11 rounded-sm border border-border px-3"
                value={risk1.durationMinutes}
                onChange={(event) =>
                  setRisk1({
                    ...risk1,
                    durationMinutes: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="grid gap-1 text-small font-semibold">
              {t("capacityDefault")}
              <input
                type="number"
                min={1}
                max={200}
                className="min-h-11 rounded-sm border border-border px-3"
                value={risk1.defaultCapacity}
                onChange={(event) =>
                  setRisk1({
                    ...risk1,
                    defaultCapacity: Number(event.target.value),
                  })
                }
              />
            </label>
            <label className="grid gap-1 text-small font-semibold">
              {t("days")}
              <input
                className="min-h-11 rounded-sm border border-border px-3"
                value={risk1.recurrenceDays.join(",")}
                onChange={(event) =>
                  setRisk1({
                    ...risk1,
                    recurrenceDays: event.target.value
                      .split(",")
                      .map((part) => Number(part.trim()))
                      .filter((day) => Number.isFinite(day) && day >= 1 && day <= 28),
                  })
                }
              />
            </label>
            <label className="grid gap-1 text-small font-semibold">
              {t("venueNameDefault")}
              <input
                className="min-h-11 rounded-sm border border-border px-3"
                value={risk1.defaultVenueName}
                onChange={(event) =>
                  setRisk1({ ...risk1, defaultVenueName: event.target.value })
                }
              />
            </label>
            <label className="grid gap-1 text-small font-semibold">
              {t("venueAddressDefault")}
              <input
                className="min-h-11 rounded-sm border border-border px-3"
                value={risk1.defaultVenueAddress}
                onChange={(event) =>
                  setRisk1({
                    ...risk1,
                    defaultVenueAddress: event.target.value,
                  })
                }
              />
            </label>
          </div>
          <Button
            type="button"
            disabled={busy === "risk1"}
            onClick={() => void saveRisk1()}
          >
            {busy === "risk1" ? t("saving") : t("saveRecurrence")}
          </Button>
        </Card>
      ) : null}
      <Card className="grid gap-4">
        <h2 className="text-h3 font-black">{t("createTitle")}</h2>
        {fields(draft, setDraft)}
        <Button type="button" disabled={!courses.length || busy === "create"} onClick={() => void save(draft, true)}>
          {busy === "create" ? t("saving") : t("create")}
        </Button>
      </Card>
      {rows.map((row, index) => (
        <Card key={row.id} className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-black">{t("occasion", { count: index + 1 })}</h2>
            <p className="text-small text-ink-muted">
              {t("booked", { booked: row.booked, capacity: row.capacity })}
            </p>
          </div>
          {row.cancelled ? <p className="font-bold text-danger">{t("cancelled")}</p> : null}
          {fields(row, (value) => setRows((current) => current.map((item) => item.id === row.id ? value : item)))}
          <div className="flex flex-wrap gap-3">
            <Button type="button" disabled={Boolean(busy) || row.cancelled} onClick={() => void save(row)}>
              {busy === row.id ? t("saving") : t("save")}
            </Button>
            <Button type="button" variant="tertiary" disabled={Boolean(busy) || row.cancelled} onClick={() => setPendingCancel(row)}>
              {t("cancel")}
            </Button>
          </div>
        </Card>
      ))}
      {message ? <p className="font-bold" role="status">{message}</p> : null}
      {pendingCancel ? (
        <BottomSheet
          title={t("cancelConfirmTitle")}
          onClose={() => {
            if (!busy) setPendingCancel(null);
          }}
        >
          <p className="leading-7 text-ink-muted">
            {t("cancelConfirm", {
              booked: pendingCancel.booked,
              capacity: pendingCancel.capacity,
            })}
          </p>
          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            <Button
              type="button"
              variant="tertiary"
              onClick={() => setPendingCancel(null)}
            >
              {t("keep")}
            </Button>
            <Button
              type="button"
              disabled={Boolean(busy) || pendingCancel.booked > 0}
              onClick={() => void cancel(pendingCancel.id)}
            >
              {busy ? t("saving") : t("cancel")}
            </Button>
          </div>
          {pendingCancel.booked > 0 ? (
            <p className="mt-4 text-sm font-bold text-danger">
              {t("cancelBlocked")}
            </p>
          ) : null}
        </BottomSheet>
      ) : null}
    </div>
  );
}
