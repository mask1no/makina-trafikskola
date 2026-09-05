"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

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
          <Input
            id={`credit-delta-${studentId}`}
            label={t("delta")}
            type="number"
            min="-100"
            max="100"
            step="1"
            value={delta}
            onChange={(event) => setDelta(event.target.value)}
            required
          />
          <Input
            id={`credit-note-${studentId}`}
            label={t("reason")}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            required
            minLength={3}
          />
      </div>
      <Button
        type="submit"
        disabled={busy || note.trim().length < 3 || Number(delta) === 0}
      >
        {busy ? t("saving") : t("submit")}
      </Button>
      {error ? (
        <Notice tone="danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </Notice>
      ) : null}
    </form>
  );
}
