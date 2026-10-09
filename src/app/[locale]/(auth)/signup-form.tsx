"use client";

import { FormEvent, useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { safeRedirect } from "@/lib/auth/safe-redirect";
import {
  GoogleButton,
  PasswordField,
  PhoneField,
  destinationFor,
  useErrorText,
} from "./auth-shared";
import { OtpResend } from "./otp-resend";

export function SignupForm({
  locale,
  googleEnabled = false,
  onAuthenticated,
}: {
  locale: string;
  googleEnabled?: boolean;
  onAuthenticated?: () => void | Promise<void>;
}) {
  const t = useTranslations("auth");
  const register = useTranslations("auth.register");
  const errorText = useErrorText();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
  const emailHint = emailTouched ? (emailValid ? t("emailValid") : t("emailInvalid")) : "";
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");

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
    setFormError("");
    setPasswordError("");
    setPhoneError("");
    if (password.length < 8) {
      setPasswordError(errorText("INVALID_INPUT"));
      return;
    }
    const normalized = normalizeSwedishPhone(phone);
    if (!normalized) {
      setPhoneError(errorText("INVALID_PHONE"));
      return;
    }
    if (!codeSent || code.length !== 6) {
      setFormError(errorText("INVALID_OTP"));
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          fullName,
          email,
          phone: normalized,
          password,
          code,
          locale,
        }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      const result = await signIn("email-password", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("INVALID_CREDENTIALS");
      if (onAuthenticated) {
        await onAuthenticated();
        return;
      }
      router.push(destinationFor(locale, searchParams));
      router.refresh();
    } catch (reason) {
      setFormError(errorText(reason instanceof Error ? reason.message : "UNKNOWN"));
    } finally {
      setBusy(false);
    }
  }

  const next = searchParams.get("next") ?? searchParams.get("callbackUrl");
  const loginHref = next
    ? `/${locale}/logga-in?next=${encodeURIComponent(next)}`
    : `/${locale}/logga-in`;

  return (
    <>
    <form onSubmit={submit} className="grid gap-4">
      <Input
        name="fullName"
        label={t("fullName")}
        value={fullName}
        onChange={(event) => setFullName(event.target.value)}
        autoComplete="name"
        required
      />
      <Input
        name="email"
        label={t("email")}
        value={email}
        required
        hint={emailValid ? emailHint : undefined}
        valid={emailTouched && emailValid}
        error={emailTouched && !emailValid ? emailHint : undefined}
        onBlur={() => setEmailTouched(true)}
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        autoComplete="email"
      />
      <PhoneField
        label={t("phone")}
        placeholder={t("phonePlaceholder")}
        value={phone}
        onChange={setPhone}
        error={phoneError}
        disabled={codeSent}
      />
      <PasswordField
        label={t("password")}
        value={password}
        onChange={setPassword}
        autoComplete="new-password"
        error={passwordError}
        showLabel={t("showPassword")}
        hideLabel={t("hidePassword")}
      />
      <OtpResend
        code={code}
        onCodeChange={setCode}
        codeSent={codeSent}
        secondsLeft={secondsLeft}
        devCode={devCode}
        busy={busy}
        onResend={requestCode}
        hint
      />
      {formError ? (
        <p role="alert" className="text-small text-danger">
          {formError}
        </p>
      ) : null}
      {codeSent ? (
        <Button
          type="submit"
          className={
            onAuthenticated
              ? "sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 w-full md:static"
              : "w-full"
          }
          disabled={busy}
        >
          {busy ? t("working") : register("submit")}
        </Button>
      ) : (
        <Button
          type="button"
          className={
            onAuthenticated
              ? "sticky bottom-[calc(4.5rem+env(safe-area-inset-bottom))] z-30 w-full md:static"
              : "w-full"
          }
          disabled={busy || !phone}
          onClick={requestCode}
        >
          {busy ? t("working") : t("sendCode")}
        </Button>
      )}
      {onAuthenticated ? null : (
        <p className="text-center text-small text-ink-muted">
          {register("hasAccount")}{" "}
          <Link className="font-bold text-ink underline" href={loginHref}>
            {register("login")}
          </Link>
        </p>
      )}
    </form>
    <GoogleButton
      enabled={googleEnabled}
      label={t("continueWithGoogle")}
      destination={safeRedirect(
        searchParams.get("next") ?? searchParams.get("callbackUrl"),
        locale,
      )}
    />
    </>
  );
}
