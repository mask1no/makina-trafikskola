"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/Button";
import { BottomSheet } from "@/components/BottomSheet";
import { Input } from "@/components/Input";
import { LinkButton } from "@/components/LinkButton";
import { Notice } from "@/components/Notice";

export function AccountPrivacyControls({
  locale,
  phone,
}: {
  locale: string;
  phone: string | null;
}) {
  const t = useTranslations("student.profile");
  const errors = useTranslations("errors");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");

  async function requestDeleteCode() {
    if (!phone) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/auth/otp/request", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone, purpose: "phone-link" }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      setCodeSent(true);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  async function removeAccount() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/me", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE", code }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      await signOut({ callbackUrl: `/${locale}` });
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-md border border-danger bg-danger-soft p-5 sm:p-6">
      <h2 className="text-xl font-bold">{t("privacyTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        {t("privacyDescription")}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <LinkButton
          href="/api/me/export"
          variant="tertiary"
        >
          {t("export")}
        </LinkButton>
        <Button
          type="button"
          onClick={() => {
            setDeleteOpen(true);
            setError("");
          }}
          disabled={busy}
          variant="tertiary"
          className="border-danger text-danger hover:bg-danger-soft"
        >
          {busy ? t("deleting") : t("delete")}
        </Button>
      </div>
      {error ? (
        <Notice tone="danger" className="mt-3">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </Notice>
      ) : null}
      {deleteOpen ? (
        <BottomSheet
          title={t("delete")}
          onClose={() => {
            if (!busy) {
              setDeleteOpen(false);
              setCodeSent(false);
              setCode("");
            }
          }}
        >
          <p className="leading-7 text-ink-muted">{t("deleteConfirm")}</p>
          {!phone ? (
            <Notice className="mt-4" tone="danger">
              {t("deletePhoneRequired")}
            </Notice>
          ) : !codeSent ? (
            <Button
              className="mt-5 w-full"
              type="button"
              disabled={busy}
              onClick={() => void requestDeleteCode()}
            >
              {busy ? t("requestingCodes") : t("deleteSendCode")}
            </Button>
          ) : (
            <div className="mt-5 grid gap-4">
              <Input
                id="delete-account-code"
                label={t("deleteCode")}
                inputMode="numeric"
                autoComplete="one-time-code"
                maxLength={6}
                value={code}
                onChange={(event) => setCode(event.target.value)}
                required
              />
              <Button
                type="button"
                disabled={busy || code.length !== 6}
                className="border-danger bg-danger text-ink-inverse hover:bg-danger"
                onClick={() => void removeAccount()}
              >
                {busy ? t("deleting") : t("deleteConfirmAction")}
              </Button>
            </div>
          )}
          {error ? (
            <Notice className="mt-4" tone="danger">
              {errors.has(error) ? errors(error) : errors("UNKNOWN")}
            </Notice>
          ) : null}
        </BottomSheet>
      ) : null}
    </section>
  );
}
