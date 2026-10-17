import { describe, expect, it } from "vitest";

import { isOpenNow, nextOpening, todayHours } from "./opening-hours";

describe("opening hours", () => {
  it("is open on a Thursday morning in Stockholm and closed at closing time", () => {
    const open = new Date("2026-10-01T07:00:00.000Z");
    const closing = new Date("2026-10-01T19:00:00.000Z");
    expect(todayHours(open)).toEqual({ open: "08:00", close: "21:00" });
    expect(isOpenNow(open)).toBe(true);
    expect(isOpenNow(closing)).toBe(false);
  });

  it("is open on Sunday between 10 and 18", () => {
    const sundayMorning = new Date("2026-10-04T09:00:00.000Z"); // 11:00 Stockholm (CEST)
    const sundayEvening = new Date("2026-10-04T17:00:00.000Z"); // 19:00 Stockholm
    expect(todayHours(sundayMorning)).toEqual({ open: "10:00", close: "18:00" });
    expect(isOpenNow(sundayMorning)).toBe(true);
    expect(isOpenNow(sundayEvening)).toBe(false);
  });

  it("names the next opening when closed", () => {
    const beforeOpen = new Date("2026-10-01T05:00:00.000Z");
    expect(nextOpening(beforeOpen)).toEqual({
      time: "08:00",
      weekday: 4,
      sameDay: true,
    });
    const afterClose = new Date("2026-10-01T19:00:00.000Z");
    expect(nextOpening(afterClose)).toEqual({
      time: "08:00",
      weekday: 5,
      sameDay: false,
    });
    const sundayBeforeOpen = new Date("2026-10-04T07:00:00.000Z"); // 09:00 Stockholm
    expect(nextOpening(sundayBeforeOpen)).toEqual({
      time: "10:00",
      weekday: 0,
      sameDay: true,
    });
  });

  it("uses the winter offset", () => {
    const winterOpen = new Date("2026-01-08T07:00:00.000Z");
    expect(isOpenNow(winterOpen)).toBe(true);
    expect(todayHours(winterOpen)?.close).toBe("21:00");
  });
});
