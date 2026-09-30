"use client";

import { useTranslations } from "next-intl";

import { EmptyState } from "@/components/EmptyState";
import { SlotChip } from "@/components/SlotChip";

import type { Slot } from "./state";

export function WhenStep({
  slots,
  dates,
  selectedDate,
  selectedSlot,
  loadingSlots,
  dateSlots,
  timeFormatter,
  onFirstAvailable,
  onDate,
  onSlot,
}: {
  slots: Slot[];
  dates: { key: string; label: string }[];
  selectedDate: string;
  selectedSlot: string;
  loadingSlots: boolean;
  dateSlots: Slot[];
  timeFormatter: Intl.DateTimeFormat;
  onFirstAvailable: (slot: Slot) => void;
  onDate: (key: string) => void;
  onSlot: (startsAt: string) => void;
}) {
  const t = useTranslations("booking");
  return (
    <section className="min-w-0">
      <h2 className="text-3xl font-black">{t("step.when.title")}</h2>
      {slots[0] ? (
        <button
          type="button"
          onClick={() => onFirstAvailable(slots[0])}
          className="mt-5 flex min-h-14 w-full items-center justify-between rounded-md bg-surface px-4 text-start font-bold text-ink-inverse"
        >
          <span className="min-w-0 break-words">{t("step.when.firstAvailable")}</span>
          <bdi dir="ltr" className="shrink-0">{timeFormatter.format(new Date(slots[0].startsAt))}</bdi>
        </button>
      ) : null}
      <div className="mt-5 flex max-w-full snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-2">
        {dates.map((date) => (
          <button
            type="button"
            key={date.key}
            onClick={() => onDate(date.key)}
            aria-pressed={selectedDate === date.key}
            className={`min-h-14 min-w-24 shrink-0 snap-start break-words hyphens-auto rounded-sm border px-3 text-sm ${
              selectedDate === date.key
                ? "border-accent bg-accent text-accent-ink"
                : "border-border bg-card"
            }`}
          >
            <bdi>{date.label}</bdi>
          </button>
        ))}
      </div>
      {loadingSlots ? (
        <div role="status" className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
          <span className="sr-only">{t("step.when.loading")}</span>
          {Array.from({ length: 8 }, (_, index) => (
            <span key={index} className="min-h-11 animate-pulse rounded-sm bg-page" />
          ))}
        </div>
      ) : null}
      {!loadingSlots ? (
        <div className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-4 sm:gap-3">
          {dateSlots.map((slot) => (
            <SlotChip
              key={slot.startsAt}
              selected={selectedSlot === slot.startsAt}
              onClick={() => onSlot(slot.startsAt)}
            >
              <bdi dir="ltr">{timeFormatter.format(new Date(slot.startsAt))}</bdi>
            </SlotChip>
          ))}
        </div>
      ) : null}
      {!loadingSlots && !dateSlots.length ? (
        <div className="mt-5">
          <EmptyState title={t("step.when.emptyTitle")} description={t("step.when.empty")} />
        </div>
      ) : null}
    </section>
  );
}