"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Button } from "@/components/Button";
import { LinkButton } from "@/components/LinkButton";
import { Notice } from "@/components/Notice";

export function AccountPrivacyControls({ locale }: { locale: string }) {
  const t = useTranslations("student.profile");
  const errors = useTranslations("errors");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function removeAccount() {
    if (!window.confirm(t("deleteConfirm"))) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/me", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE" }),
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
          onClick={removeAccount}
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
    </section>
  );
}
