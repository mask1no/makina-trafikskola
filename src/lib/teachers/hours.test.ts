import { describe, expect, it } from "vitest";

import { hoursOverlap } from "./hours";

describe("hoursOverlap", () => {
  it("accepts back-to-back and different-day ranges", () => {
    expect(
      hoursOverlap([
        { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        { dayOfWeek: 1, startTime: "12:00", endTime: "15:00" },
        { dayOfWeek: 2, startTime: "09:00", endTime: "17:00" },
      ]),
    ).toBe(false);
  });

  it("rejects overlaps and empty or inverted ranges", () => {
    expect(
      hoursOverlap([
        { dayOfWeek: 1, startTime: "09:00", endTime: "12:00" },
        { dayOfWeek: 1, startTime: "11:00", endTime: "15:00" },
      ]),
    ).toBe(true);
    expect(hoursOverlap([{ dayOfWeek: 3, startTime: "10:00", endTime: "10:00" }])).toBe(true);
    expect(hoursOverlap([{ dayOfWeek: 3, startTime: "11:00", endTime: "10:00" }])).toBe(true);
  });
});
