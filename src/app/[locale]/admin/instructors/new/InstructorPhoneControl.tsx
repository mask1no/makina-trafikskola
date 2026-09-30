"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/Button";
import { Input } from "@/components/Input";
import { Notice } from "@/components/Notice";

export function InstructorPhoneControl({
  instructor,
}: {
  instructor: { id: string; phone: string | null };
}) {
  const t = useTranslations("admin.instructorPhone");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [phone, setPhone] = useState(instructor.phone ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function save() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/admin/instructors/${instructor.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const payload = await response.json().catch(() => null);
      if (!response.ok) throw new Error(payload?.error?.code ?? "UNKNOWN");
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 grid gap-2">
      {instructor.phone ? (
        <p className="text-sm" dir="ltr">
          <bdi>{instructor.phone}</bdi>
        </p>
      ) : (
        <p className="text-sm font-bold text-danger">{t("missing")}</p>
      )}
      <div className="flex flex-wrap items-end gap-2">
        <Input
          id={`phone-${instructor.id}`}
          name="phone"
          type="tel"
          label={t("label")}
          value={phone}
          onChange={(event) => setPhone(event.target.value)}
          autoComplete="tel"
          dir="ltr"
          required
        />
        <Button type="button" disabled={busy} onClick={save}>
          {busy ? t("saving") : t("save")}
        </Button>
      </div>
      {error ? (
        <Notice tone="danger">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </Notice>
      ) : null}
    </div>
  );
}
