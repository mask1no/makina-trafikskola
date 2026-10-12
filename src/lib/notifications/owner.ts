import * as Sentry from "@sentry/nextjs";

import { normalizePhoneToE164 } from "@/lib/auth/phone";
import { syncOwnerBooking } from "@/lib/calendar/google";
import { db } from "@/lib/db";
import { formatLessonDateTime } from "@/lib/format/datetime";
import { sendSmsMessage } from "@/lib/sms/client";

export type OwnerBookingEvent = "new" | "cancelled" | "moved";

const LABELS: Record<OwnerBookingEvent, string> = {
  new: "Ny bokning",
  cancelled: "Avbokad",
  moved: "Flyttad",
};

/** Owner phone in E.164, or null when ADMIN_NOTIFY_PHONE is unset or unusable. */
export function ownerNotifyPhone(
  environment: Record<string, string | undefined> = process.env,
) {
  const raw = environment.ADMIN_NOTIFY_PHONE?.trim();
  return raw ? normalizePhoneToE164(raw) : null;
}

/** "Ny bokning: tors 1 okt 09:00, Anna Lind, Erik, Farsta" */
export function ownerBookingMessage(input: {
  event: OwnerBookingEvent;
  startsAt: Date;
  previousStartsAt?: Date;
  teacherName: string;
  studentFirstName: string;
  area?: string | null;
}) {
  const when = formatLessonDateTime(input.startsAt, "sv");
  const was =
    input.event === "moved" && input.previousStartsAt
      ? ` (från ${formatLessonDateTime(input.previousStartsAt, "sv")})`
      : "";
  return [
    `${LABELS[input.event]}: ${when}${was}`,
    input.teacherName,
    input.studentFirstName,
    ...(input.area ? [input.area] : []),
  ].join(", ");
}

/**
 * Tells the owner about a confirmed booking, cancel or move: an SMS when
 * ADMIN_NOTIFY_PHONE is set, and a calendar event when ADMIN_CALENDAR_EMAIL
 * is set. Never throws and never logs phone numbers or other PII.
 */
export async function notifyOwnerOfBooking(
  bookingId: string,
  event: OwnerBookingEvent,
  options: { previousStartsAt?: Date; sms?: boolean } = {},
) {
  try {
    const phone = options.sms === false ? null : ownerNotifyPhone();
    if (phone) {
      const booking = await db.booking.findUnique({
        where: { id: bookingId },
        select: {
          startsAt: true,
          student: { select: { firstName: true } },
          teacher: { select: { user: { select: { firstName: true, lastName: true } } } },
          location: { select: { name: true } },
        },
      });
      if (booking) {
        await sendSmsMessage({
          to: phone,
          message: ownerBookingMessage({
            event,
            startsAt: booking.startsAt,
            previousStartsAt: options.previousStartsAt,
            teacherName:
              `${booking.teacher.user.firstName} ${booking.teacher.user.lastName}`.trim(),
            studentFirstName: booking.student.firstName,
            area: booking.location?.name,
          }),
        });
      }
    }
  } catch (error) {
    Sentry.captureException(error);
  }
  await syncOwnerBooking(bookingId);
}
