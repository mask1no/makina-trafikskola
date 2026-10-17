import { describe, expect, it } from "vitest";

import { getOpeningStatus } from "./opening-hours";

/** Thursday 1 Oct 2026 in Europe/Stockholm (CEST, UTC+2). */
function stockholm(hour: number, minute: number) {
  const utcHour = hour - 2;
  return new Date(
    Date.UTC(
      2026,
      9,
      1,
      utcHour < 0 ? utcHour + 24 : utcHour,
      minute,
      0,
      0,
    ),
  );
}

describe("getOpeningStatus", () => {
  it("is closed just before weekday opening (07:59)", () => {
    expect(getOpeningStatus(stockholm(7, 59))).toEqual({
      open: false,
      until: null,
      next: { time: "08:00", weekday: 4, sameDay: true },
    });
  });

  it("is open at weekday opening (08:00)", () => {
    expect(getOpeningStatus(stockholm(8, 0))).toEqual({
      open: true,
      until: "21:00",
      next: null,
    });
  });

  it("is open just before weekday closing (20:59)", () => {
    expect(getOpeningStatus(stockholm(20, 59))).toEqual({
      open: true,
      until: "21:00",
      next: null,
    });
  });

  it("is closed at weekday closing (21:00) and names the next opening", () => {
    expect(getOpeningStatus(stockholm(21, 0))).toEqual({
      open: false,
      until: null,
      next: { time: "08:00", weekday: 5, sameDay: false },
    });
  });

  it("names Saturday 10:00 after Friday close", () => {
    // Friday 2 Oct 2026 21:00 Stockholm = 19:00 UTC
    const fridayClose = new Date("2026-10-02T19:00:00.000Z");
    expect(getOpeningStatus(fridayClose)).toEqual({
      open: false,
      until: null,
      next: { time: "10:00", weekday: 6, sameDay: false },
    });
  });
});
