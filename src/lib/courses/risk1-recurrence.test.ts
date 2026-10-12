import { formatInTimeZone } from "date-fns-tz";
import { describe, expect, it } from "vitest";

import { risk1OccurrenceDates } from "./risk1-recurrence";

describe("risk1OccurrenceDates", () => {
  it("creates the 15th and 28th for the next three months", () => {
    const dates = risk1OccurrenceDates(
      new Date("2026-03-01T10:00:00.000Z"),
      3,
      [15, 28],
    );
    expect(dates).toHaveLength(6);
    const keys = dates.map((date) =>
      formatInTimeZone(date, "Europe/Stockholm", "yyyy-MM-dd"),
    );
    expect(keys).toEqual([
      "2026-03-15",
      "2026-03-28",
      "2026-04-15",
      "2026-04-28",
      "2026-05-15",
      "2026-05-28",
    ]);
  });
});

