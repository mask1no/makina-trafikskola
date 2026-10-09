"use client";

import { useTranslations } from "next-intl";

import { ChoiceCard } from "@/components/ChoiceCard";
import { formatLessonTime } from "@/lib/format/datetime";

import { localDateKey } from "./dates";
import type { Slot, Teacher } from "./state";

export function ScheduleStep({
  teachers,
  teacherId,
  previews,
  dates,
  selectedDate,
  selectedSlot,
  loading,
  weekOpen,
  locale,
  onTeacher,
  onWeek,
  onDate,
  onSlot,
}: {
  teachers: Teacher[];
  teacherId: string;
  previews: Record<string, Slot[]>;
  dates: { key: string; label: string }[];
  selectedDate: string;
  selectedSlot: string;
  loading: boolean;
  weekOpen: boolean;
  locale: string;
  onTeacher: (id: string) => void;
  onWeek: (open: boolean) => void;
  onDate: (key: string) => void;
  onSlot: (startsAt: string) => void;
}) {
  const t = useTranslations("booking");
  const selectedSlots = previews[teacherId] ?? [];
  const dateSlots = selectedSlots.filter(
    (slot) => localDateKey(slot.startsAt) === selectedDate,
  );
  return (
    <section>
      <h2 className="text-h2 font-black">{t("step.schedule.title")}</h2>
      {teachers.length ? (
        <div className="mt-6 grid gap-3">
          {teachers.map((teacher) => {
            const next = (previews[teacher.id] ?? []).slice(0, 3);
            return (
              <div key={teacher.id} className="grid gap-2">
                <ChoiceCard
                  selected={teacherId === teacher.id}
                  onClick={() => onTeacher(teacher.id)}
                >
                  {teacher.name}
                </ChoiceCard>
                <div className="flex flex-wrap gap-2">
                  {next.map((slot) => (
                    <button
                      key={slot.startsAt}
                      type="button"
                      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-small font-bold ${
                        selectedSlot === slot.startsAt && teacherId === teacher.id
                          ? "border-accent bg-accent text-accent-ink"
                          : "border-[var(--line)] bg-card"
                      }`}
                      onClick={() => {
                        onTeacher(teacher.id);
                        onSlot(slot.startsAt);
                        onDate(localDateKey(slot.startsAt));
                      }}
                    >
                      <bdi dir="ltr">{formatLessonTime(new Date(slot.startsAt), locale)}</bdi>
                    </button>
                  ))}
                </div>
                {teacherId === teacher.id ? (
                  <div className="grid gap-2">
                    {loading ? (
                      <p className="text-small text-ink-muted">{t("step.schedule.loading")}</p>
                    ) : null}
                    {!loading && next.length === 0 ? (
                      <p className="text-small text-ink-muted">{t("step.schedule.empty")}</p>
                    ) : null}
                    <button
                      type="button"
                      className="min-h-11 text-start text-small font-bold underline"
                      onClick={() => onWeek(!weekOpen)}
                    >
                      {t("step.schedule.week")}
                    </button>
                    {weekOpen ? (
                      <div className="grid gap-3">
                        <div className="flex gap-2 overflow-x-auto">
                          {dates.map((date) => (
                            <button
                              key={date.key}
                              type="button"
                              aria-pressed={selectedDate === date.key}
                              className="inline-flex min-h-11 shrink-0 items-center rounded-full border border-[var(--line)] bg-card px-3 text-small font-bold"
                              onClick={() => onDate(date.key)}
                            >
                              {date.label}
                            </button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {dateSlots.map((slot) => (
                            <button
                              key={slot.startsAt}
                              type="button"
                              className={`inline-flex min-h-11 items-center rounded-sm border px-3 text-small font-bold ${
                                selectedSlot === slot.startsAt
                                  ? "border-accent bg-accent text-accent-ink"
                                  : "border-[var(--line)] bg-card"
                              }`}
                              onClick={() => onSlot(slot.startsAt)}
                            >
                              <bdi dir="ltr">{formatLessonTime(new Date(slot.startsAt), locale)}</bdi>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <p className="mt-4 text-ink-muted">{t("step.who.empty")}</p>
      )}
    </section>
  );
}
