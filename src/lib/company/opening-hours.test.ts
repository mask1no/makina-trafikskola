import { describe, expect, it } from "vitest";

import { isOpenNow, todayHours } from "./opening-hours";

describe("opening hours", () => {
  it("is open on a Thursday morning in Stockholm and closed at closing time", () => {
    const open = new Date("2026-10-01T07:00:00.000Z");
    const closing = new Date("2026-10-01T19:00:00.000Z");
    expect(todayHours(open)).toEqual({ open: "08:00", close: "21:00" });
    expect(isOpenNow(open)).toBe(true);
    expect(isOpenNow(closing)).toBe(false);
  });

  it("is closed on Sunday", () => {
    const sunday = new Date("2026-10-04T10:00:00.000Z");
    expect(todayHours(sunday)).toBeNull();
    expect(isOpenNow(sunday)).toBe(false);
  });

  it("uses the winter offset", () => {
    const winterOpen = new Date("2026-01-08T07:00:00.000Z");
    expect(isOpenNow(winterOpen)).toBe(true);
    expect(todayHours(winterOpen)?.close).toBe("21:00");
  });
});
