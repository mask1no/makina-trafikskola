"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Notice } from "@/components/Notice";
import {
  PAYMENT_POLL_MAX_MS,
  PAYMENT_POLL_MS,
  paymentPollView,
} from "@/lib/payments/status-poll";

export function PaymentStatusPoller({
  orderId,
  locale,
  initialStatus,
}: {
  orderId: string;
  locale: string;
  initialStatus: string;
}) {
  const t = useTranslations("student.payments");
  const router = useRouter();
  const [status, setStatus] = useState(initialStatus);
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    if (status !== "PENDING") return;
    const started = Date.now();
    let cancelled = false;

    async function tick() {
      if (cancelled) return;
      const elapsed = Date.now() - started;
      if (paymentPollView(status, elapsed).kind === "slow") {
        setTimedOut(true);
        return;
      }
      try {
        const response = await fetch(`/api/me/orders/${orderId}`, {
          cache: "no-store",
        });
        if (response.ok) {
          const payload = (await response.json()) as { status?: string };
          if (payload.status && payload.status !== "PENDING") {
            setStatus(payload.status);
            router.refresh();
            return;
          }
        }
      } catch {
        // keep polling
      }
      window.setTimeout(() => void tick(), PAYMENT_POLL_MS);
    }

    const timer = window.setTimeout(() => void tick(), PAYMENT_POLL_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [orderId, router, status]);

  const view = paymentPollView(
    status,
    timedOut ? PAYMENT_POLL_MAX_MS : 0,
  );

  if (view.kind === "paid") {
    return (
      <Notice className="mt-6" tone="success">
        {t("live.paid")}
      </Notice>
    );
  }
  if (view.kind === "failed") {
    return (
      <Notice className="mt-6" tone="danger">
        {t("live.failed")}
      </Notice>
    );
  }
  if (view.kind === "slow") {
    return (
      <Notice className="mt-6">
        <p>{t("live.slow")}</p>
        <Link
          href={`/${locale}/mina-sidor`}
          className="mt-3 inline-flex min-h-11 items-center font-bold underline"
        >
          {t("live.myPages")}
        </Link>
      </Notice>
    );
  }
  if (view.kind === "pending") {
    return (
      <Notice className="mt-6">
        {t("live.pending")}
      </Notice>
    );
  }
  return null;
}
