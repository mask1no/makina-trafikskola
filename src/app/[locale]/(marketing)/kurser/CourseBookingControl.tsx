"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";

type ApiResult = {
  bookingId?: string;
  status?: "CONFIRMED" | "PENDING_PAYMENT";
  url?: string;
  error?: { code?: string };
};

export function CourseBookingControl({
  occasionId,
  disabled,
}: {
  occasionId: string;
  disabled: boolean;
}) {
  const t = useTranslations("courses.booking");
  const errors = useTranslations("errors");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [withdrawalAcknowledged, setWithdrawalAcknowledged] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>();

  async function submit() {
    setSubmitting(true);
    setMessage(undefined);
    try {
      const response = await fetch("/api/courses/bookings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          occasionId,
          termsAccepted,
          withdrawalAcknowledged,
        }),
      });
      const result = (await response.json()) as ApiResult;
      if (!response.ok) {
        const code = result.error?.code ?? "INVALID_INPUT";
        setMessage(errors.has(code) ? errors(code) : errors("INVALID_INPUT"));
        return;
      }
      if (result.url) {
        window.location.assign(result.url);
        return;
      }
      setMessage(t("confirmed"));
    } catch {
      setMessage(t("failed"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mt-5 border-t border-border pt-5">
      <label className="flex min-h-11 items-start gap-3">
        <input
          className="mt-1 size-5 shrink-0 accent-accent"
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
        />
        <span>{t("terms")}</span>
      </label>
      <label className="mt-2 flex min-h-11 items-start gap-3">
        <input
          className="mt-1 size-5 shrink-0 accent-accent"
          type="checkbox"
          checked={withdrawalAcknowledged}
          onChange={(event) =>
            setWithdrawalAcknowledged(event.target.checked)
          }
        />
        <span>{t("withdrawal")}</span>
      </label>
      <Button
        className="mt-3 min-h-11"
        type="button"
        disabled={
          disabled ||
          submitting ||
          !termsAccepted ||
          !withdrawalAcknowledged
        }
        onClick={submit}
      >
        {submitting ? t("submitting") : t("submit")}
      </Button>
      {message ? (
        <p className="mt-3 text-sm" role="status" aria-live="polite">
          {message}
        </p>
      ) : null}
    </div>
  );
}
