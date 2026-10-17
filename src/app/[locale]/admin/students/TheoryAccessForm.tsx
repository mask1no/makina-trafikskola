"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

export function TheoryAccessForm({
  studentId,
  active,
}: {
  studentId: string;
  active: boolean;
}) {
  const t = useTranslations("admin.students.theory");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(action: "grant" | "revoke") {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/students/${studentId}/theory`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ action, note }),
      });
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
    <form
      className="mt-6 grid gap-3 border-t border-border pt-6"
      onSubmit={(event) => {
        event.preventDefault();
        void submit(active ? "revoke" : "grant");
      }}
    >
      <h3 className="font-bold">{t("title")}</h3>
      <p className="text-sm leading-6 text-ink-muted">{t("help")}</p>
      <p className="text-sm font-bold">{active ? t("active") : t("inactive")}</p>
      <Input
        id={`theory-note-${studentId}`}
        label={t("reason")}
        value={note}
        onChange={(event) => setNote(event.target.value)}
        required
        minLength={3}
      />
      <Button type="submit" disabled={busy || note.trim().length < 3} variant={active ? "danger" : "primary"}>
        {busy ? t("saving") : active ? t("revoke") : t("grant")}
      </Button>
      {error ? (
        <Notice tone="danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </Notice>
      ) : null}
    </form>
  );
}
