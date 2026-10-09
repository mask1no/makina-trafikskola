"use client";

import { useTranslations } from "next-intl";

import { ChoiceCard } from "@/components/ChoiceCard";

import type { Location } from "./state";

export function AreaStep({
  locations,
  areaId,
  onArea,
}: {
  locations: Location[];
  areaId: string;
  onArea: (id: string) => void;
}) {
  const t = useTranslations("booking");
  return (
    <section>
      <h2 className="text-h2 font-black">{t("step.area.title")}</h2>
      <div className="mt-6 grid gap-3">
        {locations.map((location) => {
          const comingSoon = location.status !== "ACTIVE";
          return (
            <ChoiceCard
              key={location.id}
              selected={areaId === location.id}
              disabled={comingSoon}
              onClick={() => onArea(location.id)}
            >
              <span className="block">{location.city || location.name}</span>
              {comingSoon ? (
                <span className="mt-1 block text-small font-semibold text-ink-muted">
                  {t("step.area.comingSoon")}
                </span>
              ) : null}
            </ChoiceCard>
          );
        })}
      </div>
    </section>
  );
}
