import { describe, expect, it } from "vitest";

import {
  calculateCreditExpiries,
  type CreditLedgerEntry,
} from "./expiry";

const now = new Date("2026-09-05T06:00:00.000Z");

function entry(
  id: string,
  delta: number,
  createdAt: string,
  options: Partial<CreditLedgerEntry> = {},
): CreditLedgerEntry {
  return {
    id,
    delta,
    reason: delta > 0 ? "PURCHASE" : "BOOKING_CONSUMED",
    orderItemId: delta > 0 ? `order-${id}` : null,
    expiresAt:
      delta > 0 ? new Date("2026-09-01T00:00:00.000Z") : null,
    createdAt: new Date(createdAt),
    ...options,
  };
}

describe("calculateCreditExpiries", () => {
  it("allocates consumption FIFO before expiring purchase remainders", () => {
    const result = calculateCreditExpiries(
      [
        entry("a", 3, "2026-01-01T00:00:00.000Z"),
        entry("b", 4, "2026-02-01T00:00:00.000Z"),
        entry("use", -5, "2026-03-01T00:00:00.000Z"),
      ],
      now,
    );

    expect(result).toEqual([{ orderItemId: "order-b", delta: -2 }]);
  });

  it("does not expire non-purchase credits", () => {
    const result = calculateCreditExpiries(
      [
        entry("adjustment", 2, "2026-01-01T00:00:00.000Z", {
          reason: "ADMIN_ADJUSTMENT",
          orderItemId: null,
          expiresAt: null,
        }),
        entry("purchase", 3, "2026-02-01T00:00:00.000Z"),
        entry("use", -2, "2026-03-01T00:00:00.000Z"),
      ],
      now,
    );

    expect(result).toEqual([
      { orderItemId: "order-purchase", delta: -3 },
    ]);
  });

  it("is idempotent after the generated expiry is replayed", () => {
    const before = [
      entry("purchase", 5, "2026-01-01T00:00:00.000Z"),
      entry("use", -2, "2026-02-01T00:00:00.000Z"),
    ];
    const first = calculateCreditExpiries(before, now);
    expect(first).toEqual([
      { orderItemId: "order-purchase", delta: -3 },
    ]);

    const second = calculateCreditExpiries(
      [
        ...before,
        entry("expiry", -3, "2026-09-05T06:00:00.000Z", {
          reason: "EXPIRY",
          orderItemId: "order-purchase",
          expiresAt: null,
        }),
      ],
      now,
    );
    expect(second).toEqual([]);
  });

  it("keeps future purchase lots untouched", () => {
    expect(
      calculateCreditExpiries(
        [
          entry("future", 4, "2026-01-01T00:00:00.000Z", {
            expiresAt: new Date("2026-10-01T00:00:00.000Z"),
          }),
        ],
        now,
      ),
    ).toEqual([]);
  });
});
