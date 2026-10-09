import { errorResponse, invalidInput } from "@/lib/api/http";
import { Prisma } from "@prisma/client";
import { addDays } from "date-fns";
import { z } from "zod";

import { auth } from "@/auth";
import { AuthorizationError, requireRole } from "@/lib/auth/guards";
import {
  isBookingExclusionViolation,
  isSerializationOrTxTimeout,
} from "@/lib/bookings/errors";
import { loadAvailability } from "@/lib/bookings/availability";
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
    action: z.enum(["move", "cancel", "reassign"]),
    startsAt: z.coerce.date().optional(),
    teacherId: z.string().cuid().optional(),
    reason: z.string().trim().min(3).max(500),
  })
  .strict()
  .superRefine((value, context) => {
    if (value.action === "move" && !value.startsAt) {
      context.addIssue({
        code: "custom",
        path: ["startsAt"],
        message: "START_TIME_REQUIRED",
      });
    }
    if (value.action === "reassign" && !value.teacherId) {
      context.addIssue({
        code: "custom",
        path: ["teacherId"],
        message: "TEACHER_REQUIRED",
      });
    }
  });



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

  let actorId: string;
  try {
    actorId = requireRole(await auth(), ["ADMIN"]).user.id;
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return errorResponse(error.code, error.status);
    }
    throw error;
  }

  const booking = await db.booking.findUnique({
    where: { id: parsed.data.id },
    select: {
      id: true,
      studentId: true,
      teacherId: true,
      locationId: true,
      startsAt: true,
      endsAt: true,
      status: true,
      creditCharged: true,
      student: { select: { localePref: true } },
    },
  });
  if (!booking) return errorResponse("BOOKING_NOT_FOUND", 404);
  if (booking.status !== "CONFIRMED") {
    return errorResponse("BOOKING_NOT_ACTIVE", 409);
  }

  let targetTeacherId = booking.teacherId;
  if (parsed.data.action === "reassign") {
    const teacher = await db.teacherProfile.findFirst({
      where: {
        id: parsed.data.teacherId,
        active: true,
        ...(booking.locationId
          ? { locations: { some: { locationId: booking.locationId } } }
          : {}),
      },
      select: { id: true },
    });
    if (!teacher) return errorResponse("TEACHER_NOT_FOUND", 404);
    targetTeacherId = teacher.id;
  }

  const now = new Date();
  if (parsed.data.action === "cancel") {
    let result;
    try {
      result = await db.$transaction(
      async (tx) => {
        const changed = await tx.booking.updateMany({
          where: { id: booking.id, status: "CONFIRMED" },
          data: {
            status: "CANCELLED_BY_TEACHER",
            cancelledAt: now,
            cancelledById: actorId,
            cancelReason: parsed.data.reason,
            holdExpiresAt: null,
          },
        });
        if (changed.count !== 1) throw new Error("BOOKING_NOT_ACTIVE");

        if (booking.creditCharged) {
          await tx.creditTransaction.create({
            data: {
              studentId: booking.studentId,
              bookingId: booking.id,
              delta: 1,
              reason: "TEACHER_CANCELLATION_REFUND",
            },
          });
        }
        await tx.auditLog.create({
          data: {
            actorId,
            action: "booking.cancel",
            entityType: "Booking",
            entityId: booking.id,
            before: { status: booking.status },
            after: { status: "CANCELLED_BY_TEACHER" },
          },
        });
        const context = await bookingNotificationContext(tx, booking.id);
        const notificationIds = await enqueueBookingNotifications(tx, {
          userId: booking.studentId,
          locale: booking.student.localePref,
          template: "booking_cancelled_by_teacher",
          bookingId: booking.id,
          startsAt: booking.startsAt,
          creditRefunded: booking.creditCharged,
          now,
        });
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
        const updated = await tx.booking.findUniqueOrThrow({
          where: { id: booking.id },
        });
        return { updated, notificationIds };
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
    return Response.json(result.updated);
  }

  const durationMs = booking.endsAt.getTime() - booking.startsAt.getTime();
  const lessonMinutes = Math.round(durationMs / 60_000);
  if (lessonMinutes !== 50 && lessonMinutes !== 100) {
    return errorResponse("INVALID_LESSON_DURATION", 409);
  }
  const startsAt = parsed.data.startsAt ?? booking.startsAt;
  const slots = await loadAvailability({
    teacherId: targetTeacherId,
    from: addDays(startsAt, -1),
    to: addDays(startsAt, 1),
    lessonMinutes,
    now,
    minNoticeHours: 0,
    excludeBookingId: booking.id,
  });
  const targetSlot = slots?.find(
    (slot) => slot.startsAt.getTime() === startsAt.getTime(),
  );
  if (!targetSlot) return errorResponse("SLOT_TAKEN", 409);

  try {
    const updated = await db.$transaction(
      async (tx) => {
        const changed = await tx.booking.updateMany({
          where: { id: booking.id, status: "CONFIRMED" },
          data: {
            teacherId: targetTeacherId,
            startsAt: targetSlot.startsAt,
            endsAt: targetSlot.endsAt,
          },
        });
        if (changed.count !== 1) {
          throw new Error("BOOKING_NOT_ACTIVE");
        }
        const moved = await tx.booking.findUniqueOrThrow({
          where: { id: booking.id },
        });
        await tx.auditLog.create({
          data: {
            actorId,
            action:
              parsed.data.action === "move"
                ? "booking.move"
                : "booking.reassign",
            entityType: "Booking",
            entityId: booking.id,
            before: {
              teacherId: booking.teacherId,
              startsAt: booking.startsAt.toISOString(),
              endsAt: booking.endsAt.toISOString(),
            },
            after: {
              teacherId: moved.teacherId,
              startsAt: moved.startsAt.toISOString(),
              endsAt: moved.endsAt.toISOString(),
              reason: parsed.data.reason,
            },
          },
        });
        const context = await bookingNotificationContext(tx, booking.id);
        const notificationIds = await enqueueBookingNotifications(tx, {
          userId: booking.studentId,
          locale: booking.student.localePref,
          template: "booking_moved",
          bookingId: booking.id,
          startsAt: moved.startsAt,
          previousStartsAt: booking.startsAt,
          teacherFirstName: context.teacherFirstName,
          placeLabel: context.placeLabel,
          now,
        });
        if (booking.teacherId === moved.teacherId) {
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
        } else {
          const previousTeacher = await tx.teacherProfile.findUniqueOrThrow({
            where: { id: booking.teacherId },
            select: { userId: true, user: { select: { localePref: true } } },
          });
          notificationIds.push(
            await enqueueTeacherBookingNotification(tx, {
              userId: previousTeacher.userId,
              locale: previousTeacher.user.localePref,
              template: "teacher_booking_cancelled",
              bookingId: booking.id,
              startsAt: booking.startsAt,
              studentFirstName: context.studentFirstName,
              now,
            }),
            await enqueueTeacherBookingNotification(tx, {
              userId: context.teacherUserId,
              locale: context.teacherLocale,
              template: "teacher_booking_new",
              bookingId: booking.id,
              startsAt: moved.startsAt,
              studentFirstName: context.studentFirstName,
              placeLabel: context.placeLabel,
              now,
            }),
          );
        }
        return { moved, notificationIds };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await dispatchNotifications(updated.notificationIds, now);
    return Response.json(updated.moved);
  } catch (error) {
    if (error instanceof Error && error.message === "BOOKING_NOT_ACTIVE") {
      return errorResponse("BOOKING_NOT_ACTIVE", 409);
    }
    if (
      isBookingExclusionViolation(error) ||
      isSerializationOrTxTimeout(error)
    ) {
      return errorResponse("SLOT_TAKEN", 409);
    }
    throw error;
  }
}
