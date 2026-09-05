import { describe, expect, it } from "vitest";

import {
  courseBookingOccupiesSeat,
  remainingCourseEntitlements,
  resolvePaidCourseHold,
} from "./entitlements";

const paidPackage = {
  productId: "package",
  quantity: 2,
  orderStatus: "PAID" as const,
  paymentStatus: "SUCCEEDED" as const,
  refundedOre: 0,
  includesRisk1: true,
  includesRisk2: true,
  redeemedKinds: ["RISK1"] as const,
};

describe("course entitlement accounting", () => {
  it("grants each matching kind once per package unit", () => {
    expect(
      remainingCourseEntitlements(
        { ...paidPackage, redeemedKinds: [...paidPackage.redeemedKinds] },
        "riskettan",
        "RISK1",
      ),
    ).toBe(1);
    expect(
      remainingCourseEntitlements(
        { ...paidPackage, redeemedKinds: [...paidPackage.redeemedKinds] },
        "risktvaan",
        "RISK2",
      ),
    ).toBe(2);
  });

  it("rejects unpaid and refunded purchases", () => {
    expect(
      remainingCourseEntitlements(
        {
          ...paidPackage,
          orderStatus: "PENDING",
          redeemedKinds: [],
        },
        "riskettan",
        "RISK1",
      ),
    ).toBe(0);
    expect(
      remainingCourseEntitlements(
        { ...paidPackage, refundedOre: 1, redeemedKinds: [] },
        "riskettan",
        "RISK1",
      ),
    ).toBe(0);
  });

  it("counts only live pending holds toward capacity", () => {
    const now = new Date("2026-09-05T08:00:00Z");
    expect(
      courseBookingOccupiesSeat(
        {
          status: "PENDING_PAYMENT",
          createdAt: new Date("2026-09-05T07:50:01Z"),
        },
        now,
        10,
      ),
    ).toBe(true);
    expect(
      courseBookingOccupiesSeat(
        {
          status: "PENDING_PAYMENT",
          createdAt: new Date("2026-09-05T07:50:00Z"),
        },
        now,
        10,
      ),
    ).toBe(false);
  });

  it("keeps an expired paid course hold unredeemed for one rebooking", () => {
    const lateResolution = resolvePaidCourseHold({
      status: "EXPIRED_HOLD",
      matchesEntitlement: true,
      occasionCancelled: false,
      occasionStartsAt: new Date("2026-09-06T08:00:00Z"),
      holdExpiresAt: new Date("2026-09-05T07:55:00Z"),
      receivedAt: new Date("2026-09-05T08:00:00Z"),
      occupiedSeats: 1,
      capacity: 1,
    });
    expect(lateResolution).toBe("REBOOK");

    const unused = {
      ...paidPackage,
      quantity: 1,
      redeemedKinds: [] as ("RISK1" | "RISK2")[],
    };
    expect(
      remainingCourseEntitlements(unused, "riskettan", "RISK1"),
    ).toBe(1);
    expect(
      remainingCourseEntitlements(
        { ...unused, redeemedKinds: ["RISK1"] },
        "riskettan",
        "RISK1",
      ),
    ).toBe(0);
  });

  it("confirms only an in-window course hold without stealing capacity", () => {
    const base = {
      status: "PENDING_PAYMENT" as const,
      matchesEntitlement: true,
      occasionCancelled: false,
      occasionStartsAt: new Date("2026-09-06T08:00:00Z"),
      holdExpiresAt: new Date("2026-09-05T08:01:00Z"),
      receivedAt: new Date("2026-09-05T08:00:00Z"),
      capacity: 1,
    };
    expect(
      resolvePaidCourseHold({ ...base, occupiedSeats: 1 }),
    ).toBe("CONFIRM");
    expect(
      resolvePaidCourseHold({ ...base, occupiedSeats: 2 }),
    ).toBe("REBOOK");
  });
});
