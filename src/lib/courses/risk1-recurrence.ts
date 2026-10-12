import { formatInTimeZone, fromZonedTime } from "date-fns-tz";
import type { Prisma } from "@prisma/client";

import type { db as appDb } from "@/lib/db";

const TIME_ZONE = "Europe/Stockholm";

function dayExists(year: number, monthIndex: number, day: number) {
  const date = new Date(Date.UTC(year, monthIndex, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === monthIndex &&
    date.getUTCDate() === day
  );
}

export function risk1OccurrenceDates(
  now: Date,
  monthsAhead: number,
  days: number[],
) {
  const startKey = formatInTimeZone(now, TIME_ZONE, "yyyy-MM");
  const [startYear, startMonth] = startKey.split("-").map(Number);
  const dates: Date[] = [];
  for (let offset = 0; offset < monthsAhead; offset += 1) {
    const absolute = (startYear ?? 2026) * 12 + ((startMonth ?? 1) - 1) + offset;
    const year = Math.floor(absolute / 12);
    const monthIndex = absolute % 12;
    for (const day of days) {
      if (!dayExists(year, monthIndex, day)) continue;
      const localDate = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      dates.push(fromZonedTime(`${localDate}T00:00:00`, TIME_ZONE));
    }
  }
  return dates;
}

type Risk1Db = Pick<typeof appDb, "course" | "courseOccasion"> | Prisma.TransactionClient;

export async function ensureRisk1Occasions(db: Risk1Db, now: Date) {
  const courses = await db.course.findMany({
    where: {
      kind: "RISK1",
      recurrenceEnabled: true,
      product: { active: true },
    },
    select: {
      id: true,
      recurrenceDays: true,
      defaultStartTime: true,
      durationMinutes: true,
      defaultCapacity: true,
      defaultVenueName: true,
      defaultVenueAddress: true,
    },
  });

  let created = 0;
  for (const course of courses) {
    const days = course.recurrenceDays.length
      ? course.recurrenceDays
      : [15, 28];
    const startTime = course.defaultStartTime ?? "18:00";
    const durationMinutes = course.durationMinutes ?? 210;
    const capacity = course.defaultCapacity ?? 16;
    const venueName =
      course.defaultVenueName ?? "Makina Trafikskola, Upplands Väsby";
    const venueAddress =
      course.defaultVenueAddress ?? "Centralvägen 5, 194 77 Upplands Väsby";

    const dayStarts = risk1OccurrenceDates(now, 3, days).filter(
      (date) => date.getTime() >= now.getTime(),
    );
    if (!dayStarts.length) continue;

    const last = dayStarts[dayStarts.length - 1]!;
    const windowEnd = new Date(last.getTime() + 40 * 24 * 60 * 60 * 1000);
    const existing = await db.courseOccasion.findMany({
      where: {
        courseId: course.id,
        startsAt: {
          gte: dayStarts[0],
          lte: windowEnd,
        },
      },
      select: { startsAt: true },
    });
    const existingKeys = new Set(
      existing.map((row) => row.startsAt.toISOString()),
    );

    const rows = dayStarts.flatMap((dayStart) => {
      const localDate = formatInTimeZone(dayStart, TIME_ZONE, "yyyy-MM-dd");
      const startsAt = fromZonedTime(`${localDate}T${startTime}:00`, TIME_ZONE);
      if (existingKeys.has(startsAt.toISOString())) return [];
      const endsAt = new Date(startsAt.getTime() + durationMinutes * 60_000);
      return [
        {
          courseId: course.id,
          startsAt,
          endsAt,
          capacity,
          venueName,
          venueAddress,
          language: "sv",
        },
      ];
    });

    if (rows.length) {
      const result = await db.courseOccasion.createMany({ data: rows });
      created += result.count;
    }
  }

  return created;
}
