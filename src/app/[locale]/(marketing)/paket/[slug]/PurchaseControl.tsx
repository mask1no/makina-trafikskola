"use client";

import { useState } from "react";

import { Button } from "@/components/Button";
import { CheckboxField } from "@/components/CheckboxField";
import { Notice } from "@/components/Notice";

type Copy = {
  terms: string;
  withdrawal: string;
  submit: string;
  redirecting: string;
  error: string;
};

export function PurchaseControl({
  productId,
  active,
  inactiveLabel,
  copy,
}: {
  productId: string;
  active: boolean;
  inactiveLabel: string;
  copy: Copy;
}) {
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [withdrawalAcknowledged, setWithdrawalAcknowledged] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function checkout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          productId,
          quantity: 1,
          termsAccepted,
          withdrawalAcknowledged,
        }),
      });
      const body = await response.json();
      if (!response.ok || typeof body.url !== "string") {
        throw new Error(body.error?.code);
      }
      window.location.assign(body.url);
    } catch {
      setError(copy.error);
      setBusy(false);
    }
  }

  if (!active) {
    return (
      <Button className="mt-8 w-full" disabled>
        {inactiveLabel}
      </Button>
    );
  }

  return (
    <div className="mt-8 border-t border-border pt-6">
      <div className="grid gap-3">
        <CheckboxField
          id="purchase-terms"
          label={copy.terms}
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
        />
        <CheckboxField
          id="purchase-withdrawal"
          label={copy.withdrawal}
          checked={withdrawalAcknowledged}
          onChange={(event) => setWithdrawalAcknowledged(event.target.checked)}
        />
      </div>
      <Button
        disabled={!termsAccepted || !withdrawalAcknowledged || busy}
        onClick={() => void checkout()}
        className="mt-4 w-full"
      >
        {busy ? copy.redirecting : copy.submit}
      </Button>
      {error ? <Notice className="mt-3" tone="danger">{error}</Notice> : null}
    </div>
  );
}
