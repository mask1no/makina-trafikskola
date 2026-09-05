"use client";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

type Teacher = { id: string; name: string };

export function AdminBookingControls({
  bookingId,
  startsAt,
  teachers,
  currentTeacherId,
}: {
  bookingId: string;
  startsAt: string;
  teachers: Teacher[];
  currentTeacherId: string;
}) {
  const t = useTranslations("admin.calendar.controls");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<"move" | "cancel" | "reassign">("move");
  const [dateTime, setDateTime] = useState(
    formatInTimeZone(
      new Date(startsAt),
      "Europe/Stockholm",
      "yyyy-MM-dd'T'HH:mm",
    ),
  );
  const [teacherId, setTeacherId] = useState(currentTeacherId);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/bookings/${bookingId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          reason,
          ...(action === "move"
            ? {
                startsAt: fromZonedTime(
                  dateTime,
                  "Europe/Stockholm",
                ).toISOString(),
              }
            : {}),
          ...(action === "reassign" ? { teacherId } : {}),
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setOpen(false);
      router.refresh();
    } catch (reasonValue) {
      setError(
        reasonValue instanceof Error ? reasonValue.message : "UNKNOWN",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="min-h-11 w-full rounded-sm border border-border bg-card px-2 font-bold"
      >
        {open ? t("close") : t("manage")}
      </button>
      {open ? (
        <div className="mt-2 grid gap-2">
          <label className="font-bold" htmlFor={`action-${bookingId}`}>
            {t("action")}
          </label>
          <select
            id={`action-${bookingId}`}
            value={action}
            onChange={(event) =>
              setAction(
                event.target.value as "move" | "cancel" | "reassign",
              )
            }
            className="min-h-11 rounded-sm border border-border bg-card px-2"
          >
            <option value="move">{t("move")}</option>
            <option value="reassign">{t("reassign")}</option>
            <option value="cancel">{t("cancel")}</option>
          </select>
          {action === "move" ? (
            <>
              <label className="font-bold" htmlFor={`time-${bookingId}`}>
                {t("newTime")}
              </label>
              <input
                id={`time-${bookingId}`}
                type="datetime-local"
                value={dateTime}
                onChange={(event) => setDateTime(event.target.value)}
                className="min-h-11 rounded-sm border border-border bg-card px-2"
              />
            </>
          ) : null}
          {action === "reassign" ? (
            <>
              <label className="font-bold" htmlFor={`teacher-${bookingId}`}>
                {t("newInstructor")}
              </label>
              <select
                id={`teacher-${bookingId}`}
                value={teacherId}
                onChange={(event) => setTeacherId(event.target.value)}
                className="min-h-11 rounded-sm border border-border bg-card px-2"
              >
                {teachers.map((teacher) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </select>
            </>
          ) : null}
          <label className="font-bold" htmlFor={`reason-${bookingId}`}>
            {t("reason")}
          </label>
          <textarea
            id={`reason-${bookingId}`}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-20 rounded-sm border border-border bg-card p-2"
            required
          />
          <button
            type="button"
            disabled={busy || reason.trim().length < 3}
            onClick={submit}
            className="min-h-11 rounded-sm bg-accent px-2 font-bold text-accent-ink disabled:opacity-50"
          >
            {busy ? t("saving") : t("save")}
          </button>
          {error ? (
            <p role="alert" className="text-danger">
              {errors.has(error) ? errors(error) : errors("UNKNOWN")}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
