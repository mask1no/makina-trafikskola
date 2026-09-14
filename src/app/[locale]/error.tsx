"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";

import { Button } from "@/components/Button";

export default function LocaleError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_SENTRY_DSN) {
      void import("@sentry/nextjs").then((sdk) => sdk.captureException(error));
    }
  }, [error]);

  return (
    <div className="site-container grid min-h-[60vh] place-items-center py-16">
      <div className="w-full max-w-lg rounded-lg border border-border bg-card p-8 text-center shadow-card sm:p-10">
        <span
          aria-hidden="true"
          className="mx-auto grid size-14 place-items-center rounded-full bg-accent text-2xl font-black text-accent-ink"
        >
          !
        </span>
        <h1 className="mt-6 text-3xl font-black">{t("pageTitle")}</h1>
        <p className="mt-3 text-ink-muted" role="alert">
          {t("UNKNOWN")}
        </p>
        <Button className="mt-6" onClick={reset}>
          {t("retry")}
        </Button>
      </div>
    </div>
  );
}
