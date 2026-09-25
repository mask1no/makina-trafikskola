"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";

export function ReviewActions({ reviewId }: { reviewId: string }) {
  const t = useTranslations("admin.reviews");
  const errors = useTranslations("errors");
  const router = useRouter();
  const [busy, setBusy] = useState<"publish" | "reject" | null>(null);
  const [error, setError] = useState("");

  async function decide(decision: "publish" | "reject") {
    setBusy(decision);
    setError("");
    try {
      const response = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ decision }),
      });
      if (!response.ok) {
        const payload = await response.json().catch(() => null);
        const code = payload?.error?.code ?? "UNKNOWN";
        throw new Error(errors.has(code) ? errors(code) : errors("UNKNOWN"));
      }
      router.refresh();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : errors("UNKNOWN"));
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          disabled={busy !== null}
          onClick={() => decide("publish")}
        >
          {busy === "publish" ? t("saving") : t("publish")}
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={busy !== null}
          onClick={() => decide("reject")}
        >
          {busy === "reject" ? t("saving") : t("reject")}
        </Button>
      </div>
      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
