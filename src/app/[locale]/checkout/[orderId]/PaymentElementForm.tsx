"use client";

import {
  PaymentElement,
  useElements,
  useStripe,
} from "@stripe/react-stripe-js";
import { useState } from "react";
import { useTranslations } from "next-intl";

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
    <form onSubmit={submit} aria-busy={submitting}>
      <PaymentElement
        options={{
          layout: "tabs",
          business: { name: t("businessName") },
        }}
      />
      <button
        type="submit"
        disabled={!stripe || !elements || submitting}
        className="mt-6 min-h-11 w-full rounded-sm bg-accent px-5 font-bold text-accent-ink disabled:cursor-not-allowed disabled:bg-border disabled:text-ink-muted"
      >
        {submitting ? t("submitting") : t("submit")}
      </button>
      {error ? (
        <p className="mt-4 text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </form>
  );
}
