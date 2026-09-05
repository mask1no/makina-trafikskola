"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreditAdjustmentForm({ studentId }: { studentId: string }) {
  const t = useTranslations("admin.students.adjustment");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [delta, setDelta] = useState("1");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/students/${studentId}/credits`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ delta: Number(delta), note }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      setNote("");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="mt-6 grid gap-3">
      <h3 className="font-bold">{t("title")}</h3>
      <div className="grid gap-2 sm:grid-cols-[8rem_1fr]">
        <div className="grid gap-2">
          <label htmlFor={`credit-delta-${studentId}`} className="text-sm font-bold">
            {t("delta")}
          </label>
          <input
            id={`credit-delta-${studentId}`}
            type="number"
            min="-100"
            max="100"
            step="1"
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
            className="min-h-11 rounded-sm border border-border bg-card px-3"
            required
          />
        </div>
        <div className="grid gap-2">
          <label htmlFor={`credit-note-${studentId}`} className="text-sm font-bold">
            {t("reason")}
          </label>
          <input
            id={`credit-note-${studentId}`}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            className="min-h-11 rounded-sm border border-border bg-card px-3"
            required
            minLength={3}
          />
        </div>
      </div>
      <button
        type="submit"
        disabled={busy || note.trim().length < 3 || Number(delta) === 0}
        className="min-h-11 rounded-sm bg-accent px-4 font-bold text-accent-ink disabled:opacity-50"
      >
        {busy ? t("saving") : t("submit")}
      </button>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </p>
      ) : null}
    </form>
  );
}
