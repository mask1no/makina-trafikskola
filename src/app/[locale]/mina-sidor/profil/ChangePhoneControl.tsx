"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

type OtpResponse = {
  devCode?: string;
  error?: { code?: string };
};

export function ChangePhoneControl({
  currentPhone,
}: {
  currentPhone: string;
}) {
  const t = useTranslations("student.profile");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [currentCode, setCurrentCode] = useState("");
  const [newCode, setNewCode] = useState("");
  const [codesSent, setCodesSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [devCodes, setDevCodes] = useState<{
    current?: string;
    next?: string;
  }>({});

  async function requestCode(target: string) {
    const response = await fetch("/api/auth/otp/request", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ phone: target, purpose: "phone-link" }),
    });
    const payload = (await response.json()) as OtpResponse;
    if (!response.ok) {
      throw new Error(payload.error?.code ?? "UNKNOWN");
    }
    return payload.devCode;
  }

  async function requestCodes() {
    setBusy(true);
    setError("");
    setSuccess(false);
    try {
      const currentDevCode = await requestCode(currentPhone);
      const nextDevCode = await requestCode(phone);
      setDevCodes({ current: currentDevCode, next: nextDevCode });
      setCodesSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/me/phone", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, currentCode, newCode }),
      });
      if (!response.ok) {
        const payload = (await response.json()) as OtpResponse;
        throw new Error(payload.error?.code ?? "UNKNOWN");
      }
      setSuccess(true);
      setOpen(false);
      setCodesSent(false);
      setCurrentCode("");
      setNewCode("");
      setPhone("");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-6 rounded-md border border-border bg-card p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold">{t("changePhone")}</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-ink-muted">
            {t("changePhoneDescription")}
          </p>
        </div>
        <Button
          type="button"
          variant="tertiary"
          onClick={() => {
            setOpen((value) => !value);
            setError("");
          }}
        >
          {open ? t("closePhoneChange") : t("changePhone")}
        </Button>
      </div>

      {open ? (
        <div className="mt-5 grid gap-4 border-t border-border pt-5">
          <Input
            id="new-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            label={t("newPhone")}
            value={phone}
            onChange={(event) => {
              setPhone(event.target.value);
              setCodesSent(false);
            }}
            required
          />
          {!codesSent ? (
            <Button
              type="button"
              disabled={busy || phone.trim().length < 3}
              onClick={() => void requestCodes()}
            >
              {busy ? t("requestingCodes") : t("sendCodes")}
            </Button>
          ) : (
            <>
              <p className="text-sm leading-6 text-ink-muted">
                {t("codesDescription")}
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  id="current-phone-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  label={t("currentPhoneCode")}
                  value={currentCode}
                  onChange={(event) => setCurrentCode(event.target.value)}
                  maxLength={6}
                  required
                  hint={devCodes.current}
                />
                <Input
                  id="new-phone-code"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  label={t("newPhoneCode")}
                  value={newCode}
                  onChange={(event) => setNewCode(event.target.value)}
                  maxLength={6}
                  required
                  hint={devCodes.next}
                />
              </div>
              <Button
                type="button"
                disabled={
                  busy || currentCode.length !== 6 || newCode.length !== 6
                }
                onClick={() => void save()}
              >
                {busy ? t("savingPhone") : t("verifyPhone")}
              </Button>
            </>
          )}
        </div>
      ) : null}

      {success ? (
        <Notice className="mt-4" tone="success">{t("phoneChanged")}</Notice>
      ) : null}
      {error ? (
        <Notice className="mt-4" tone="danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </Notice>
      ) : null}
    </section>
  );
}
