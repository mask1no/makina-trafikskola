import { db } from "@/lib/db";
import { getStripe, stripeIsConfigured } from "@/lib/stripe";

export type PaymentIntentMetadata = {
  bookingId?: string;
  courseBookingId?: string;
};

function checkoutPath(locale: string, orderId: string) {
  return `/${encodeURIComponent(locale)}/checkout/${encodeURIComponent(orderId)}`;
}

export async function failOrderPaymentCreation(
  orderId: string,
  metadata: PaymentIntentMetadata,
) {
  await db.$transaction(async (tx) => {
    await tx.payment.updateMany({
      where: { orderId, status: { not: "SUCCEEDED" } },
      data: { status: "FAILED" },
    });
    await tx.order.updateMany({
      where: { id: orderId, status: "PENDING" },
      data: { status: "FAILED" },
    });
    if (metadata.bookingId) {
      await tx.booking.updateMany({
        where: {
          id: metadata.bookingId,
          creditCharged: false,
          holdExpiresAt: { not: null },
        },
        data: {
          status: "EXPIRED_HOLD",
          holdExpiresAt: null,
          cancelReason: "PAYMENT_PROVIDER_ERROR",
        },
      });
    }
    if (metadata.courseBookingId) {
      await tx.courseBooking.updateMany({
        where: {
          id: metadata.courseBookingId,
          status: "PENDING_PAYMENT",
        },
        data: { status: "EXPIRED_HOLD" },
      });
    }
  });
}

export async function createPaymentIntentForOrder(
  orderId: string,
  metadata: PaymentIntentMetadata = {},
) {
  const order = await db.order.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      studentId: true,
      status: true,
      totalOre: true,
      student: { select: { localePref: true, email: true } },
      payment: {
        select: {
          id: true,
          status: true,
          amountOre: true,
          stripePaymentIntentId: true,
        },
      },
      items: {
        select: {
          quantity: true,
          unitPriceOre: true,
          product: { select: { currency: true } },
        },
      },
    },
  });
  if (!order?.payment || order.items.length === 0) {
    throw new Error("ORDER_NOT_FOUND");
  }
  if (order.status !== "PENDING" || order.payment.status === "SUCCEEDED") {
    throw new Error("ORDER_NOT_PAYABLE");
  }

  const snapshotTotal = order.items.reduce(
    (sum, item) => sum + item.unitPriceOre * item.quantity,
    0,
  );
  const currencies = new Set(
    order.items.map((item) => item.product.currency.toLowerCase()),
  );
  if (
    snapshotTotal !== order.totalOre ||
    order.payment.amountOre !== order.totalOre ||
    currencies.size !== 1
  ) {
    throw new Error("ORDER_SNAPSHOT_INVALID");
  }

  const url = checkoutPath(order.student.localePref, order.id);
  if (!paymentProviderReady()) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("PAYMENT_PROVIDER_NOT_CONFIGURED");
    }
    return { url, mock: true as const };
  }

  let paymentIntentId = order.payment.stripePaymentIntentId;
  try {
    if (!paymentIntentId) {
      const intent = await getStripe().paymentIntents.create(
        {
          amount: order.totalOre,
          currency: [...currencies][0],
          automatic_payment_methods: { enabled: true },
          ...(order.student.email
            ? { receipt_email: order.student.email }
            : {}),
          metadata: {
            orderId: order.id,
            ...metadata,
          },
        },
        { idempotencyKey: `order:${order.id}:payment-intent` },
      );
      paymentIntentId = intent.id;
      await db.payment.update({
        where: { id: order.payment.id },
        data: {
          stripePaymentIntentId: intent.id,
          status: "PENDING",
        },
      });
    }
    return { url, mock: false as const, paymentIntentId };
  } catch (error) {
    if (paymentIntentId) {
      try {
        const intent =
          await getStripe().paymentIntents.retrieve(paymentIntentId);
        if (
          [
            "requires_payment_method",
            "requires_confirmation",
            "requires_action",
          ].includes(intent.status)
        ) {
          await getStripe().paymentIntents.cancel(paymentIntentId);
        }
      } catch {
        // The database failure state below prevents the hold being sold.
      }
    }
    await failOrderPaymentCreation(order.id, metadata);
    throw error;
  }
}

export function paymentProviderReady() {
  return (
    stripeIsConfigured() &&
    Boolean(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY)
  );
}
