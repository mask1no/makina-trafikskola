import { describe, expect, it } from "vitest";

import { ownerBookingMessage, ownerNotifyPhone } from "./owner";

const startsAt = new Date("2026-10-15T07:00:00.000Z");

describe("ownerBookingMessage", () => {
  it("lists time, teacher, student first name and area", () => {
    const message = ownerBookingMessage({
      event: "new",
      startsAt,
      teacherName: "Anna Lind",
      studentFirstName: "Erik",
      area: "Farsta",
    });
    expect(message).toMatch(/^Ny bokning: .*09:00, Anna Lind, Erik, Farsta$/);
  });

  it("labels cancels and moves, including the previous time", () => {
    const base = { startsAt, teacherName: "Anna Lind", studentFirstName: "Erik" };
    expect(ownerBookingMessage({ ...base, event: "cancelled" })).toMatch(/^Avbokad: /);
    const moved = ownerBookingMessage({
      ...base,
      event: "moved",
      previousStartsAt: new Date("2026-10-14T07:00:00.000Z"),
    });
    expect(moved).toMatch(/^Flyttad: .* \(från .*\), Anna Lind, Erik$/);
  });
});

describe("ownerNotifyPhone", () => {
  it("is null when unset and E.164 when set", () => {
    expect(ownerNotifyPhone({})).toBeNull();
    expect(ownerNotifyPhone({ ADMIN_NOTIFY_PHONE: "070 123 45 67" })).toBe("+46701234567");
  });
});
