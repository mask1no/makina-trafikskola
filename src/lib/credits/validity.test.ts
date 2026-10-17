import { describe, expect, it } from "vitest";

import { adminCreditExpiresAt, creditValidityDays } from "./validity";

describe("admin credit validity", () => {
  const now = new Date("2026-10-17T10:00:00.000Z");

  it("uses 365 days unless a sane override is set", () => {
    expect(creditValidityDays({})).toBe(365);
    expect(creditValidityDays({ CREDIT_VALIDITY_DAYS: "180" })).toBe(180);
    expect(creditValidityDays({ CREDIT_VALIDITY_DAYS: "0" })).toBe(365);
  });

  it("expires added lessons and leaves removals without an expiry", () => {
    expect(adminCreditExpiresAt(5, now, 365)?.toISOString()).toBe(
      "2027-10-17T10:00:00.000Z",
    );
    expect(adminCreditExpiresAt(-2, now, 365)).toBeNull();
  });
});
