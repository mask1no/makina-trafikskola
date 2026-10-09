"use client";

import { useTranslations } from "next-intl";

import type { BookingKind, Product } from "./state";

export function WhatStep({
  products,
  kind,
  loadingCredits,
  creditBalance,
  onKind,
}: {
  products: Product[];
  kind: BookingKind;
  loadingCredits: boolean;
  creditBalance: number | null;
  onKind: (kind: BookingKind) => void;
}) {
  const t = useTranslations("booking");
  return (
    <section>
      <h2 className="text-3xl font-black">{t("step.what.title")}</h2>
      <p className="mt-2 text-ink-muted">{t("step.what.description")}</p>
      <div className="mt-6 grid gap-2">
        {(["single", "credits"] as const).map((option) => {
          const product = products.find((item) => item.kind === "SINGLE_LESSON");
          return (
            <button
              type="button"
              key={option}
              onClick={() => onKind(option)}
              aria-pressed={kind === option}
              className={`min-h-20 break-words hyphens-auto border-b px-1 py-4 text-start transition ${
                kind === option
                  ? "border-ink"
                  : "border-border hover:border-ink-muted"
              }`}
            >
              <span className="font-bold">{t(`step.what.${option}`)}</span>
              {option !== "credits" && product && !product.active ? (
                <span className="mt-1 block text-sm text-ink-muted">
                  {t("provisional")}
                </span>
              ) : null}
              {option === "credits" && kind === "credits" ? (
                <span className="mt-1 block text-sm text-ink-muted">
                  {loadingCredits
                    ? t("credits.loading")
                    : creditBalance === null
                      ? t("credits.signIn")
                      : t("credits.balance", { count: creditBalance, n: String(creditBalance) })}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
    </section>
  );
}
