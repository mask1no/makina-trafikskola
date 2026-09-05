"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";

import { PaymentElementForm } from "./PaymentElementForm";

const stripePromise = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
  ? loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  : null;

export function StripePaymentElement({
  clientSecret,
  returnUrl,
}: {
  clientSecret: string;
  returnUrl: string;
}) {
  if (!stripePromise) return null;

  return (
    <Elements
      stripe={stripePromise}
      options={{
        clientSecret,
        appearance: {
          variables: {
            colorPrimary: "var(--accent)",
            colorText: "var(--ink)",
            colorDanger: "var(--danger)",
            colorBackground: "var(--card)",
            borderRadius: "12px",
            fontFamily: "inherit",
            spacingUnit: "4px",
            fontSizeBase: "16px",
          },
          rules: {
            ".Input": {
              border: "1px solid var(--border)",
              boxShadow: "none",
              padding: "12px",
            },
            ".Input:focus": {
              borderColor: "var(--ink)",
              boxShadow: "0 0 0 2px var(--accent)",
            },
            ".Tab": {
              border: "1px solid var(--border)",
              boxShadow: "none",
              padding: "12px",
            },
            ".Tab--selected": {
              borderColor: "var(--ink)",
              boxShadow: "0 0 0 2px var(--accent)",
            },
          },
        },
      }}
    >
      <PaymentElementForm returnUrl={returnUrl} />
    </Elements>
  );
}
