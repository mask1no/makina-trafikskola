import { addDays, addMinutes, subHours } from "date-fns";
import { Prisma } from "@prisma/client";
import { z } from "zod";

import { auth } from "@/auth";
import {
  AuthorizationError,
  requireRole,
} from "@/lib/auth/guards";
import { allowRateLimitedAction } from "@/lib/auth/otp-store";
import { loadAvailability } from "@/lib/bookings/availability";
import {
  isBookingExclusionViolation,
  isSerializationOrTxTimeout,
} from "@/lib/bookings/errors";
import {
  lockBookingKeys,
  studentLockKey,
  teacherSlotLockKey,
} from "@/lib/bookings/locks";
import { getCreditBalance } from "@/lib/credits/ledger";
import { db } from "@/lib/db";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { bookingNotificationContext } from "@/lib/notifications/context";
import {
  enqueueBookingNotifications,
  enqueueTeacherBookingNotification,
} from "@/lib/notifications/queue";

export const runtime = "nodejs";

const bookingSchema = z
  .object({
    idempotencyKey: z.string().trim().min(8).max(200),
    teacherId: z.string().cuid(),
    startsAt: z.coerce.date(),
    lessonMinutes: z.union([z.literal(50), z.literal(100)]),
    locationId: z.string().cuid().optional(),
    pickupAddress: z.string().trim().min(3).max(200).optional(),
    pickupLat: z.number().finite().min(55).max(69.1).optional(),
    pickupLng: z.number().finite().min(10.5).max(24.2).optional(),
    requireCredit: z.boolean().default(false),
    studentNote: z.string().trim().max(1000).optional(),
  })
  .strict()
  .refine(
    (value) =>
      Boolean(value.locationId) !== Boolean(value.pickupAddress),
    {
      message: "SELECT_LOCATION_OR_PICKUP",
      path: ["locationId"],
    },
  )
  .refine(
    (value) =>
      Boolean(value.pickupLat) === Boolean(value.pickupLng) &&
      (!value.pickupLat || Boolean(value.pickupAddress)),
    {
      message: "INVALID_PICKUP_COORDINATES",
      path: ["pickupLat"],
    },
  );

function configuredNumber(name: string, fallback: number) {
  const value = Number(process.env[name] ?? String(fallback));
  return Number.isFinite(value) && value >= 0 ? value : fallback;
}

function errorResponse(code: string, status: number, extra?: object) {
  return Response.json(
    { error: { code, message: code }, ...(extra ?? {}) },
    { status },
  );
}

