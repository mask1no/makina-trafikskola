import { describe, expect, it } from "vitest";

import type { CreditLedgerEntry } from "./expiry";
import { calculateAvailableCreditBalance } from "./ledger";

const now = new Date("2026-09-05T06:00:00.000Z");

function purchase(
  id: string,
  delta: number,
  expiresAt: string,
): CreditLedgerEntry {
  return {
    id,
    delta,
    reason: "PURCHASE",
    orderItemId: `order-${id}`,
    expiresAt: new Date(expiresAt),
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
  };
}

describe("calculateAvailableCreditBalance", () => {
  it("leaves nine lessons after one booking from a ten-lesson package", () => {
    const entries: CreditLedgerEntry[] = [
      purchase("package-10", 10, "2027-01-01T00:00:00.000Z"),
      {
        id: "booking-1",
        delta: -1,
        reason: "BOOKING_CONSUMED",
        orderItemId: null,
        expiresAt: null,
        createdAt: new Date("2026-09-01T08:00:00.000Z"),
      },
    ];

    expect(calculateAvailableCreditBalance(entries, now).balance).toBe(9);
  });

  it("makes an expired unspent lot unavailable before cron writes EXPIRY", () => {
    expect(
      calculateAvailableCreditBalance(
        [purchase("expired", 3, "2026-09-01T00:00:00.000Z")],
        now,
      ),
    ).toEqual({
      rawBalance: 3,
      pendingExpiryDelta: -3,
      balance: 0,
    });
  });

  it("keeps the same available balance after cron writes EXPIRY", () => {
    const entries = [
      purchase("expired", 3, "2026-09-01T00:00:00.000Z"),
      {
        id: "expiry",
        delta: -3,
        reason: "EXPIRY",
        orderItemId: "order-expired",
        expiresAt: null,
        createdAt: now,
      },
    ];

    expect(calculateAvailableCreditBalance(entries, now)).toEqual({
      rawBalance: 0,
      pendingExpiryDelta: 0,
      balance: 0,
    });
  });
});
