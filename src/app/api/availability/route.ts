import { differenceInCalendarDays } from "date-fns";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";

import { loadAvailability } from "@/lib/bookings/availability";
import { db } from "@/lib/db";
import {
  calendarSyncEnabled,
  slotOverlapsBusy,
  teacherBusyIntervals,
} from "@/lib/calendar/google";

const querySchema = z
  .object({
    teacherId: z.string().cuid(),
    from: z.coerce.date(),
    to: z.coerce.date(),
    lessonMinutes: z.coerce.number().pipe(z.union([z.literal(50), z.literal(100)])),
  })
  .strict()
  .refine((value) => value.to > value.from, {
    message: "INVALID_DATE_RANGE",
    path: ["to"],
  })
  .refine(
    (value) => differenceInCalendarDays(value.to, value.from) <= 31,
    {
      message: "DATE_RANGE_TOO_LARGE",
      path: ["to"],
    },
  );

function minNoticeHours() {
  const value = Number(process.env.MIN_BOOKING_NOTICE_HOURS ?? "12");
  return Number.isFinite(value) && value >= 0 ? value : 12;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const parsed = querySchema.safeParse(
    Object.fromEntries(url.searchParams.entries()),
  );
  if (!parsed.success) {
    return Response.json(
      {
        error: {
          code: "INVALID_INPUT",
          message: "INVALID_INPUT",
          fields: parsed.error.flatten().fieldErrors,
        },
      },
      { status: 400 },
    );
  }

  const slots = await loadAvailability({
    ...parsed.data,
    now: new Date(),
    minNoticeHours: minNoticeHours(),
  });
  if (!slots) {
    return Response.json(
      {
        error: {
          code: "TEACHER_NOT_FOUND",
          message: "TEACHER_NOT_FOUND",
        },
      },
      { status: 404 },
    );
  }

  if (!calendarSyncEnabled()) return Response.json(slots);
  const teacher = await db.teacherProfile.findUnique({
    where: { id: parsed.data.teacherId },
    select: { googleCalendarEmail: true },
  });
  if (!teacher?.googleCalendarEmail) return Response.json(slots);
  try {
    const busy = await teacherBusyIntervals(
      teacher.googleCalendarEmail,
      parsed.data.from,
      parsed.data.to,
    );
    return Response.json(
      slots.filter(
        (slot) =>
          !slotOverlapsBusy(
            { startsAt: new Date(slot.startsAt), endsAt: new Date(slot.endsAt) },
            busy,
          ),
      ),
    );
  } catch (error) {
    Sentry.captureException(error);
    return Response.json(slots);
  }
}
