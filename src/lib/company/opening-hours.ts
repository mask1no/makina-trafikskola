import { formatStockholm, stockholmParts } from "@/lib/format/datetime";

export type DayHours = { open: string; close: string } | null;

/** Sunday-first, matching JavaScript's weekday index. Europe/Stockholm wall clock. */
export const companyOpeningHours: readonly DayHours[] = [
  null,
  { open: "08:00", close: "21:00" },
  { open: "08:00", close: "21:00" },
  { open: "08:00", close: "21:00" },
  { open: "08:00", close: "21:00" },
  { open: "08:00", close: "21:00" },
  { open: "08:00", close: "19:00" },
];

const WEEKDAY_INDEX: Record<string, number> = {
  Sun: 0,
  Mon: 1,
  Tue: 2,
  Wed: 3,
  Thu: 4,
  Fri: 5,
  Sat: 6,
};

function weekdayIndex(now: Date) {
  const label = formatStockholm(now, "en-US", { weekday: "short" });
  return WEEKDAY_INDEX[label] ?? 0;
}

function minutes(value: string) {
  const [hour, minute] = value.split(":");
  return Number(hour) * 60 + Number(minute);
}

export function todayHours(now: Date, hours: readonly DayHours[] = companyOpeningHours) {
  return hours[weekdayIndex(now)] ?? null;
}

const SCHEMA_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export function openingHoursSpecification(
  hours: readonly DayHours[] = companyOpeningHours,
) {
  return hours.flatMap((day, index) =>
    day
      ? [
          {
            "@type": "OpeningHoursSpecification" as const,
            dayOfWeek: SCHEMA_DAYS[index],
            opens: day.open,
            closes: day.close,
          },
        ]
      : [],
  );
}

export function isOpenNow(now: Date, hours: readonly DayHours[] = companyOpeningHours) {
  const today = todayHours(now, hours);
  if (!today) return false;
  const parts = stockholmParts(now);
  const current = parts.hour * 60 + parts.minute;
  return current >= minutes(today.open) && current < minutes(today.close);
}

export type NextOpening = {
  time: string;
  weekday: number;
  sameDay: boolean;
};

/** Next time the school opens. Same day before opening, otherwise the next open weekday. */
export function nextOpening(
  now: Date,
  hours: readonly DayHours[] = companyOpeningHours,
): NextOpening | null {
  const index = weekdayIndex(now);
  const today = hours[index] ?? null;
  const parts = stockholmParts(now);
  const current = parts.hour * 60 + parts.minute;
  if (today && current < minutes(today.open)) {
    return { time: today.open, weekday: index, sameDay: true };
  }
  for (let offset = 1; offset <= 7; offset += 1) {
    const weekday = (index + offset) % 7;
    const slot = hours[weekday];
    if (slot) return { time: slot.open, weekday, sameDay: false };
  }
  return null;
}
