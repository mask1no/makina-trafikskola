"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import {
  PhoneField,
  destinationFor,
  useErrorText,
} from "./auth-shared";
import { OtpResend } from "./otp-resend";

export function VerifyPhoneForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const verify = useTranslations("auth.verifyPhone");
  const errorText = useErrorText();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [phoneError, setPhoneError] = useState("");

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function requestCode() {
    setFormError("");
    setPhoneError("");
    const normalized = normalizeSwedishPhone(phone);
    if (!normalized) {
      setPhoneError(errorText("INVALID_PHONE"));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone: normalized }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setPhone(normalized);
      setDevCode(typeof payload?.devCode === "string" ? payload.devCode : "");
      setCodeSent(true);
      setSecondsLeft(60);
    } catch (reason) {
      setFormError(errorText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      const response = await fetch("/api/auth/phone/link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code }),
      });
      const payload = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      router.push(destinationFor(locale, searchParams));
      router.refresh();
    } catch (reason) {
      setFormError(errorText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <PhoneField
        label={t("phone")}
        placeholder={t("phonePlaceholder")}
        value={phone}
        onChange={setPhone}
        error={phoneError}
        disabled={codeSent}
      />
      <OtpResend
        code={code}
        onCodeChange={setCode}
        codeSent={codeSent}
        secondsLeft={secondsLeft}
        devCode={devCode}
        busy={busy}
        onResend={requestCode}
      />
      {formError ? (
        <p role="alert" className="text-small text-danger">
          {formError}
        </p>
      ) : null}
      {codeSent ? (
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("working") : verify("submit")}
        </Button>
      ) : (
        <Button type="button" className="w-full" disabled={busy || !phone} onClick={requestCode}>
          {busy ? t("working") : t("sendCode")}
        </Button>
      )}
    </form>
  );
}
