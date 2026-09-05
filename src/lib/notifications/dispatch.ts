import { z } from "zod";

import {
  renderBookingMessage,
  type BookingTemplate,
} from "@/emails/booking";
import {
  courseRebookingPayloadSchema,
  lessonRebookingPayloadSchema,
  orderReceiptPayloadSchema,
  paymentFailedPayloadSchema,
  renderCourseRebooking,
  renderLessonRebooking,
  renderOrderReceipt,
  renderPaymentFailed,
} from "@/emails/payment";
import { db } from "@/lib/db";
import { sendEmail, sendSms } from "@/lib/notifications/senders";

const bookingPayloadSchema = z
  .object({
    bookingId: z.string().cuid(),
    startsAt: z.coerce.date(),
    cancellationDeadline: z.coerce.date().optional(),
  })
  .strict();

const bookingTemplates = new Set<BookingTemplate>([
  "booking_confirmed",
  "booking_cancelled_by_student",
  "booking_cancelled_by_teacher",
  "booking_reminder_24h",
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

      if (notification.channel === "EMAIL") {
        if (!notification.user.email) {
          throw new Error("EMAIL_RECIPIENT_MISSING");
        }
        await sendEmail(notification.user.email, message);
      } else if (notification.channel === "SMS") {
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
