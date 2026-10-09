import { z } from "zod";

import {
  renderBookingMessage,
  type BookingTemplate,
} from "@/lib/notifications/templates/booking";
import {
  courseRebookingPayloadSchema,
  lessonRebookingPayloadSchema,
  orderReceiptPayloadSchema,
  paymentFailedPayloadSchema,
  renderCourseRebooking,
  renderLessonRebooking,
  renderOrderReceipt,
  renderPaymentFailed,
} from "@/lib/notifications/templates/payment";
import { db } from "@/lib/db";
import { sendSms } from "@/lib/notifications/senders";

const bookingPayloadSchema = z
  .object({
    bookingId: z.string().cuid(),
    startsAt: z.coerce.date(),
    cancellationDeadline: z.coerce.date().optional(),
    previousStartsAt: z.coerce.date().optional(),
    studentFirstName: z.string().max(80).optional(),
    teacherFirstName: z.string().max(80).optional(),
    placeLabel: z.string().max(200).optional(),
    schoolPhone: z.string().max(40).optional(),
    creditRefunded: z.boolean().optional(),
  })
  .strict();

const bookingTemplates = new Set<BookingTemplate>([
  "booking_confirmed",
  "booking_cancelled_by_student",
  "booking_cancelled_by_teacher",
  "booking_reminder_24h",
  "booking_moved",
  "teacher_booking_new",
  "teacher_booking_cancelled",
  "teacher_booking_moved",
]);

const staleTemplates = new Set<BookingTemplate>([
  "booking_confirmed",
  "booking_reminder_24h",
  "booking_moved",
  "teacher_booking_new",
  "teacher_booking_moved",
]);

function renderNotification(notification: {
  template: string;
  locale: string;
  payload: unknown;
}) {
  if (bookingTemplates.has(notification.template as BookingTemplate)) {
    const payload = bookingPayloadSchema.parse(notification.payload);
    return renderBookingMessage({
      template: notification.template as BookingTemplate,
      locale: notification.locale,
      startsAt: payload.startsAt,
      cancellationDeadline: payload.cancellationDeadline,
      previousStartsAt: payload.previousStartsAt,
      studentFirstName: payload.studentFirstName,
      teacherFirstName: payload.teacherFirstName,
      placeLabel: payload.placeLabel,
      schoolPhone: payload.schoolPhone,
      creditRefunded: payload.creditRefunded,
    });
  }

  if (notification.template === "order_receipt") {
    return renderOrderReceipt({
      locale: notification.locale,
      payload: orderReceiptPayloadSchema.parse(notification.payload),
    });
  }

  if (notification.template === "payment_failed") {
    return renderPaymentFailed({
      locale: notification.locale,
      payload: paymentFailedPayloadSchema.parse(notification.payload),
    });
  }

  if (notification.template === "course_payment_needs_rebooking") {
    return renderCourseRebooking({
      locale: notification.locale,
      payload: courseRebookingPayloadSchema.parse(notification.payload),
    });
  }

  if (notification.template === "lesson_payment_needs_rebooking") {
    return renderLessonRebooking({
      locale: notification.locale,
      payload: lessonRebookingPayloadSchema.parse(notification.payload),
    });
  }

  throw new Error("UNKNOWN_NOTIFICATION_TEMPLATE");
}

export async function dispatchNotifications(ids: string[], now: Date) {
  const notifications = await db.notification.findMany({
    where: {
      id: { in: ids },
      sentAt: null,
      sendAfter: { lte: now },
    },
    include: {
      user: { select: { email: true, phone: true } },
    },
  });

  for (const notification of notifications) {
    try {
      if (staleTemplates.has(notification.template as BookingTemplate)) {
        const payload = bookingPayloadSchema.parse(notification.payload);
        const booking = await db.booking.findUnique({
          where: { id: payload.bookingId },
          select: { status: true, startsAt: true },
        });
        if (
          !booking ||
          booking.status !== "CONFIRMED" ||
          booking.startsAt.getTime() !== payload.startsAt.getTime()
        ) {
          await db.notification.update({
            where: { id: notification.id },
            data: { sentAt: now, error: "STALE" },
          });
          continue;
        }
      }

      if (notification.channel === "INAPP") {
        await db.notification.update({
          where: { id: notification.id },
          data: { sentAt: now, error: null },
        });
        continue;
      }

      const message = renderNotification({
        template: notification.template,
        locale: notification.locale,
        payload: notification.payload,
      });

      if (notification.channel === "SMS") {
        if (!notification.user.phone) {
          throw new Error("SMS_RECIPIENT_MISSING");
        }
        await sendSms(notification.user.phone, message.text);
      } else {
        throw new Error("UNSUPPORTED_NOTIFICATION_CHANNEL");
      }

      await db.notification.update({
        where: { id: notification.id },
        data: { sentAt: now, error: null },
      });
    } catch (error) {
      const code =
        error instanceof Error ? error.message : "NOTIFICATION_SEND_FAILED";
      await db.notification.update({
        where: { id: notification.id },
        data: { error: code.slice(0, 200) },
      });
    }
  }
}
