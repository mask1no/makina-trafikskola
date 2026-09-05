"use client";

import { FormEvent, useState } from "react";
import { signIn } from "next-auth/react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";

export function AuthForm({
  locale,
  mode,
}: {
  locale: string;
  mode: "login" | "register";
}) {
  const t = useTranslations("auth");
  const errors = useTranslations("errors");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [method, setMethod] = useState<"email" | "phone">("email");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [codeSent, setCodeSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function finishAuthentication() {
    const requested = searchParams.get("callbackUrl");
    const destination =
      requested?.startsWith(`/${locale}/`) || requested === `/${locale}`
        ? requested
        : `/${locale}/mina-sidor`;
    router.push(destination);
    router.refresh();
  }

  async function requestCode() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setCodeSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (method === "phone") {
        const response = await fetch("/api/auth/otp/verify", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            phone,
            code,
            ...(mode === "register" ? { firstName, lastName } : {}),
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
        finishAuthentication();
        return;
      }

      if (mode === "register") {
        const response = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            firstName,
            lastName,
            email,
            password,
            locale,
          }),
        });
        const payload = await response.json().catch(() => null);
        if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      }

      const result = await signIn("email-password", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) throw new Error("INVALID_CREDENTIALS");
      finishAuthentication();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
      <fieldset>
        <legend className="sr-only">{t("methodLabel")}</legend>
        <div className="grid grid-cols-2 gap-1 rounded-md border border-border bg-card-muted p-1">
          {(["email", "phone"] as const).map((value) => (
            <button
              key={value}
              type="button"
              aria-pressed={method === value}
              onClick={() => {
                setMethod(value);
                setError("");
              }}
              className="min-h-11 rounded-sm px-3 text-sm font-bold text-ink-muted transition aria-pressed:bg-card aria-pressed:text-ink aria-pressed:shadow-soft"
            >
              {t(`methods.${value}`)}
            </button>
          ))}
        </div>
      </fieldset>
      {mode === "register" ? (
        <>
          <Input
            name="firstName"
            label={t("firstName")}
            value={firstName}
            onChange={(event) => setFirstName(event.target.value)}
            autoComplete="given-name"
            required
          />
          <Input
            name="lastName"
            label={t("lastName")}
            value={lastName}
            onChange={(event) => setLastName(event.target.value)}
            autoComplete="family-name"
            required
          />
        </>
      ) : null}
      {method === "email" ? (
        <>
          <Input
            name="email"
            label={t("email")}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            type="email"
            autoComplete="email"
            required
          />
          <Input
            name="password"
            label={t("password")}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
            minLength={8}
            required
          />
        </>
      ) : (
        <>
          <Input
            name="phone"
            label={t("phone")}
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder={t("phonePlaceholder")}
            required
          />
          {codeSent ? (
            <Input
              name="code"
              label={t("code")}
              value={code}
              onChange={(event) => setCode(event.target.value)}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              maxLength={6}
              required
            />
          ) : null}
        </>
      )}
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </p>
      ) : null}
      {method === "phone" && !codeSent ? (
        <Button
          type="button"
          className="w-full"
          disabled={busy || !phone}
          onClick={requestCode}
        >
          {busy ? t("working") : t("sendCode")}
        </Button>
      ) : (
        <Button type="submit" className="w-full" disabled={busy}>
          {busy
            ? t("working")
            : method === "phone"
              ? t("verifyCode")
              : mode === "login"
                ? t("login.submit")
                : t("register.submit")}
        </Button>
      )}
      {method === "phone" && codeSent ? (
        <button
          type="button"
          onClick={() => {
            setCode("");
            setCodeSent(false);
          }}
          className="min-h-11 text-sm font-bold text-ink underline"
        >
          {t("changePhone")}
        </button>
      ) : null}
      <p className="text-center text-sm text-ink-muted">
        {mode === "login" ? t("login.noAccount") : t("register.hasAccount")}{" "}
        <Link
          className="font-bold text-ink underline"
          href={`/${locale}/${mode === "login" ? "skapa-konto" : "logga-in"}`}
        >
          {mode === "login" ? t("login.create") : t("register.login")}
        </Link>
      </p>
    </form>
  );
}
