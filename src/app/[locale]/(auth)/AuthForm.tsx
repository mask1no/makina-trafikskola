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
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
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
      const requested = searchParams.get("callbackUrl");
      const destination =
        requested?.startsWith(`/${locale}/`) || requested === `/${locale}`
          ? requested
          : `/${locale}/mina-sidor`;
      router.push(destination);
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="grid gap-4">
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
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </p>
      ) : null}
      <Button type="submit" className="w-full" disabled={busy}>
        {mode === "login" ? t("login.submit") : t("register.submit")}
      </Button>
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
