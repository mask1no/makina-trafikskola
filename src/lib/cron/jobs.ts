import { addHours, subDays, subHours } from "date-fns";
import { Prisma } from "@prisma/client";

import { lockBookingKeys, studentLockKey } from "@/lib/bookings/locks";
import { db } from "@/lib/db";
import { calculateCreditExpiries } from "@/lib/credits/expiry";
import { bookingNotificationContext } from "@/lib/notifications/context";
import { dispatchNotifications } from "@/lib/notifications/dispatch";
import { canCancelExpiredHoldPaymentIntent } from "@/lib/payments/stripe-events";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";

type ReminderPayload = { bookingId?: unknown };

type CoreCronScope = {
  onlyStudentIds?: readonly string[];
  onlyBookingIds?: readonly string[];
};

function hasScope(scope?: CoreCronScope) {
  return Boolean(scope?.onlyStudentIds?.length || scope?.onlyBookingIds?.length);
}

export async function runCoreCron(now: Date, scope?: CoreCronScope) {
  const scopedStudents = scope?.onlyStudentIds?.length
    ? [...new Set(scope.onlyStudentIds)]
    : [];
  const scopedBookings = scope?.onlyBookingIds?.length
    ? [...new Set(scope.onlyBookingIds)]
    : [];
  const scoped = hasScope(scope);
  const holdMinutes = Math.max(
    1,
    Number.parseInt(process.env.BOOKING_HOLD_MINUTES ?? "15", 10) || 15,
  );
  const courseHoldCutoff = new Date(
    now.getTime() - holdMinutes * 60_000,
  );
  const result = await db.$transaction(
    async (tx) => {
      let locked = true;
      if (!scoped) {
        const [lock] = await tx.$queryRaw<Array<{ locked: boolean }>>`
          SELECT pg_try_advisory_xact_lock(hashtext('makina-core-cron')) AS locked
        `;
        locked = Boolean(lock?.locked);
      }

      if (!locked) {
        return {
          skipped: true,
          reminderIds: [],
          expiredHolds: 0,
          expiredCourseHolds: 0,
          expiredLessonHoldIds: [],
          expiredPaymentIntentIds: [],
          expiries: 0,
          purgedPickupDetails: 0,
        };
      }

      await tx.rateLimit.deleteMany({ where: { expiresAt: { lt: now } } });
      await tx.otpCode.deleteMany({ where: { expiresAt: { lt: now } } });

      const lessonHoldsToExpire = await tx.booking.findMany({
        where: {
          status: "CONFIRMED",
          creditCharged: false,
          holdExpiresAt: { lte: now },
          ...(scopedStudents.length
            ? { studentId: { in: scopedStudents } }
            : {}),
          ...(scopedBookings.length
            ? { id: { in: scopedBookings } }
            : {}),
        },
        select: { id: true, studentId: true, createdAt: true },
      });
      const expiredHolds = await tx.booking.updateMany({
        where: {
          id: { in: lessonHoldsToExpire.map(({ id }) => id) },
        },
        data: {
          status: "EXPIRED_HOLD",
          cancelledAt: now,
          cancelReason: "HOLD_EXPIRED",
          holdExpiresAt: null,
        },
      });

      const courseHoldsToExpire = await tx.courseBooking.findMany({
        where: {
          status: "PENDING_PAYMENT",
          createdAt: { lte: courseHoldCutoff },
          ...(scopedStudents.length
            ? {
                sourceOrderItem: {
                  order: { studentId: { in: scopedStudents } },
                },
              }
            : {}),
        },
        select: {
          id: true,
          sourceOrderItem: {
            select: {
              order: {
                select: {
                  payment: {
                    select: { stripePaymentIntentId: true },
                  },
                },
              },
            },
          },
        },
      });
      const expiredCourseHolds = await tx.courseBooking.updateMany({
        where: {
          id: { in: courseHoldsToExpire.map(({ id }) => id) },
        },
        data: { status: "EXPIRED_HOLD" },
      });

      const purgedPickupDetails = await tx.booking.updateMany({
        where: {
          status: "COMPLETED",
          endsAt: { lte: subDays(now, 90) },
          ...(scopedStudents.length
            ? { studentId: { in: scopedStudents } }
            : {}),
          ...(scopedBookings.length
            ? { id: { in: scopedBookings } }
            : {}),
          OR: [
            { pickupAddress: { not: null } },
            { pickupLat: { not: null } },
            { pickupLng: { not: null } },
          ],
        },
        data: {
          pickupAddress: null,
          pickupLat: null,
          pickupLng: null,
        },
      });

      const students = await tx.creditTransaction.findMany({
        where: {
          reason: "PURCHASE",
          expiresAt: { lte: now },
          ...(scopedStudents.length
            ? { studentId: { in: scopedStudents } }
            : {}),
        },
        distinct: ["studentId"],
        select: { studentId: true },
      });
      let expiryCount = 0;
      const studentIds = students
        .map(({ studentId }) => studentId)
        .sort((left, right) => (left < right ? -1 : left > right ? 1 : 0));
      for (const studentId of studentIds) {
        await lockBookingKeys(tx, [studentLockKey(studentId)]);
        const ledger = await tx.creditTransaction.findMany({
          where: { studentId },
          select: {
            id: true,
            delta: true,
            reason: true,
            orderItemId: true,
            expiresAt: true,
            createdAt: true,
          },
        });
        const writes = calculateCreditExpiries(ledger, now);
        if (writes.length > 0) {
          const created = await tx.creditTransaction.createMany({
            data: writes.map((write) => ({
              studentId,
              delta: write.delta,
              reason: "EXPIRY",
              orderItemId: write.orderItemId,
              note: "CREDIT_LOT_EXPIRED",
              createdAt: now,
            })),
          });
          expiryCount += created.count;
        }
      }

      const reminderCandidates = await tx.booking.findMany({
        where: {
          status: "CONFIRMED",
          creditCharged: true,
          startsAt: { gt: now, lte: addHours(now, 24) },
          ...(scopedStudents.length
            ? { studentId: { in: scopedStudents } }
            : {}),
          ...(scopedBookings.length
            ? { id: { in: scopedBookings } }
            : {}),
        },
        select: {
          id: true,
          studentId: true,
          startsAt: true,
          createdAt: true,
          student: { select: { localePref: true } },
        },
      });
      const reminderBookings = reminderCandidates.filter(
        (booking) =>
          booking.createdAt.getTime() <
          booking.startsAt.getTime() - 24 * 60 * 60 * 1000,
      );
      const existing = await tx.notification.findMany({
        where: {
          template: "booking_reminder_24h",
          sendAfter: { gte: subHours(now, 48) },
        },
        select: { payload: true },
      });
      const existingKeys = new Set(
        existing.flatMap((notification) => {
          const payload =
            notification.payload &&
            typeof notification.payload === "object" &&
            !Array.isArray(notification.payload)
              ? (notification.payload as ReminderPayload & {
                  startsAt?: unknown;
                })
              : {};
          return typeof payload.bookingId === "string" &&
            typeof payload.startsAt === "string"
            ? [`${payload.bookingId}:${payload.startsAt}`]
            : [];
        }),
      );

      for (const booking of reminderBookings) {
        const startsAt = booking.startsAt.toISOString();
        if (existingKeys.has(`${booking.id}:${startsAt}`)) continue;
        const context = await bookingNotificationContext(tx, booking.id);
        await tx.notification.create({
          data: {
            userId: booking.studentId,
            channel: "SMS",
            template: "booking_reminder_24h",
            locale: booking.student.localePref,
            payload: {
              bookingId: booking.id,
              startsAt,
              teacherFirstName: context.teacherFirstName,
              ...(context.placeLabel ? { placeLabel: context.placeLabel } : {}),
              schoolPhone: context.schoolPhone,
            },
            sendAfter: now,
          },
        });
      }

      if (!scoped) {
        await tx.teacherProfile.updateMany({
          data: { ratingAvg: 0, ratingCount: 0 },
        });
        const ratings = await tx.review.groupBy({
          by: ["teacherId"],
          where: { published: true },
          _avg: { rating: true },
          _count: { rating: true },
        });
        for (const rating of ratings) {
          await tx.teacherProfile.update({
            where: { id: rating.teacherId },
            data: {
              ratingAvg: rating._avg.rating ?? 0,
              ratingCount: rating._count.rating,
            },
          });
        }
      }

      const lessonHoldPayments = lessonHoldsToExpire.length
        ? await tx.payment.findMany({
            where: {
              stripePaymentIntentId: { not: null },
              status: { not: "SUCCEEDED" },
              order: {
                studentId: {
                  in: [
                    ...new Set(lessonHoldsToExpire.map((hold) => hold.studentId)),
                  ],
                },
                status: { in: ["PENDING", "FAILED"] },
              },
            },
            select: {
              stripePaymentIntentId: true,
              order: { select: { studentId: true, createdAt: true } },
            },
          })
        : [];
      const lessonPaymentIntentIds = lessonHoldsToExpire.flatMap((hold) => {
        const match = lessonHoldPayments
          .filter(
            (payment) =>
              payment.order.studentId === hold.studentId &&
              payment.order.createdAt >= hold.createdAt &&
              payment.stripePaymentIntentId,
          )
          .sort(
            (a, b) => a.order.createdAt.getTime() - b.order.createdAt.getTime(),
          )[0];
        return match?.stripePaymentIntentId ? [match.stripePaymentIntentId] : [];
      });

      const queuedReminders = await tx.notification.findMany({
        where: {
          channel: "SMS",
          sentAt: null,
          sendAfter: { gte: subHours(now, 6), lte: now },
        },
        select: { id: true },
      });

      return {
        skipped: false,
        reminderIds: queuedReminders.map(({ id }) => id),
        expiredHolds: expiredHolds.count,
        expiredCourseHolds: expiredCourseHolds.count,
        expiredLessonHoldIds: lessonHoldsToExpire.map(({ id }) => id),
        expiredPaymentIntentIds: [
          ...courseHoldsToExpire.flatMap((hold) => {
            const id = hold.sourceOrderItem?.order.payment?.stripePaymentIntentId;
            return id ? [id] : [];
          }),
          ...lessonPaymentIntentIds,
        ],
        expiries: expiryCount,
        purgedPickupDetails: purgedPickupDetails.count,
      };
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
  );

  if (!result.skipped) {
    await dispatchNotifications(result.reminderIds, now);
  }

  let cancelledPaymentIntents = 0;
  if (!result.skipped && stripeIsConfigured()) {
    const stripe = getStripe();
    const paymentIntentIds = new Set(result.expiredPaymentIntentIds);
    for (const paymentIntentId of paymentIntentIds) {
      try {
        const intent =
          await stripe.paymentIntents.retrieve(paymentIntentId);
        if (canCancelExpiredHoldPaymentIntent(intent.status)) {
          await stripe.paymentIntents.cancel(paymentIntentId);
          cancelledPaymentIntents += 1;
        }
      } catch {
        // Succeeded/cancelled race outcomes are final and webhook fulfillment wins.
      }
    }
  }

  return {
    skipped: result.skipped,
    expiredHolds: result.expiredHolds,
    expiredCourseHolds: result.expiredCourseHolds,
    expiries: result.expiries,
    purgedPickupDetails: result.purgedPickupDetails,
    remindersDispatched: result.reminderIds.length,
    cancelledPaymentIntents,
  };
}
