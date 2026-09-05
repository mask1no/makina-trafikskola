"use client";

import { useState } from "react";

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
      <button
        type="button"
        disabled
        className="mt-8 min-h-11 w-full rounded-sm bg-border px-5 font-bold text-ink-muted"
      >
        {inactiveLabel}
      </button>
    );
  }

  return (
    <div className="mt-8">
      <label className="flex min-h-11 items-start gap-3 py-2">
        <input
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">{copy.terms}</span>
      </label>
      <label className="mt-2 flex min-h-11 items-start gap-3 py-2">
        <input
          type="checkbox"
          checked={withdrawalAcknowledged}
          onChange={(event) => setWithdrawalAcknowledged(event.target.checked)}
          className="mt-1"
        />
        <span className="text-sm">{copy.withdrawal}</span>
      </label>
      <button
        type="button"
        disabled={!termsAccepted || !withdrawalAcknowledged || busy}
        onClick={() => void checkout()}
        className="mt-4 min-h-11 w-full rounded-sm bg-accent px-5 font-bold text-accent-ink disabled:cursor-not-allowed disabled:bg-border disabled:text-ink-muted"
      >
        {busy ? copy.redirecting : copy.submit}
      </button>
      {error ? <p className="mt-3 text-sm text-danger" role="alert">{error}</p> : null}
    </div>
  );
}
