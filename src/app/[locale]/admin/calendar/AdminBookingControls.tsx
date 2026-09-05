"use client";

import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Select } from "@/components/Select";
import { Textarea } from "@/components/Textarea";

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
      <Button
        type="button"
        onClick={() => setOpen((value) => !value)}
        variant="tertiary"
        className="w-full"
      >
        {open ? t("close") : t("manage")}
      </Button>
      {open ? (
        <div className="mt-3 grid gap-3 border-t border-border pt-3">
          <Select
            id={`action-${bookingId}`}
            label={t("action")}
            value={action}
            onChange={(event) =>
              setAction(
                event.target.value as "move" | "cancel" | "reassign",
              )
            }
          >
            <option value="move">{t("move")}</option>
            <option value="reassign">{t("reassign")}</option>
            <option value="cancel">{t("cancel")}</option>
          </Select>
          {action === "move" ? (
              <Input
                id={`time-${bookingId}`}
                label={t("newTime")}
                type="datetime-local"
                value={dateTime}
                onChange={(event) => setDateTime(event.target.value)}
              />
          ) : null}
          {action === "reassign" ? (
              <Select
                id={`teacher-${bookingId}`}
                label={t("newInstructor")}
                value={teacherId}
                onChange={(event) => setTeacherId(event.target.value)}
              >
                {teachers.map((teacher) => (
                  <option value={teacher.id} key={teacher.id}>
                    {teacher.name}
                  </option>
                ))}
              </Select>
          ) : null}
          <Textarea
            id={`reason-${bookingId}`}
            label={t("reason")}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            className="min-h-20"
            required
          />
          <Button
            type="button"
            disabled={busy || reason.trim().length < 3}
            onClick={submit}
          >
            {busy ? t("saving") : t("save")}
          </Button>
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
