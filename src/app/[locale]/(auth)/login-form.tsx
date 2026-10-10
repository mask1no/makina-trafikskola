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

function identifierLooksValid(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return false;
  if (trimmed.includes("@")) return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
  return Boolean(normalizeSwedishPhone(trimmed));
}

export function LoginForm({
  locale,
  googleEnabled = false,
}: {
  locale: string;
  googleEnabled?: boolean;
}) {
  const t = useTranslations("auth");
  const login = useTranslations("auth.login");
  const errorText = useErrorText();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [method, setMethod] = useState<"phone" | "password">("phone");
  const [phone, setPhone] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [devCode, setDevCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [noPhoneAccount, setNoPhoneAccount] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = window.setTimeout(() => setSecondsLeft((current) => current - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [secondsLeft]);

  async function requestCode() {
    setFormError("");
    setPhoneError("");
    setNoPhoneAccount(false);
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
        body: JSON.stringify({ phone: normalized, purpose: "login" }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setPhone(normalized);
      setDevCode(typeof payload?.devCode === "string" ? payload.devCode : "");
      setCodeSent(true);
      setSecondsLeft(60);
    } catch (reason) {
      const code = reason instanceof Error ? reason.message : "UNKNOWN";
      if (code === "NO_ACCOUNT") {
        setNoPhoneAccount(true);
      } else {
        setFormError(errorText(code));
      }
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setFormError("");
    try {
      if (method === "phone") {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ phone, code }),
        });
        const payload = response.status === 204 ? null : await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      } else {
        const normalized = identifier.includes("@")
          ? null
          : normalizeSwedishPhone(identifier);
        if (!identifier.includes("@") && !normalized) {
          throw new Error("INVALID_PHONE");
        }
        const result = await signIn("email-password", {
          ...(normalized ? { phone: normalized } : { email: identifier.trim().toLowerCase() }),
          password,
          redirect: false,
        });
        if (result?.error) throw new Error("INVALID_CREDENTIALS");
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
  const signupHref = next
    ? `/${locale}/skapa-konto?next=${encodeURIComponent(next)}`
    : `/${locale}/skapa-konto`;
  const forgotHref = `/${locale}/glomt-losenord`;

  return (
    <>
    <form onSubmit={submit} className="grid gap-4">
      <fieldset>
        <legend className="sr-only">{t("methodLabel")}</legend>
        <div className="grid grid-cols-2 gap-1 rounded-sm bg-page p-1">
          {(["phone", "email"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={method === (value === "phone" ? "phone" : "password")}
              onClick={() => {
                setMethod(value === "phone" ? "phone" : "password");
                setFormError("");
                setNoPhoneAccount(false);
                setCodeSent(false);
                setCode("");
              }}
              className="min-h-11 rounded-sm px-3 text-small font-bold text-ink-muted aria-pressed:bg-card aria-pressed:text-ink"
            >
              {t(`methods.${value}`)}
            </button>
          ))}
        </div>
      </fieldset>
      {method === "phone" ? (
        <>
          <PhoneField
            label={t("phone")}
            placeholder={t("phonePlaceholder")}
            value={phone}
            onChange={(value) => {
              setPhone(value);
              setNoPhoneAccount(false);
            }}
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
        </>
      ) : (
        <>
          <Input
            name="identifier"
            label={t("identifier")}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            onBlur={() => setIdentifierTouched(true)}
            autoComplete="username"
            required
            valid={identifierTouched && identifierLooksValid(identifier)}
            error={
              identifierTouched && identifier.trim().length > 0 && !identifierLooksValid(identifier)
                ? identifier.includes("@")
                  ? t("emailInvalid")
                  : t("phoneInvalid")
                : undefined
            }
            hint={
              identifierTouched && identifierLooksValid(identifier)
                ? identifier.includes("@")
                  ? t("emailValid")
                  : t("phoneValid")
                : undefined
            }
          />
          <PasswordField
            label={t("password")}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
          <Link href={forgotHref} className="min-h-11 text-small font-bold text-ink underline">
            {t("forgotLink")}
          </Link>
        </>
      )}
      {formError ? (
        <p role="alert" className="text-small text-danger">
          {formError}
        </p>
      ) : null}
      {noPhoneAccount ? (
        <p role="alert" className="text-small text-danger">
          {login("phoneAccountMissing")}{" "}
          <Link className="font-bold underline" href={signupHref}>
            {login("create")}
          </Link>
        </p>
      ) : null}
      {method === "phone" && !codeSent ? (
        <Button type="button" className="w-full" disabled={busy || !phone} onClick={requestCode}>
          {busy ? t("working") : t("sendCode")}
        </Button>
      ) : (
        <Button type="submit" className="w-full" disabled={busy}>
          {busy ? t("working") : login("submit")}
        </Button>
      )}
      <p className="text-center text-small text-ink-muted">
        {login("noAccount")}{" "}
        <Link className="font-bold text-ink underline" href={signupHref}>
          {login("create")}
        </Link>
      </p>
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
