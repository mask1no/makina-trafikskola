"use client";

import Link from "next/link";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { CheckboxField } from "@/components/CheckboxField";
import { Notice } from "@/components/Notice";

type ApiResult = {
  bookingId?: string;
  status?: "CONFIRMED" | "PENDING_PAYMENT";
  url?: string;
  error?: { code?: string };
};

export function CourseBookingControl({
  occasionId,
  disabled,
  authenticated,
  signInHref,
  accountRequired,
  signInToBuy,
}: {
  occasionId: string;
  disabled: boolean;
  authenticated: boolean;
  signInHref: string;
  accountRequired: string;
  signInToBuy: string;
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

  if (!authenticated) {
    return (
      <div className="mt-6 border-t border-border pt-6">
        <p className="text-sm leading-6 text-ink-muted">{accountRequired}</p>
        <Link
          href={signInHref}
          className="mt-4 inline-flex min-h-11 items-center justify-center rounded-sm border border-accent bg-accent px-5 font-bold text-accent-ink transition hover:border-accent-hover hover:bg-accent-hover"
        >
          {signInToBuy}
        </Link>
      </div>
    );
  }

  return (
    <div className="mt-6 border-t border-border pt-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <CheckboxField
          id={`course-terms-${occasionId}`}
          label={t("terms")}
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
        />
        <CheckboxField
          id={`course-withdrawal-${occasionId}`}
          label={t("withdrawal")}
          checked={withdrawalAcknowledged}
          onChange={(event) =>
            setWithdrawalAcknowledged(event.target.checked)
          }
        />
      </div>
      <Button
        className="mt-4 w-full sm:w-auto"
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
        <Notice className="mt-4" tone={message === t("confirmed") ? "success" : "danger"} aria-live="polite">{message}</Notice>
      ) : null}
    </div>
  );
}
