"use client";

import { useRef, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";

import { normalizeSwedishPhone } from "@/lib/auth/phone";
import { safeRedirect } from "@/lib/auth/safe-redirect";

export function destinationFor(locale: string, searchParams: URLSearchParams) {
  return safeRedirect(
    searchParams.get("next") ?? searchParams.get("callbackUrl"),
    locale,
  );
}

export function useErrorText() {
  const errors = useTranslations("errors");
  return (code: string) => (errors.has(code) ? errors(code) : errors("UNKNOWN"));
}

export function PhoneField({
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
  const t = useTranslations("auth");
  const [touched, setTouched] = useState(false);
  const normalized = value.trim() ? normalizeSwedishPhone(value) : null;
  const invalid = touched && value.trim().length > 0 && !normalized;
  const valid = touched && Boolean(normalized);
  const hint = error || (invalid ? t("phoneInvalid") : valid ? t("phoneValid") : "");
  return (
    <div className="grid gap-2">
      <label className="grid gap-2 text-small font-semibold text-ink" htmlFor="phone">
        <span>
          {label}
          {" *"}
        </span>
        <span
          className={`flex overflow-hidden rounded-sm border bg-card shadow-soft focus-within:border-ink ${
            error || invalid ? "border-danger" : valid ? "border-success" : "border-border"
          }`}
        >
          <span className="flex min-h-11 items-center border-e border-border bg-page px-3 text-small font-bold text-ink" dir="ltr">
            +46
          </span>
          <input
            id="phone"
            name="phone"
            dir="ltr"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            required
            placeholder={placeholder}
            value={value}
            disabled={disabled}
            onBlur={() => setTouched(true)}
            onChange={(event) => onChange(event.target.value)}
            aria-invalid={Boolean(error || invalid)}
            aria-describedby={hint ? "phone-error" : undefined}
            className="min-h-11 w-full bg-transparent px-4 text-body text-ink outline-none placeholder:text-ink-subtle"
          />
        </span>
      </label>
      {hint ? (
        <p id="phone-error" role={error || invalid ? "alert" : undefined} className={`text-small font-medium ${error || invalid ? "text-danger" : "text-success"}`}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

export function PasswordField({
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
      <label className="grid gap-2 text-small font-semibold text-ink" htmlFor="password">
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
            className="min-h-11 w-full rounded-sm border border-border bg-card px-4 pe-14 text-body text-ink shadow-soft outline-none focus:border-ink"
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
        <p id="password-error" role="alert" className="text-small font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function GoogleButton({
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
      <p className="text-center text-small text-ink-muted">{t("or")}</p>
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
    </div>
  );
}
