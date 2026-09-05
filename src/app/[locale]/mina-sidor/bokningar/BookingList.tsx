"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";

type BookingItem = {
  id: string;
  startsAt: string;
  status: string;
  teacherName: string;
  place: string;
};

export function BookingList({
  locale,
  bookings,
  cancellationWindowHours,
}: {
  locale: string;
  bookings: BookingItem[];
  cancellationWindowHours: number;
}) {
  const t = useTranslations("student.bookings");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [error, setError] = useState("");
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: "Europe/Stockholm",
    weekday: "long",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

  async function cancel(booking: BookingItem) {
    const deadline = new Date(
      new Date(booking.startsAt).getTime() -
        cancellationWindowHours * 60 * 60 * 1000,
    );
    // The cancellation decision must use click time, not render time.
    // eslint-disable-next-line react-hooks/purity
    const isLate = Date.now() >= deadline.getTime();
    const confirmed = window.confirm(
      isLate
        ? t("cancelLateWarning")
        : t("cancelRefundWarning", {
            deadline: dateFormatter.format(deadline),
          }),
    );
    if (!confirmed) return;
    const id = booking.id;
    setCancelling(id);
    setError("");
    try {
      const response = await fetch(`/api/bookings/${id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action: "cancel" }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error?.code ?? "UNKNOWN");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setCancelling(null);
    }
  }

  if (!bookings.length) {
    return <p className="mt-6 rounded-md border border-border bg-card p-6 text-ink-muted">{t("empty")}</p>;
  }

  return (
    <div className="mt-6 grid gap-4">
      {bookings.map((booking) => {
        const deadline = new Date(
          new Date(booking.startsAt).getTime() -
            cancellationWindowHours * 60 * 60 * 1000,
        );
        return (
          <article key={booking.id} className="rounded-md border border-border bg-card p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-lg font-bold">
                  {dateFormatter.format(new Date(booking.startsAt))}
                </p>
                <p className="mt-1 text-sm text-ink-muted">{booking.teacherName}</p>
                <p className="mt-1 text-sm text-ink-muted">{booking.place}</p>
                <p className="mt-3 text-sm">
                  {t("status", { status: t(`statuses.${booking.status}`) })}
                </p>
              </div>
              {booking.status === "CONFIRMED" ? (
                <Button
                  variant="tertiary"
                  disabled={cancelling === booking.id}
                  onClick={() => cancel(booking)}
                >
                  {t("cancel")}
                </Button>
              ) : null}
            </div>
            {booking.status === "CONFIRMED" ? (
              <p className="mt-4 text-sm text-ink-muted">
                {t("deadline", { deadline: dateFormatter.format(deadline) })}
              </p>
            ) : null}
          </article>
        );
      })}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </p>
      ) : null}
    </div>
  );
}
