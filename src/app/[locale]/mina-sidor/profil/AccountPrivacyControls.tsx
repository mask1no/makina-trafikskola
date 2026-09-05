"use client";

import { signOut } from "next-auth/react";
import { useTranslations } from "next-intl";
import { useState } from "react";

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
    <section className="mt-8 rounded-md border border-border bg-card p-5">
      <h2 className="text-xl font-bold">{t("privacyTitle")}</h2>
      <p className="mt-2 text-sm leading-6 text-ink-muted">
        {t("privacyDescription")}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        {/* This API response is a file download, not client-side navigation. */}
        {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
        <a
          href="/api/me/export"
          className="inline-flex min-h-11 items-center rounded-sm border border-border px-4 font-bold"
        >
          {t("export")}
        </a>
        <button
          type="button"
          onClick={removeAccount}
          disabled={busy}
          className="min-h-11 rounded-sm border border-danger px-4 font-bold text-danger disabled:opacity-50"
        >
          {busy ? t("deleting") : t("delete")}
        </button>
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-sm text-danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </p>
      ) : null}
    </section>
  );
}
