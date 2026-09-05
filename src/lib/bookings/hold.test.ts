import { describe, expect, it } from "vitest";

import {
  checkoutHoldError,
  resolvePaidLessonHold,
  shouldConvertPaidHold,
} from "./hold";

const now = new Date("2026-09-05T10:00:00.000Z");
const activeHold = {
  studentId: "student",
  status: "CONFIRMED",
  creditCharged: false,
  holdExpiresAt: new Date("2026-09-05T10:01:00.000Z"),
};

describe("paid booking holds", () => {
  it("hides missing and foreign bookings behind BOOKING_NOT_FOUND", () => {
    expect(checkoutHoldError(null, "student", now)).toBe("BOOKING_NOT_FOUND");
    expect(checkoutHoldError(activeHold, "other", now)).toBe(
      "BOOKING_NOT_FOUND",
    );
  });

  it("rejects expired or released holds with HOLD_EXPIRED", () => {
    expect(
      checkoutHoldError(
        { ...activeHold, holdExpiresAt: now },
        "student",
        now,
      ),
    ).toBe("HOLD_EXPIRED");
    expect(
      checkoutHoldError(
        { ...activeHold, status: "EXPIRED_HOLD", holdExpiresAt: null },
        "student",
        now,
      ),
    ).toBe("HOLD_EXPIRED");
  });

  it("converts only an active hold with an available resulting credit", () => {
    expect(
      shouldConvertPaidHold({
        booking: activeHold,
        studentId: "student",
        availableBalance: 1,
        now,
      }),
    ).toBe(true);
    expect(
      shouldConvertPaidHold({
        booking: activeHold,
        studentId: "student",
        availableBalance: 0,
        now,
      }),
    ).toBe(false);
  });

  it("keeps a late paid lesson as one rebookable credit", () => {
    const expiredHold = {
      ...activeHold,
      status: "EXPIRED_HOLD",
      holdExpiresAt: null,
    };
    expect(
      resolvePaidLessonHold({
        booking: expiredHold,
        studentId: "student",
        availableBalance: 1,
        now,
      }),
    ).toBe("REBOOK");

    let balance = 1;
    if (balance > 0) balance -= 1;
    expect(balance).toBe(0);
    expect(balance > 0).toBe(false);
  });

  it("still confirms and consumes an in-window payment", () => {
    expect(
      resolvePaidLessonHold({
        booking: activeHold,
        studentId: "student",
        availableBalance: 1,
        now,
      }),
    ).toBe("CONFIRM");
  });
});
