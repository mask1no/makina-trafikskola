import { errorResponse, invalidInput } from "@/lib/api/http";
import { addDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import {
  AuthorizationError,
  requireRole,
} from "@/lib/auth/guards";
import { loadAvailability } from "@/lib/bookings/availability";
import {
  getCancellationCreditReason,
  isLateStudentCancellation,
} from "@/lib/bookings/cancellation";
import {
  isBookingExclusionViolation,
  isSerializationOrTxTimeout,
} from "@/lib/bookings/errors";
import { syncConfirmedBooking } from "@/lib/calendar/google";
import { configuredNumber } from "@/lib/config/number";
import { db } from "@/lib/db";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { bookingNotificationContext } from "@/lib/notifications/context";
import {
  enqueueBookingNotifications,
  enqueueTeacherBookingNotification,
} from "@/lib/notifications/queue";

export const runtime = "nodejs";

const requestSchema = z
  .object({
    id: z.string().cuid(),
    action: z.enum(["cancel", "reschedule"]),
    startsAt: z.coerce.date().optional(),
    reason: z.string().trim().max(500).optional(),
  })
  .strict()
  .refine(
    (value) => value.action !== "reschedule" || value.startsAt !== undefined,
    {
      message: "START_TIME_REQUIRED",
      path: ["startsAt"],
    },
  );




export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const body = await request.json().catch(() => null);
  const parsed = requestSchema.safeParse({
    ...(body && typeof body === "object" ? body : {}),
    id: (await context.params).id,
  });
  if (!parsed.success) {
    return invalidInput(parsed.error.flatten().fieldErrors);
  }

  let session;
  try {
    session = requireRole(await auth(), ["STUDENT", "TEACHER", "ADMIN"]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return errorResponse(error.code, error.status);
    }
    throw error;
  }
  const booking = await db.booking.findUnique({
    where: { id: parsed.data.id },
    include: {
      student: { select: { localePref: true } },
      teacher: { select: { userId: true } },
    },
  });
  if (!booking) {
    return errorResponse("BOOKING_NOT_FOUND", 404);
  }

  const ownsBooking =
    session.user.role === "ADMIN" ||
    (session.user.role === "STUDENT" &&
      booking.studentId === session.user.id) ||
    (session.user.role === "TEACHER" &&
      booking.teacher.userId === session.user.id);
  if (!ownsBooking) {
    return errorResponse("FORBIDDEN", 403);
  }

  if (booking.status !== "CONFIRMED") {
    return errorResponse("BOOKING_NOT_ACTIVE", 409);
  }

  const now = new Date();

  if (parsed.data.action === "reschedule" && parsed.data.startsAt) {
    const lessonMinutes = Math.round(
      (booking.endsAt.getTime() - booking.startsAt.getTime()) / 60_000,
    );
    if (lessonMinutes !== 50 && lessonMinutes !== 100) {
      return errorResponse("INVALID_LESSON_DURATION", 409);
    }

    const from = addDays(parsed.data.startsAt, -1);
    const to = addDays(parsed.data.startsAt, 1);
    const slots = await loadAvailability({
      teacherId: booking.teacherId,
      from,
      to,
      lessonMinutes,
      now,
      minNoticeHours: configuredNumber("MIN_BOOKING_NOTICE_HOURS", 12),
      excludeBookingId: booking.id,
    });
    const slot = slots?.find(
      (candidate) =>
        candidate.startsAt.getTime() === parsed.data.startsAt?.getTime(),
    );
    if (!slot) {
      return errorResponse("SLOT_TAKEN", 409, { slots: slots ?? [] });
    }

    const cancellationWindowHours = configuredNumber(
      "CANCELLATION_WINDOW_HOURS",
      24,
    );
    if (
      session.user.role === "STUDENT" &&
      isLateStudentCancellation({
        actorRole: "STUDENT",
        startsAt: booking.startsAt,
        now,
        cancellationWindowHours,
      })
    ) {
      return errorResponse("OUTSIDE_CANCELLATION_WINDOW", 409);
    }

    try {
      const updated = await db.$transaction(async (tx) => {
        const changed = await tx.booking.updateMany({
          where: { id: booking.id, status: "CONFIRMED" },
          data: { startsAt: slot.startsAt, endsAt: slot.endsAt },
        });
        if (changed.count !== 1) throw new Error("BOOKING_NOT_ACTIVE");
        const moved = await tx.booking.findUniqueOrThrow({
          where: { id: booking.id },
        });
        const context = await bookingNotificationContext(tx, booking.id);
        const studentChannels =
          session.user.role === "STUDENT"
            ? (["INAPP"] as const)
            : (["SMS", "INAPP"] as const);
        const notificationIds = await enqueueBookingNotifications(tx, {
          userId: booking.studentId,
          locale: booking.student.localePref,
          template: "booking_moved",
          bookingId: booking.id,
          startsAt: moved.startsAt,
          previousStartsAt: booking.startsAt,
          teacherFirstName: context.teacherFirstName,
          placeLabel: context.placeLabel,
          channels: [...studentChannels],
          now,
        });
        if (session.user.role !== "TEACHER") {
          notificationIds.push(
            await enqueueTeacherBookingNotification(tx, {
              userId: context.teacherUserId,
              locale: context.teacherLocale,
              template: "teacher_booking_moved",
              bookingId: booking.id,
              startsAt: moved.startsAt,
              previousStartsAt: booking.startsAt,
              studentFirstName: context.studentFirstName,
              placeLabel: context.placeLabel,
              now,
            }),
          );
        }
        return { moved, notificationIds };
      });
      await dispatchNotifications(updated.notificationIds, now);
      await syncConfirmedBooking(booking.id);
      return Response.json(updated.moved);
    } catch (error) {
      if (
        error instanceof Error &&
        error.message === "BOOKING_NOT_ACTIVE"
      ) {
        return errorResponse("BOOKING_NOT_ACTIVE", 409);
      }
      if (isBookingExclusionViolation(error)) {
        const refreshed = await loadAvailability({
          teacherId: booking.teacherId,
          from,
          to,
          lessonMinutes,
          now,
          minNoticeHours: configuredNumber(
            "MIN_BOOKING_NOTICE_HOURS",
            12,
          ),
          excludeBookingId: booking.id,
        });
        return errorResponse("SLOT_TAKEN", 409, {
          slots: refreshed ?? [],
        });
      }
      throw error;
    }
  }

  const cancelledByStudent = session.user.role === "STUDENT";
  const cancellationWindowHours = configuredNumber(
    "CANCELLATION_WINDOW_HOURS",
    24,
  );
  const creditReason = getCancellationCreditReason({
    actorRole: session.user.role,
    creditCharged: booking.creditCharged,
    startsAt: booking.startsAt,
    now,
    cancellationWindowHours,
  });

  let result;
  try {
    result = await db.$transaction(
    async (tx) => {
      const updated = await tx.booking.updateMany({
        where: { id: booking.id, status: "CONFIRMED" },
        data: {
          status: cancelledByStudent
            ? "CANCELLED_BY_STUDENT"
            : "CANCELLED_BY_TEACHER",
          cancelledAt: now,
          cancelledById: session.user.id,
          cancelReason: parsed.data.reason,
          holdExpiresAt: null,
        },
      });
      if (updated.count !== 1) {
        throw new Error("BOOKING_NOT_ACTIVE");
      }

      if (creditReason) {
        await tx.creditTransaction.create({
          data: {
            studentId: booking.studentId,
            bookingId: booking.id,
            delta: creditReason === "LATE_CANCELLATION_CHARGE" ? 0 : 1,
            reason: creditReason,
          },
        });
      }

      const context = await bookingNotificationContext(tx, booking.id);
      const creditRefunded = Boolean(
        creditReason && creditReason !== "LATE_CANCELLATION_CHARGE",
      );
      const notificationIds = await enqueueBookingNotifications(tx, {
        userId: booking.studentId,
        locale: booking.student.localePref,
        template: cancelledByStudent
          ? "booking_cancelled_by_student"
          : "booking_cancelled_by_teacher",
        bookingId: booking.id,
        startsAt: booking.startsAt,
        creditRefunded: cancelledByStudent ? undefined : creditRefunded,
        channels: cancelledByStudent ? ["INAPP"] : ["SMS", "INAPP"],
        now,
      });
      if (session.user.role !== "TEACHER") {
        notificationIds.push(
          await enqueueTeacherBookingNotification(tx, {
            userId: context.teacherUserId,
            locale: context.teacherLocale,
            template: "teacher_booking_cancelled",
            bookingId: booking.id,
            startsAt: booking.startsAt,
            studentFirstName: context.studentFirstName,
            now,
          }),
        );
      }

      const cancelled = await tx.booking.findUniqueOrThrow({
        where: { id: booking.id },
      });
      return { cancelled, notificationIds };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
  } catch (error) {
    if (
      (error instanceof Error && error.message === "BOOKING_NOT_ACTIVE") ||
      isSerializationOrTxTimeout(error)
    ) {
      return errorResponse("BOOKING_NOT_ACTIVE", 409);
    }
    throw error;
  }

  await dispatchNotifications(result.notificationIds, now);
  await syncConfirmedBooking(booking.id);
  return Response.json(result.cancelled);
}
