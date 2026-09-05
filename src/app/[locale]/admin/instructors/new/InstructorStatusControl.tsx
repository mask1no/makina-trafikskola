"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Notice } from "@/components/Notice";

export function InstructorStatusControl({
  instructor,
}: {
  instructor: { id: string; name: string; active: boolean };
}) {
  const t = useTranslations("admin.instructorStatus");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(
        `/api/admin/instructors/${instructor.id}`,
        {
          method: "PATCH",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ active: !instructor.active }),
        },
      );
      const payload = await response.json().catch(() => null);
      if (!response.ok) {
        throw new Error(payload?.error?.code ?? "UNKNOWN");
      }
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "UNKNOWN");
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-sm border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-bold">{instructor.name}</p>
          <Badge className="mt-2" tone={instructor.active ? "success" : "neutral"}>
            {instructor.active ? t("active") : t("inactive")}
          </Badge>
        </div>
        <Button
          type="button"
          disabled={busy}
          onClick={toggle}
          variant="tertiary"
        >
          {busy
            ? t("saving")
            : instructor.active
              ? t("deactivate")
              : t("activate")}
        </Button>
      </div>
      {error ? (
        <Notice tone="danger" className="mt-2">
          {errors.has(error) ? errors(error) : errors("UNKNOWN")}
        </Notice>
      ) : null}
    </li>
  );
}
