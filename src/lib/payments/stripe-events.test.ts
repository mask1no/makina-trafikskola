import { describe, expect, it } from "vitest";
import type Stripe from "stripe";

import {
  canCancelExpiredHoldPaymentIntent,
  normalizeStripeEvent,
  refundableUnusedCredits,
  shouldFulfillPayment,
} from "./stripe-events";

function event(
  type: Stripe.Event.Type,
  object: unknown,
): Stripe.Event {
  return {
    id: "evt_test",
    type,
    created: 1_700_000_000,
    data: { object },
  } as Stripe.Event;
}

describe("Stripe event normalization", () => {
  it("normalizes PaymentIntent success metadata", () => {
    expect(
      normalizeStripeEvent(
        event("payment_intent.succeeded", {
          id: "pi_new",
          metadata: {
            orderId: "order_1",
            bookingId: "booking_1",
          },
          amount: 76100,
          amount_received: 76100,
          payment_method: { type: "swish" },
        }),
      ),
    ).toEqual({
      kind: "payment_succeeded",
      orderId: "order_1",
      paymentIntentId: "pi_new",
      checkoutSessionId: null,
      amountOre: 76100,
      bookingId: "booking_1",
      courseBookingId: undefined,
      method: "swish",
    });
  });

  it("keeps paid legacy Checkout Sessions fulfillable", () => {
    expect(
      normalizeStripeEvent(
        event("checkout.session.completed", {
          id: "cs_legacy",
          payment_status: "paid",
          payment_intent: "pi_legacy",
          metadata: {
            orderId: "order_legacy",
            courseBookingId: "course_booking_1",
          },
        }),
      ),
    ).toMatchObject({
      kind: "payment_succeeded",
      orderId: "order_legacy",
      paymentIntentId: "pi_legacy",
      checkoutSessionId: "cs_legacy",
    });
  });

  it("ignores unpaid or metadata-free success events", () => {
    expect(
      normalizeStripeEvent(
        event("checkout.session.completed", {
          id: "cs_unpaid",
          payment_status: "unpaid",
          metadata: { orderId: "order_1" },
        }),
      ),
    ).toBeNull();
    expect(
      normalizeStripeEvent(
        event("payment_intent.succeeded", {
          id: "pi_missing_order",
          metadata: {},
        }),
      ),
    ).toBeNull();
  });
});

describe("fulfillment decisions", () => {
  it("fulfills only an order not already granted", () => {
    expect(
      shouldFulfillPayment({
        orderStatus: "PENDING",
        paymentStatus: "PENDING",
      }),
    ).toBe(true);
    expect(
      shouldFulfillPayment({
        orderStatus: "PAID",
        paymentStatus: "SUCCEEDED",
      }),
    ).toBe(false);
    expect(
      shouldFulfillPayment({
        orderStatus: "PENDING",
        paymentStatus: "SUCCEEDED",
      }),
    ).toBe(false);
  });

  it("makes replayed success fulfillment a no-op", () => {
    const first = shouldFulfillPayment({
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    });
    const replay = shouldFulfillPayment({
      orderStatus: "PAID",
      paymentStatus: "SUCCEEDED",
    });
    expect([first, replay]).toEqual([true, false]);
  });

  it("refunds only unused credits and never drives balance negative", () => {
    expect(
      refundableUnusedCredits({
        desiredReversal: 5,
        reversedAlready: 0,
        availableBalance: 2,
      }),
    ).toBe(2);
    expect(
      refundableUnusedCredits({
        desiredReversal: 5,
        reversedAlready: 2,
        availableBalance: 0,
      }),
    ).toBe(0);
  });

  it("does not cancel delayed Swish or Klarna processing", () => {
    expect(canCancelExpiredHoldPaymentIntent("processing")).toBe(false);
    expect(
      canCancelExpiredHoldPaymentIntent("requires_payment_method"),
    ).toBe(true);
  });
});
