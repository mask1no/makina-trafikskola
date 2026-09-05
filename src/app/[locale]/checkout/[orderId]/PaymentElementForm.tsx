"use client";

import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";

export function PaymentElementForm({
  returnUrl,
}: {
  returnUrl: string;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const t = useTranslations("checkout");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError("");
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
    });
    if (result.error) {
      setError(result.error.message ?? t("genericError"));
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} aria-busy={submitting || !ready}>
      {!ready ? (
        <div className="mb-5 grid gap-3" role="status">
          <span className="sr-only">{t("loading")}</span>
          <span className="h-12 animate-pulse rounded-sm bg-page" />
          <span className="h-12 animate-pulse rounded-sm bg-page" />
        </div>
      ) : null}
      <PaymentElement
        onReady={() => setReady(true)}
        options={{
          layout: "tabs",
          business: { name: t("businessName") },
        }}
      />
      <Button
        type="submit"
        disabled={!stripe || !elements || submitting || !ready}
        className="mt-6 w-full"
      >
        {submitting ? t("submitting") : t("submit")}
      </Button>
      {error ? (
        <Notice className="mt-4" tone="danger">{error}</Notice>
      ) : null}
    </form>
  );
}
