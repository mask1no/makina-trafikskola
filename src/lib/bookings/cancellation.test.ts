import { describe, expect, it } from "vitest";

import {
  cancellationRequiresImmediateStudentNotification,
  canDeactivateInstructor,
  getCancellationCreditReason,
  getCancellationDeadline,
} from "./cancellation";

const startsAt = new Date("2026-09-06T12:00:00.000Z");

describe("cancellation rules R14-R18", () => {
  it("R14 refunds a charged student cancellation more than 24 hours out", () => {
    expect(
      getCancellationCreditReason({
        actorRole: "STUDENT",
        creditCharged: true,
        startsAt,
        now: new Date("2026-09-05T10:59:59.999Z"),
        cancellationWindowHours: 24,
      }),
    ).toBe("CANCELLATION_REFUND");
  });

  it("R15 keeps the credit at and within the cancellation deadline", () => {
    expect(
      getCancellationCreditReason({
        actorRole: "STUDENT",
        creditCharged: true,
        startsAt,
        now: new Date("2026-09-05T12:00:00.000Z"),
        cancellationWindowHours: 24,
      }),
    ).toBe("LATE_CANCELLATION_CHARGE");
  });

  it("R16 always refunds staff cancellation and requires notification", () => {
    expect(
      getCancellationCreditReason({
        actorRole: "TEACHER",
        creditCharged: true,
        startsAt,
        now: new Date("2026-09-06T11:00:00.000Z"),
        cancellationWindowHours: 24,
      }),
    ).toBe("TEACHER_CANCELLATION_REFUND");
    expect(
      cancellationRequiresImmediateStudentNotification("TEACHER"),
    ).toBe(true);
    expect(cancellationRequiresImmediateStudentNotification("ADMIN")).toBe(
      true,
    );
  });

  it("R17 derives an absolute cancellation deadline", () => {
    expect(getCancellationDeadline(startsAt, 24).toISOString()).toBe(
      "2026-09-05T12:00:00.000Z",
    );
  });

  it("R18 blocks deactivation while future bookings remain", () => {
    expect(canDeactivateInstructor(1)).toBe(false);
    expect(canDeactivateInstructor(0)).toBe(true);
  });
});
