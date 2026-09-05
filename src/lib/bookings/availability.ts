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
};

export async function loadAvailability({
  teacherId,
  from,
  to,
  lessonMinutes,
  now,
  minNoticeHours,
  excludeBookingId,
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
    rules: teacher.availability.map((rule) => ({
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
