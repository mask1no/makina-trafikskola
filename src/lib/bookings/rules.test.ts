import { describe, expect, it } from "vitest";

import {
  isWithinBookingHorizon,
  maxBookingHorizonDays,
  MAX_BOOKING_HORIZON_WEEKS,
  TEACHER_LESSON_BUFFER_MINUTES,
} from "./rules";

describe("booking rules", () => {
  it("uses a 15-minute buffer between teacher lessons", () => {
    expect(TEACHER_LESSON_BUFFER_MINUTES).toBe(15);
  });

  it("allows booking at most 4 weeks ahead", () => {
    expect(MAX_BOOKING_HORIZON_WEEKS).toBe(4);
    expect(maxBookingHorizonDays()).toBe(28);
    const now = new Date("2026-03-01T10:00:00.000Z");
    expect(
      isWithinBookingHorizon(new Date("2026-03-29T10:00:00.000Z"), now),
    ).toBe(true);
    expect(
      isWithinBookingHorizon(new Date("2026-03-29T10:00:00.001Z"), now),
    ).toBe(false);
  });
});
