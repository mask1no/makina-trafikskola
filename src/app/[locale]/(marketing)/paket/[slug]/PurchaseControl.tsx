"use client";

import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/Button";
import { CheckboxField } from "@/components/CheckboxField";
import { Notice } from "@/components/Notice";
import { telHref } from "@/lib/format/phone";

type Copy = {
  accountRequired: string;
  signInToBuy: string;
  terms: string;
  withdrawal: string;
  submit: string;
  redirecting: string;
  error: string;
};

export function PurchaseControl({
  productId,
  active,
  salesOpen,
  phone,
  callLabel,
  authenticated,
  signInHref,
  inactiveLabel,
  copy,
}: {
  productId: string;
  active: boolean;
  salesOpen: boolean;
  phone: string;
  callLabel: string;
  authenticated: boolean;
  signInHref: string;
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

  if (!salesOpen) {
    return (
      <a
        href={telHref(phone)}
        className="mt-8 inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-surface bg-surface px-5 font-bold text-ink-inverse"
      >
        {callLabel}
      </a>
    );
  }

  if (!active) {
    return (
      <Button className="mt-8 w-full" disabled>
        {inactiveLabel}
      </Button>
    );
  }

  if (!authenticated) {
    return (
      <div className="mt-8 border-t border-border pt-6">
        <p className="text-sm leading-6 text-ink-muted">
          {copy.accountRequired}
        </p>
        <Link
          href={signInHref}
          className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-sm border border-accent bg-accent px-5 font-bold text-accent-ink transition hover:border-accent-hover hover:bg-accent-hover"
        >
          {copy.signInToBuy}
        </Link>
      </div>
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
