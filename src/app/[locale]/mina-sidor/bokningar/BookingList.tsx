"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";

import { Button } from "@/components/Button";
import {
  getCancellationDeadline,
  isLateStudentCancellation,
} from "@/lib/bookings/cancellation";
import { formatStockholm } from "@/lib/format/datetime";
import { Badge } from "@/components/Badge";
import { BottomSheet } from "@/components/BottomSheet";
import { CheckboxField } from "@/components/CheckboxField";
import { EmptyState } from "@/components/EmptyState";

type BookingItem = {
  id: string;
  startsAt: string;
  status: string;
  creditCharged: boolean;
  holdExpiresAt: string | null;
  teacherName: string;
  place: string;
};

export function BookingList({
  locale,
  bookings,
  cancellationWindowHours,
  paymentProductId,
}: {
  locale: string;
  bookings: BookingItem[];
  cancellationWindowHours: number;
  paymentProductId?: string;
}) {
  const t = useTranslations("student.bookings");
  const checkout = useTranslations("booking.checkout");
  const shell = useTranslations("shell");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [cancelling, setCancelling] = useState<string | null>(null);
  const [pendingCancellation, setPendingCancellation] =
    useState<BookingItem | null>(null);
  const [pendingPayment, setPendingPayment] = useState<BookingItem | null>(null);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [withdrawalAcknowledged, setWithdrawalAcknowledged] = useState(false);
  const [paying, setPaying] = useState(false);
  const [lateCancellation, setLateCancellation] = useState(false);
  const [error, setError] = useState("");
  const formatWhen = (date: Date) =>
    formatStockholm(date, locale, {
      weekday: "long",
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  function deadlineFor(startsAt: string) {
    return getCancellationDeadline(new Date(startsAt), cancellationWindowHours);
  }

  function openCancellation(booking: BookingItem) {
    // The cancellation decision must use click time, not render time.
    setLateCancellation(
      isLateStudentCancellation({
        actorRole: "STUDENT",
        startsAt: new Date(booking.startsAt),
        now: new Date(),
        cancellationWindowHours,
      }),
    );
    setPendingCancellation(booking);
  }

  async function cancel(booking: BookingItem) {
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
      setPendingCancellation(null);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setCancelling(null);
    }
  }

  function openPayment(booking: BookingItem) {
    setError("");
    setTermsAccepted(false);
    setWithdrawalAcknowledged(false);
    setPendingPayment(booking);
  }

  async function pay(booking: BookingItem) {
    if (!paymentProductId) return;
    setPaying(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId: paymentProductId,
          quantity: 1,
          bookingId: booking.id,
          termsAccepted,
          withdrawalAcknowledged,
        }),
      });
      const payload = await response.json();
      if (!response.ok || typeof payload.url !== "string") {
        throw new Error(payload.error?.code ?? "UNKNOWN");
      }
      window.location.assign(payload.url);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
      setPaying(false);
    }
  }

  if (!bookings.length) {
    return (
      <div className="mt-6">
        <EmptyState title={t("empty")} description={t("description")} />
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-4">
      {bookings.map((booking) => {
        const deadline = deadlineFor(booking.startsAt);
        const unpaidHold =
          booking.status === "CONFIRMED" && !booking.creditCharged;
        return (
          <article key={booking.id} className="relative overflow-hidden rounded-md border border-border bg-card p-5 shadow-soft sm:p-6">
            <span aria-hidden="true" className="absolute bottom-0 start-0 top-0 w-1 bg-border" />
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="break-words text-lg font-black">
                  <bdi>{formatWhen(new Date(booking.startsAt))}</bdi>
                </p>
                <p className="mt-1 text-sm text-ink-muted">
                  <bdi>{booking.teacherName}</bdi>
                </p>
                <p className="mt-1 text-sm text-ink-muted">{booking.place}</p>
                <Badge className="mt-3" tone={unpaidHold ? "accent" : booking.status === "CONFIRMED" ? "success" : "neutral"}>
                  {unpaidHold ? t("holdStatus") : t(`statuses.${booking.status}`)}
                </Badge>
                {unpaidHold && booking.holdExpiresAt ? (
                  <p className="mt-3 text-sm font-bold text-ink">
                    {t.rich("holdUntil", {
                      deadline: formatWhen(new Date(booking.holdExpiresAt)),
                      time: (chunks) => <bdi>{chunks}</bdi>,
                    })}
                  </p>
                ) : null}
              </div>
              {booking.status === "CONFIRMED" ? (
                <div className="flex shrink-0 flex-wrap gap-2">
                  {unpaidHold && paymentProductId ? (
                    <Button onClick={() => openPayment(booking)}>
                      {t("pay")}
                    </Button>
                  ) : null}
                  <Button
                    variant="tertiary"
                    className="min-h-11 min-w-11"
                    disabled={cancelling === booking.id}
                    onClick={() => openCancellation(booking)}
                  >
                    {t("cancel")}
                  </Button>
                </div>
              ) : null}
            </div>
            {booking.status === "CONFIRMED" && booking.creditCharged ? (
              <p className="mt-4 break-words text-sm text-ink-muted">
                {t.rich("deadline", {
                  deadline: formatWhen(deadline),
                  time: (chunks) => <bdi>{chunks}</bdi>,
                })}
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
      {pendingCancellation ? (
          <BottomSheet
            title={t("cancel")}
            onClose={() => setPendingCancellation(null)}
          >
            <p className="leading-7 text-ink-muted">
              {!pendingCancellation.creditCharged
                ? t("cancelHoldWarning")
                : lateCancellation
                ? t("cancelLateWarning")
                : t.rich("cancelRefundWarning", {
                    deadline: formatWhen(deadlineFor(pendingCancellation.startsAt)),
                    time: (chunks) => <bdi>{chunks}</bdi>,
                  })}
            </p>
            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Button
                variant="tertiary"
                onClick={() => setPendingCancellation(null)}
              >
                {t("keepBooking")}
              </Button>
              <Button
                disabled={cancelling === pendingCancellation.id}
                onClick={() => cancel(pendingCancellation)}
              >
                {t("cancel")}
              </Button>
            </div>
          </BottomSheet>
      ) : null}
      {pendingPayment ? (
        <BottomSheet
          title={checkout("title")}
          onClose={() => {
            if (!paying) setPendingPayment(null);
          }}
        >
          <div className="grid gap-3">
            <CheckboxField
              id="hold-payment-terms"
              label={checkout("termsConsent")}
              checked={termsAccepted}
              onChange={(event) => setTermsAccepted(event.target.checked)}
            />
            <CheckboxField
              id="hold-payment-withdrawal"
              label={checkout("withdrawalConsent")}
              checked={withdrawalAcknowledged}
              onChange={(event) =>
                setWithdrawalAcknowledged(event.target.checked)
              }
            />
            <Link
              href={`/${locale}/villkor`}
              className="inline-flex min-h-11 items-center font-bold underline underline-offset-4"
            >
              {shell("terms")}
            </Link>
            {error ? (
              <p role="alert" className="text-sm font-medium text-danger">
                {errors.has(error) ? errors(error) : errors("UNKNOWN")}
              </p>
            ) : null}
            <Button
              disabled={
                paying || !termsAccepted || !withdrawalAcknowledged
              }
              onClick={() => void pay(pendingPayment)}
            >
              {paying ? t("paying") : checkout("continue")}
            </Button>
          </div>
        </BottomSheet>
      ) : null}
    </div>
  );
}
