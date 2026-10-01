import { describe, expect, it } from "vitest";

import {
  formatDate,
  formatDeadline,
  formatLessonDateTime,
  formatLessonTime,
  formatWeekday,
  stockholmDateKey,
  stockholmFormatter,
  stockholmParts,
} from "./datetime";

const morning = new Date("2026-10-01T07:00:00.000Z");

describe("Stockholm datetime formatting", () => {
  it("formats a lesson in Europe/Stockholm with Latin digits", () => {
    expect(formatLessonDateTime(morning, "sv-SE")).toMatch(/09:00/);
    expect(formatLessonDateTime(morning, "ar")).toMatch(/09:00/);
    expect(formatLessonTime(morning, "en")).toBe(
      formatLessonTime(morning, "en"),
    );
    expect(formatLessonTime(morning, "sv")).toContain("09");
  });

  it("keeps dates, weekdays and deadlines in Stockholm", () => {
    expect(formatDate(morning, "sv")).toMatch(/2026/);
    expect(formatWeekday(morning, "en", "short")).toBe("Thu");
    expect(formatDeadline(morning, "sv")).toMatch(/09:00/);
    expect(stockholmDateKey(morning)).toBe("2026-10-01");
    expect(stockholmParts(morning)).toMatchObject({
      year: 2026,
      month: 10,
      day: 1,
      hour: 9,
      minute: 0,
    });
  });

  it("reuses formatter instances for the same locale and options", () => {
    const first = stockholmFormatter("sv", { hour: "2-digit" });
    const second = stockholmFormatter("sv", { hour: "2-digit" });
    expect(second).toBe(first);
  });
});
