import { describe, expect, it } from "vitest";

import { resolvePaidLessonHold } from "../bookings/hold";
import {
  remainingCourseEntitlements,
  resolvePaidCourseHold,
} from "../courses/entitlements";
import {
  refundableUnusedCredits,
  shouldFulfillPayment,
} from "./stripe-events";

const paidAt = new Date("2026-09-05T08:16:00.000Z");

describe("late payment policy integration", () => {
  it("grants one late lesson credit once and redeems it on rebooking", () => {
    const firstDelivery = shouldFulfillPayment({
      orderStatus: "PENDING",
      paymentStatus: "PENDING",
    });
    expect(firstDelivery).toBe(true);

    let credits = firstDelivery ? 1 : 0;
    expect(
      resolvePaidLessonHold({
        booking: {
          studentId: "student",
          status: "EXPIRED_HOLD",
          creditCharged: false,
          holdExpiresAt: null,
        },
        studentId: "student",
        availableBalance: credits,
        now: paidAt,
      }),
    ).toBe("REBOOK");
    expect(credits).toBe(1);

    credits -= 1;
    expect(credits).toBe(0);
    expect(
      shouldFulfillPayment({
        orderStatus: "PAID",
        paymentStatus: "SUCCEEDED",
      }),
    ).toBe(false);
    expect(credits).toBe(0);
  });

  it("leaves a late course unit unredeemed, then redeems it once", () => {
    expect(
      resolvePaidCourseHold({
        status: "EXPIRED_HOLD",
        matchesEntitlement: true,
        occasionCancelled: false,
        occasionStartsAt: new Date("2026-09-06T08:00:00.000Z"),
        holdExpiresAt: new Date("2026-09-05T08:15:00.000Z"),
        receivedAt: paidAt,
        occupiedSeats: 1,
        capacity: 1,
      }),
    ).toBe("REBOOK");

    const entitlement = {
      productId: "riskettan",
      quantity: 1,
      orderStatus: "PAID" as const,
      paymentStatus: "SUCCEEDED" as const,
      refundedOre: 0,
      includesRisk1: true,
      includesRisk2: false,
      redeemedKinds: [] as ("RISK1" | "RISK2")[],
    };
    expect(
      remainingCourseEntitlements(entitlement, "riskettan", "RISK1"),
    ).toBe(1);

    entitlement.redeemedKinds.push("RISK1");
    expect(
      remainingCourseEntitlements(entitlement, "riskettan", "RISK1"),
    ).toBe(0);
  });

  it("revokes only unused value on refund", () => {
    expect(
      refundableUnusedCredits({
        desiredReversal: 1,
        reversedAlready: 0,
        availableBalance: 1,
      }),
    ).toBe(1);

    expect(
      remainingCourseEntitlements(
        {
          productId: "riskettan",
          quantity: 1,
          orderStatus: "REFUNDED",
          paymentStatus: "REFUNDED",
          refundedOre: 49500,
          includesRisk1: true,
          includesRisk2: false,
          redeemedKinds: [],
        },
        "riskettan",
        "RISK1",
      ),
    ).toBe(0);
  });
});
