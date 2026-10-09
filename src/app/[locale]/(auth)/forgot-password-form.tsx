"use client";

import { FormEvent, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";

import { Button } from "@/components/Button";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import {
  PasswordField,
  PhoneField,
  useErrorText,
} from "./auth-shared";
import { OtpResend } from "./otp-resend";

export function ForgotPasswordForm({ locale }: { locale: string }) {
  const t = useTranslations("auth");
  const forgot = useTranslations("auth.forgot");
  const errorText = useErrorText();
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
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
      const response = await fetch("/api/auth/password/reset", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, code, password }),
      });
      const payload = response.status === 204 ? null : await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setDone(true);
    } catch (reason) {
      setFormError(errorText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="grid gap-4">
        <p className="text-body leading-7 text-ink">{forgot("done")}</p>
        <Link href={`/${locale}/logga-in`} className="min-h-11 font-bold text-ink underline">
          {t("login.submit")}
        </Link>
      </div>
    );
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
      >
        <PasswordField
          label={t("newPassword")}
          value={password}
          onChange={setPassword}
          autoComplete="new-password"
          showLabel={t("showPassword")}
          hideLabel={t("hidePassword")}
        />
      </OtpResend>
      {formError ? (
        <p role="alert" className="text-small text-danger">
          {formError}
        </p>
      ) : null}
      {codeSent ? (
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("working") : forgot("submit")}
        </Button>
      ) : (
        <Button type="button" className="w-full" disabled={busy || !phone} onClick={requestCode}>
          {busy ? t("working") : t("sendCode")}
        </Button>
      )}
    </form>
  );
}
