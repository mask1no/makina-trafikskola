import type { Prisma } from "@prisma/client";

import type { BookingTemplate } from "@/emails/booking";
import type {
  OrderReceiptPayload,
  PaymentFailedPayload,
} from "@/emails/payment";

export async function enqueueBookingNotifications(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    locale: string;
    template: BookingTemplate;
    bookingId: string;
    startsAt: Date;
    cancellationDeadline?: Date;
    now: Date;
  },
) {
  const ids: string[] = [];

  for (const channel of ["SMS", "INAPP"] as const) {
    const notification = await tx.notification.create({
      data: {
        userId: input.userId,
        channel,
        template: input.template,
        locale: input.locale,
        payload: {
          bookingId: input.bookingId,
          startsAt: input.startsAt.toISOString(),
          cancellationDeadline: input.cancellationDeadline?.toISOString(),
        },
        sendAfter: input.now,
      },
      select: { id: true },
    });
    ids.push(notification.id);
  }

  return ids;
}

export async function enqueueOrderReceipt(
  tx: Prisma.TransactionClient,
  input: {
    notificationId: string;
    userId: string;
    locale: string;
    payload: OrderReceiptPayload;
    now: Date;
  },
) {
  const notification = await tx.notification.create({
    data: {
      id: input.notificationId,
      userId: input.userId,
      channel: "INAPP",
      template: "order_receipt",
      locale: input.locale,
      payload: input.payload,
      sendAfter: input.now,
    },
    select: { id: true },
  });

  return notification.id;
}

export async function enqueuePaymentFailed(
  tx: Prisma.TransactionClient,
  input: {
    notificationId: string;
    userId: string;
    locale: string;
    payload: PaymentFailedPayload;
    now: Date;
  },
) {
  const notification = await tx.notification.create({
    data: {
      id: input.notificationId,
      userId: input.userId,
      channel: "INAPP",
      template: "payment_failed",
      locale: input.locale,
      payload: input.payload,
      sendAfter: input.now,
    },
    select: { id: true },
  });

  return notification.id;
}
