"use client";

import { useTranslations } from "next-intl";

import { ChoiceCard } from "@/components/ChoiceCard";

import type { Gearbox } from "./state";

export function GearboxStep({
  gearbox,
  onGearbox,
}: {
  gearbox: Gearbox | "";
  onGearbox: (value: Gearbox) => void;
}) {
  const t = useTranslations("booking");
  return (
    <section>
      <h2 className="text-h2 font-black">{t("step.gearbox.title")}</h2>
      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        {(["MANUAL", "AUTOMATIC"] as const).map((value) => (
          <ChoiceCard
            key={value}
            selected={gearbox === value}
            onClick={() => onGearbox(value)}
          >
            {t(value === "MANUAL" ? "step.gearbox.manual" : "step.gearbox.automatic")}
          </ChoiceCard>
        ))}
      </div>
    </section>
  );
}
