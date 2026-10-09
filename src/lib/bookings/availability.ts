import { addDays } from "date-fns";

import { db } from "@/lib/db";
import {
  getAvailableSlots,
  type Slot,
} from "@/lib/scheduling/slots";

type AvailabilityQuery = {
  teacherId: string;
  from: Date;
  to: Date;
  lessonMinutes: 50 | 100;
  now: Date;
  minNoticeHours: number;
  excludeBookingId?: string;
  locationId?: string;
};

export async function loadAvailability({
  teacherId,
  from,
  to,
  lessonMinutes,
  now,
  minNoticeHours,
  excludeBookingId,
  locationId,
}: AvailabilityQuery): Promise<Slot[] | null> {
  const teacher = await db.teacherProfile.findFirst({
    where: { id: teacherId, active: true },
    select: {
      travelBufferMin: true,
      availability: true,
      exceptions: {
        where: {
          date: {
            gte: addDays(from, -1),
            lte: addDays(to, 1),
          },
        },
      },
      bookings: {
        where: {
          ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
          status: { in: ["CONFIRMED", "COMPLETED"] },
          startsAt: { lt: addDays(to, 1) },
          endsAt: { gt: addDays(from, -1) },
        },
        select: { startsAt: true, endsAt: true },
      },
    },
  });

  if (!teacher) {
    return null;
  }

  return getAvailableSlots({
    now,
    from,
    to,
    lessonMinutes,
    travelBufferMin: teacher.travelBufferMin,
    minNoticeHours,
    rules: teacher.availability
      .filter(
        (rule) =>
          !locationId ||
          rule.locationId == null ||
          rule.locationId === locationId,
      )
      .map((rule) => ({
      dayOfWeek: rule.dayOfWeek,
      startTime: rule.startTime,
      endTime: rule.endTime,
      validFrom: rule.validFrom,
      validUntil: rule.validUntil,
    })),
    exceptions: teacher.exceptions.map((exception) => ({
      date: exception.date,
      type: exception.type,
      startTime: exception.startTime,
      endTime: exception.endTime,
    })),
    bookings: teacher.bookings,
  });
}

export async function firstAvailableSlot(input: {
  teacherId: string;
  now: Date;
  lessonMinutes?: 50 | 100;
  minNoticeHours?: number;
  locationId?: string;
}) {
  const slots = await loadAvailability({
    teacherId: input.teacherId,
    from: input.now,
    to: addDays(input.now, 14),
    lessonMinutes: input.lessonMinutes ?? 50,
    now: input.now,
    minNoticeHours: input.minNoticeHours ?? 12,
    locationId: input.locationId,
  });
  return slots?.[0]?.startsAt ?? null;
}

export async function nextFreeSlots(
  teacherIds: string[],
  now: Date,
  locationId?: string,
) {
  const configured = Number(process.env.MIN_BOOKING_NOTICE_HOURS ?? "12");
  const minNoticeHours =
    Number.isFinite(configured) && configured >= 0 ? configured : 12;
  const entries = await Promise.all(
    teacherIds.map(async (teacherId) => {
      const startsAt = await firstAvailableSlot({
        teacherId,
        now,
        minNoticeHours,
        locationId,
      });
      return [teacherId, startsAt] as const;
    }),
  );
  return new Map(entries);
}
