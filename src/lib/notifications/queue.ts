import type { Prisma } from "@prisma/client";

import type { BookingTemplate } from "@/emails/booking";
import type {
  OrderReceiptPayload,
  PaymentFailedPayload,
} from "@/emails/payment";

type BookingPayload = {
  bookingId: string;
  startsAt: string;
  cancellationDeadline?: string;
  previousStartsAt?: string;
  studentFirstName?: string;
  teacherFirstName?: string;
  placeLabel?: string;
  schoolPhone?: string;
  creditRefunded?: boolean;
};

function bookingPayload(input: {
  bookingId: string;
  startsAt: Date;
  cancellationDeadline?: Date;
  previousStartsAt?: Date;
  studentFirstName?: string;
  teacherFirstName?: string;
  placeLabel?: string;
  schoolPhone?: string;
  creditRefunded?: boolean;
}): BookingPayload {
  return {
    bookingId: input.bookingId,
    startsAt: input.startsAt.toISOString(),
    ...(input.cancellationDeadline
      ? { cancellationDeadline: input.cancellationDeadline.toISOString() }
      : {}),
    ...(input.previousStartsAt
      ? { previousStartsAt: input.previousStartsAt.toISOString() }
      : {}),
    ...(input.studentFirstName
      ? { studentFirstName: input.studentFirstName }
      : {}),
    ...(input.teacherFirstName
      ? { teacherFirstName: input.teacherFirstName }
      : {}),
    ...(input.placeLabel ? { placeLabel: input.placeLabel } : {}),
    ...(input.schoolPhone ? { schoolPhone: input.schoolPhone } : {}),
    ...(input.creditRefunded ? { creditRefunded: true } : {}),
  };
}

export async function enqueueBookingNotifications(
  tx: Prisma.TransactionClient,
  input: {
    userId: string;
    locale: string;
    template: BookingTemplate;
    bookingId: string;
    startsAt: Date;
    cancellationDeadline?: Date;
    previousStartsAt?: Date;
    studentFirstName?: string;
    teacherFirstName?: string;
    placeLabel?: string;
    schoolPhone?: string;
    creditRefunded?: boolean;
    channels?: Array<"SMS" | "INAPP">;
    now: Date;
    ids?: Partial<Record<"SMS" | "INAPP", string>>;
  },
) {
  const ids: string[] = [];
  const channels = input.channels ?? ["SMS", "INAPP"];

  for (const channel of channels) {
    const notification = await tx.notification.create({
      data: {
        ...(input.ids?.[channel] ? { id: input.ids[channel] } : {}),
        userId: input.userId,
        channel,
        template: input.template,
        locale: input.locale,
        payload: bookingPayload(input),
        sendAfter: input.now,
      },
      select: { id: true },
    });
    ids.push(notification.id);
  }

  return ids;
}

export async function enqueueTeacherBookingNotification(
  tx: Prisma.TransactionClient,
  input: {
    id?: string;
    userId: string;
    locale: string;
    template: BookingTemplate;
    bookingId: string;
    startsAt: Date;
    previousStartsAt?: Date;
    studentFirstName?: string;
    placeLabel?: string;
    now: Date;
  },
) {
  const notification = await tx.notification.create({
    data: {
      ...(input.id ? { id: input.id } : {}),
      userId: input.userId,
      channel: "SMS",
      template: input.template,
      locale: input.locale,
      payload: bookingPayload(input),
      sendAfter: input.now,
    },
    select: { id: true },
  });
  return notification.id;
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