export async function POST(request: Request) {
  const now = new Date();
  const body = await request.json().catch(() => null);
  const parsed = bookingSchema.safeParse({
    ...(body && typeof body === "object" ? body : {}),
    idempotencyKey: request.headers.get("idempotency-key"),
  });
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

  let session;
  try {
    session = requireRole(await auth(), ["STUDENT"]);
  } catch (error) {
    if (error instanceof AuthorizationError) {
      return errorResponse(error.code, error.status);
    }
    throw error;
  }
  const existing = await db.booking.findUnique({
    where: { idempotencyKey: parsed.data.idempotencyKey },
  });
  if (existing) {
    return existing.studentId === session.user.id
      ? Response.json(existing)
      : errorResponse("IDEMPOTENCY_KEY_REUSED", 409);
  }

  const allowed = await allowRateLimitedAction(
    "booking",
    session.user.id,
    5,
    15 * 60,
    now,
  );
  if (!allowed) {
    return errorResponse("RATE_LIMITED", 429);
  }

  const teacher = await db.teacherProfile.findFirst({
    where: {
      id: parsed.data.teacherId,
      active: true,
      ...(parsed.data.locationId
        ? { locations: { some: { locationId: parsed.data.locationId } } }
        : {}),
    },
    select: { id: true },
  });
  if (!teacher) {
    return errorResponse("TEACHER_NOT_FOUND", 404);
  }

  const from = addDays(parsed.data.startsAt, -1);
  const to = addDays(parsed.data.startsAt, 1);
  const minNoticeHours = configuredNumber("MIN_BOOKING_NOTICE_HOURS", 12);
  const availableSlots = await loadAvailability({
    teacherId: parsed.data.teacherId,
    from,
    to,
    lessonMinutes: parsed.data.lessonMinutes,
    now,
    minNoticeHours,
  });
  const requestedSlot = availableSlots?.find(
    (slot) => slot.startsAt.getTime() === parsed.data.startsAt.getTime(),
  );
  if (!requestedSlot) {
    return errorResponse("SLOT_TAKEN", 409, {
      slots: availableSlots ?? [],
    });
  }

  const holdMinutes = configuredNumber("BOOKING_HOLD_MINUTES", 15);

  try {
    const result = await db.$transaction(
      async (tx) => {
        await lockBookingKeys(tx, [
          studentLockKey(session.user.id),
          teacherSlotLockKey(
            parsed.data.teacherId,
            requestedSlot.startsAt,
          ),
        ]);

        const repeated = await tx.booking.findUnique({
          where: { idempotencyKey: parsed.data.idempotencyKey },
        });
        if (repeated) {
          if (repeated.studentId !== session.user.id) {
            throw new Error("IDEMPOTENCY_KEY_REUSED");
          }
          return { booking: repeated, notificationIds: [] };
        }

        const [balance, student, activeTeacher] = await Promise.all([
          getCreditBalance(tx, session.user.id, now),
          tx.user.findUniqueOrThrow({
            where: { id: session.user.id },
            select: { localePref: true },
          }),
          tx.teacherProfile.findFirst({
            where: { id: parsed.data.teacherId, active: true },
            select: { id: true },
          }),
        ]);
        if (!activeTeacher) throw new Error("TEACHER_NOT_FOUND");
        if (parsed.data.requireCredit && balance < 1) {
          throw new Error("NO_CREDITS");
        }
        const creditCharged = balance > 0;
        const created = await tx.booking.create({
          data: {
            studentId: session.user.id,
            teacherId: parsed.data.teacherId,
            locationId: parsed.data.locationId,
            pickupAddress: parsed.data.pickupAddress,
            pickupLat: parsed.data.pickupLat,
            pickupLng: parsed.data.pickupLng,
            startsAt: requestedSlot.startsAt,
            endsAt: requestedSlot.endsAt,
            creditCharged,
            holdExpiresAt: creditCharged
              ? null
              : addMinutes(now, holdMinutes),
            studentNote: parsed.data.studentNote,
            idempotencyKey: parsed.data.idempotencyKey,
          },
        });

        if (creditCharged) {
          await tx.creditTransaction.create({
            data: {
              studentId: session.user.id,
              delta: -1,
              reason: "BOOKING_CONSUMED",
              bookingId: created.id,
            },
          });
        }

        const cancellationDeadline = subHours(
          created.startsAt,
          configuredNumber("CANCELLATION_WINDOW_HOURS", 24),
        );
        const context = await bookingNotificationContext(tx, created.id);
        const notificationIds = await enqueueBookingNotifications(tx, {
          userId: session.user.id,
          locale: student.localePref,
          template: "booking_confirmed",
          bookingId: created.id,
          startsAt: created.startsAt,
          cancellationDeadline,
          teacherFirstName: context.teacherFirstName,
          placeLabel: context.placeLabel,
          schoolPhone: context.schoolPhone,
          channels: creditCharged ? ["SMS", "INAPP"] : ["INAPP"],
          now,
        });
        if (creditCharged) {
          notificationIds.push(
            await enqueueTeacherBookingNotification(tx, {
              userId: context.teacherUserId,
              locale: context.teacherLocale,
              template: "teacher_booking_new",
              bookingId: created.id,
              startsAt: created.startsAt,
              studentFirstName: context.studentFirstName,
              placeLabel: context.placeLabel,
              now,
            }),
          );
        }

        return { booking: created, notificationIds };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
    );

    await dispatchNotifications(result.notificationIds, now);
    return Response.json(result.booking, {
      status: result.notificationIds.length > 0 ? 201 : 200,
    });
  } catch (error) {
    if (
      error instanceof Error &&
      error.message === "IDEMPOTENCY_KEY_REUSED"
    ) {
      return errorResponse("IDEMPOTENCY_KEY_REUSED", 409);
    }
    if (
      error instanceof Error &&
      error.message === "TEACHER_NOT_FOUND"
    ) {
      return errorResponse("TEACHER_NOT_FOUND", 404);
    }
    if (error instanceof Error && error.message === "NO_CREDITS") {
      return errorResponse("NO_CREDITS", 409);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      const repeated = await db.booking.findUnique({
        where: { idempotencyKey: parsed.data.idempotencyKey },
      });
      if (repeated?.studentId === session.user.id) {
        return Response.json(repeated);
      }
      if (repeated && repeated.studentId !== session.user.id) {
        return errorResponse("IDEMPOTENCY_KEY_REUSED", 409);
      }
    }

    if (isBookingExclusionViolation(error) || isSerializationOrTxTimeout(error)) {
      const refreshedSlots = await loadAvailability({
        teacherId: parsed.data.teacherId,
        from,
        to,
        lessonMinutes: parsed.data.lessonMinutes,
        now,
        minNoticeHours,
      });
      return errorResponse("SLOT_TAKEN", 409, {
        slots: refreshedSlots ?? [],
      });
    }

    throw error;
  }
}
