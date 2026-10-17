"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

import { getOpeningStatus } from "@/lib/company/opening-hours";

type Variant = "inverse" | "default";

type OpeningStatusProps = {
  /** ISO timestamp from the server so SSR and hydration match. */
  initialNow: string;
  variant?: Variant;
  className?: string;
};

export function OpeningStatus({
  initialNow,
  variant = "default",
  className = "",
}: OpeningStatusProps) {
  const t = useTranslations("shell");
  const [now, setNow] = useState(() => new Date(initialNow));

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const status = getOpeningStatus(now);
  const muted =
    variant === "inverse" ? "text-ink-inverse-muted" : "text-ink-muted";

  return (
    <p
      className={`inline-flex min-h-11 items-center gap-2 text-xs leading-5 sm:text-small ${muted} ${className}`}
      role="status"
      aria-live="polite"
    >
      <span
        aria-hidden="true"
        className={`size-2 shrink-0 rounded-full ${
          status.open ? "bg-success-strong" : "bg-danger"
        }`}
      />
      {status.open && status.until ? (
        <span>
          {t("statusOpen", { time: status.until })}
        </span>
      ) : status.next ? (
        <span>
          {status.next.sameDay
            ? t("statusClosedSameDay", { time: status.next.time })
            : t("statusClosedOtherDay", {
                day: t(`weekdayShort.${status.next.weekday}`),
                time: status.next.time,
              })}
        </span>
      ) : (
        <span>{t("closed")}</span>
      )}
    </p>
  );
}
