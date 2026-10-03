import type { OrderStatus, PaymentStatus } from "@prisma/client";
import type Stripe from "stripe";

export const HANDLED_EVENT_TYPES = [
  "checkout.session.completed",
  "checkout.session.async_payment_succeeded",
  "payment_intent.succeeded",
  "payment_intent.payment_failed",
  "charge.refunded",
] as const satisfies readonly Stripe.Event.Type[];

export type NormalizedStripeEvent =
  | {
      kind: "payment_succeeded";
      orderId: string;
      paymentIntentId: string | null;
      checkoutSessionId: string | null;
      amountOre: number | null;
      bookingId?: string;
      courseBookingId?: string;
      method?: string;
    }
  | {
      kind: "payment_failed";
      orderId?: string;
      paymentIntentId: string;
    }
  | {
      kind: "charge_refunded";
      paymentIntentId: string | null;
      refundedOre: number;
    };

export function normalizeStripeEvent(
  event: Stripe.Event,
): NormalizedStripeEvent | null {
  if (
    event.type === "checkout.session.completed" ||
    event.type === "checkout.session.async_payment_succeeded"
  ) {
    const session = event.data.object;
    const orderId = session.metadata?.orderId;
    if (session.payment_status !== "paid" || !orderId) return null;
    return {
      kind: "payment_succeeded",
      orderId,
      paymentIntentId:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : session.payment_intent?.id ?? null,
      checkoutSessionId: session.id,
      amountOre: session.amount_total,
      bookingId: session.metadata?.bookingId,
      courseBookingId: session.metadata?.courseBookingId,
    };
  }

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    const orderId = intent.metadata?.orderId;
    if (!orderId) return null;
    return {
      kind: "payment_succeeded",
      orderId,
      paymentIntentId: intent.id,
      checkoutSessionId: null,
      amountOre: intent.amount_received || intent.amount,
      bookingId: intent.metadata?.bookingId,
      courseBookingId: intent.metadata?.courseBookingId,
      method:
        typeof intent.payment_method === "object" &&
        intent.payment_method &&
        "type" in intent.payment_method
          ? intent.payment_method.type
          : undefined,
    };
  }

  if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    return {
      kind: "payment_failed",
      orderId: intent.metadata?.orderId,
      paymentIntentId: intent.id,
    };
  }

  if (event.type === "charge.refunded") {
    const charge = event.data.object;
    return {
      kind: "charge_refunded",
      paymentIntentId:
        typeof charge.payment_intent === "string"
          ? charge.payment_intent
          : charge.payment_intent?.id ?? null,
      refundedOre: charge.amount_refunded,
    };
  }

  return null;
}

export function shouldFulfillPayment(input: {
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
}) {
  return (
    input.orderStatus !== "PAID" &&
    input.paymentStatus !== "SUCCEEDED"
  );
}

export function refundableUnusedCredits(input: {
  desiredReversal: number;
  reversedAlready: number;
  availableBalance: number;
}) {
  return Math.min(
    Math.max(0, input.desiredReversal - input.reversedAlready),
    Math.max(0, input.availableBalance),
  );
}

export function canCancelExpiredHoldPaymentIntent(status: string) {
  return [
    "requires_payment_method",
    "requires_confirmation",
    "requires_action",
  ].includes(status);
}
