"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { safeRedirect } from "@/lib/auth/safe-redirect";

function destinationFor(locale: string, searchParams: URLSearchParams) {
  return safeRedirect(
    searchParams.get("next") ?? searchParams.get("callbackUrl"),
    locale,
  );
}

function useErrorText() {
  const errors = useTranslations("errors");
  return (code: string) => (errors.has(code) ? errors(code) : errors("UNKNOWN"));
}

function PhoneField({
  label,
  placeholder,
  value,
  onChange,
  error,
  disabled,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  disabled?: boolean;
}) {
  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor="phone">
        <span>{label}</span>
        <span className="flex overflow-hidden rounded-sm border border-border bg-card shadow-soft focus-within:border-ink">
          <span className="flex min-h-11 items-center border-e border-border bg-page px-3 text-sm font-bold text-ink" dir="ltr">
            +46
          </span>
          <input
            id="phone"
            name="phone"
            dir="ltr"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "phone-error" : undefined}
            className="min-h-11 w-full bg-transparent px-4 text-ink outline-none placeholder:text-ink-subtle"
          />
        </span>
      </label>
      {error ? (
        <p id="phone-error" role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function PasswordField({
  label,
  value,
  onChange,
  autoComplete,
  error,
  showLabel,
  hideLabel,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete: string;
  error?: string;
  showLabel: string;
  hideLabel: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-sm font-semibold text-ink" htmlFor="password">
        <span>{label}</span>
        <span className="relative">
          <input
            id="password"
            name="password"
            type={visible ? "text" : "password"}
            autoComplete={autoComplete}
            minLength={8}
            required
            value={value}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? "password-error" : undefined}
            className="min-h-11 w-full rounded-sm border border-border bg-card px-4 pe-14 text-ink shadow-soft outline-none focus:border-ink"
          />
          <button
            type="button"
            className="absolute inset-y-0 end-0 flex min-h-11 min-w-11 items-center justify-center text-ink"
            aria-label={visible ? hideLabel : showLabel}
            onClick={() => setVisible((current) => !current)}
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8">
              {visible ? (
                <path d="M3 3l18 18M10.5 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-1M9.9 5.2A10.8 10.8 0 0 1 12 5c5.5 0 9.5 4.2 11 7-0.6 1.1-1.6 2.4-2.9 3.5M6.1 6.3C4.2 7.6 2.8 9.3 2 12c1.5 2.8 5.5 7 10 7 1.2 0 2.3-.2 3.3-.6" />
              ) : (
                <path d="M2 12c1.5-2.8 5.5-7 10-7s8.5 4.2 10 7c-1.5 2.8-5.5 7-10 7S3.5 14.8 2 12zm10 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6z" />
              )}
            </svg>
          </button>
        </span>
      </label>
      {error ? (
        <p id="password-error" role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function GoogleButton({
  enabled,
  label,
  destination,
}: {
  enabled: boolean;
  label: string;
  destination: string;
}) {
  const t = useTranslations("auth");
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  if (!enabled) return null;
  return (
    <div className="grid gap-4">
      <button
        type="button"
        disabled={busy}
        className="flex min-h-11 w-full items-center justify-center gap-3 rounded-sm border border-[var(--google-border)] bg-card px-4 text-base font-medium text-[var(--google-ink)] disabled:opacity-60"
        onClick={async () => {
          if (busyRef.current) return;
          busyRef.current = true;
          setBusy(true);
          const locale = destination.split("/").filter(Boolean)[0] ?? "sv";
          const callbackUrl = `/${locale}/verifiera-mobil?next=${encodeURIComponent(destination)}`;
          await signIn("google", { callbackUrl });
        }}
      >
        <svg aria-hidden="true" viewBox="0 0 18 18" className="size-[18px]">
          <path fill="var(--google-blue)" d="M17.64 9.205c0-.638-.057-1.252-.164-1.841H9v3.482h4.844a4.14 4.14 0 0 1-1.797 2.716v2.258h2.909c1.703-1.568 2.684-3.878 2.684-6.615Z" />
          <path fill="var(--google-green)" d="M9 18c2.43 0 4.468-.806 5.956-2.18l-2.909-2.258c-.806.54-1.835.859-3.047.859-2.344 0-4.328-1.585-5.037-3.714H.956v2.332A9 9 0 0 0 9 18Z" />
          <path fill="var(--google-yellow)" d="M3.963 10.707A5.41 5.41 0 0 1 3.682 9c0-.592.102-1.168.281-1.707V4.961H.956A9 9 0 0 0 0 9c0 1.452.347 2.827.956 4.039l3.007-2.332Z" />
          <path fill="var(--google-red)" d="M9 3.579c1.321 0 2.507.454 3.441 1.346l2.581-2.581C13.464.892 11.426 0 9 0A9 9 0 0 0 .956 4.961l3.007 2.332C4.672 5.164 6.656 3.579 9 3.579Z" />
        </svg>
        {busy ? t("working") : label}
      </button>
      <p className="text-center text-sm text-ink-muted">{t("or")}</p>
    </div>
  );
}

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
    <form onSubmit={submit} className="grid gap-4">
      <GoogleButton
        enabled={googleEnabled}
        label={t("continueWithGoogle")}
        destination={safeRedirect(
          searchParams.get("next") ?? searchParams.get("callbackUrl"),
          locale,
        )}
      />
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
        onChange={(event) => setEmail(event.target.value)}
        type="email"
        autoComplete="email"
        required
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
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-premium ${
          codeSent ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-3 pt-1">
            <Input
              name="code"
              label={t("code")}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required={codeSent}
              disabled={!codeSent}
            />
            <p className="text-sm leading-6 text-ink-muted">{t("codeSentHint")}</p>
            {devCode ? (
              <p className="rounded-sm bg-page p-3 text-sm text-ink">
                {t("devCode", { code: devCode })}
              </p>
            ) : null}
            <button
              type="button"
              onClick={requestCode}
              disabled={busy || secondsLeft > 0}
              className="min-h-11 text-start text-sm font-bold text-ink underline disabled:no-underline disabled:opacity-60"
            >
              {secondsLeft > 0
                ? t("resendWait", { seconds: secondsLeft })
                : t("resendCode")}
            </button>
          </div>
        </div>
      </div>
      {formError ? (
        <p role="alert" className="text-sm text-danger">
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
        <p className="text-center text-sm text-ink-muted">
          {register("hasAccount")}{" "}
          <Link className="font-bold text-ink underline" href={loginHref}>
            {register("login")}
          </Link>
        </p>
      )}
    </form>
  );
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
    <form onSubmit={submit} className="grid gap-4">
      <GoogleButton
        enabled={googleEnabled}
        label={t("continueWithGoogle")}
        destination={safeRedirect(
          searchParams.get("next") ?? searchParams.get("callbackUrl"),
          locale,
        )}
      />
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
              className="min-h-11 rounded-sm px-3 text-sm font-bold text-ink-muted aria-pressed:bg-card aria-pressed:text-ink"
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
          <div
            className={`grid transition-[grid-template-rows] duration-200 ease-premium ${
              codeSent ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
            }`}
          >
            <div className="overflow-hidden">
              <div className="grid gap-3 pt-1">
                <Input
                  name="code"
                  label={t("code")}
                  value={code}
                  onChange={(event) => setCode(event.target.value)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  pattern="[0-9]{6}"
                  maxLength={6}
                  required={codeSent}
                  disabled={!codeSent}
                />
                {devCode ? (
                  <p className="rounded-sm bg-page p-3 text-sm text-ink">
                    {t("devCode", { code: devCode })}
                  </p>
                ) : null}
                <button
                  type="button"
                  onClick={requestCode}
                  disabled={busy || secondsLeft > 0}
                  className="min-h-11 text-start text-sm font-bold text-ink underline disabled:opacity-60"
                >
                  {secondsLeft > 0
                    ? t("resendWait", { seconds: secondsLeft })
                    : t("resendCode")}
                </button>
              </div>
            </div>
          </div>
        </>
      ) : (
        <>
          <Input
            name="identifier"
            label={t("identifier")}
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            autoComplete="username"
            required
          />
          <PasswordField
            label={t("password")}
            value={password}
            onChange={setPassword}
            autoComplete="current-password"
            showLabel={t("showPassword")}
            hideLabel={t("hidePassword")}
          />
          <Link href={forgotHref} className="min-h-11 text-sm font-bold text-ink underline">
            {t("forgotLink")}
          </Link>
        </>
      )}
      {formError ? (
        <p role="alert" className="text-sm text-danger">
          {formError}
        </p>
      ) : null}
      {noPhoneAccount ? (
        <p role="alert" className="text-sm text-danger">
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
      <p className="text-center text-sm text-ink-muted">
        {login("noAccount")}{" "}
        <Link className="font-bold text-ink underline" href={signupHref}>
          {login("create")}
        </Link>
      </p>
    </form>
  );
}

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
        <p className="text-sm leading-6 text-ink">{forgot("done")}</p>
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
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-premium ${
          codeSent ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-3 pt-1">
            <Input
              name="code"
              label={t("code")}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required={codeSent}
              disabled={!codeSent}
            />
            {devCode ? (
              <p className="rounded-sm bg-page p-3 text-sm">{t("devCode", { code: devCode })}</p>
            ) : null}
            <PasswordField
              label={t("newPassword")}
              value={password}
              onChange={setPassword}
              autoComplete="new-password"
              showLabel={t("showPassword")}
              hideLabel={t("hidePassword")}
            />
            <button
              type="button"
              onClick={requestCode}
              disabled={busy || secondsLeft > 0}
              className="min-h-11 text-start text-sm font-bold text-ink underline disabled:opacity-60"
            >
              {secondsLeft > 0 ? t("resendWait", { seconds: secondsLeft }) : t("resendCode")}
            </button>
          </div>
        </div>
      </div>
      {formError ? (
        <p role="alert" className="text-sm text-danger">
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
      <div
        className={`grid transition-[grid-template-rows] duration-200 ease-premium ${
          codeSent ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="overflow-hidden">
          <div className="grid gap-3 pt-1">
            <Input
              name="code"
              label={t("code")}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              required={codeSent}
              disabled={!codeSent}
            />
            {devCode ? (
              <p className="rounded-sm bg-page p-3 text-sm">{t("devCode", { code: devCode })}</p>
            ) : null}
            <button
              type="button"
              onClick={requestCode}
              disabled={busy || secondsLeft > 0}
              className="min-h-11 text-start text-sm font-bold text-ink underline disabled:opacity-60"
            >
              {secondsLeft > 0 ? t("resendWait", { seconds: secondsLeft }) : t("resendCode")}
            </button>
          </div>
        </div>
      </div>
      {formError ? (
        <p role="alert" className="text-sm text-danger">
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
