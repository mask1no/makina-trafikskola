import { z } from "zod";

export const timeSchema = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);

export const weeklyHourSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: timeSchema,
  endTime: timeSchema,
  locationId: z.string().cuid(),
});

export const weeklyHoursSchema = z.array(weeklyHourSchema).max(50);

/** True when a range is empty/inverted or two ranges overlap on the same day. */
export function hoursOverlap(
  hours: { dayOfWeek: number; startTime: string; endTime: string }[],
) {
  const byDay = new Map<number, typeof hours>();
  for (const hour of hours) {
    if (hour.startTime >= hour.endTime) return true;
    const list = byDay.get(hour.dayOfWeek) ?? [];
    list.push(hour);
    byDay.set(hour.dayOfWeek, list);
  }
  for (const list of byDay.values()) {
    const sorted = [...list].sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let index = 1; index < sorted.length; index += 1) {
      const previous = sorted[index - 1];
      const current = sorted[index];
      if (previous && current && current.startTime < previous.endTime) return true;
    }
  }
  return false;
}
