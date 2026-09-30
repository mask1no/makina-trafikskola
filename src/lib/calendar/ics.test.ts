import { describe, expect, it } from "vitest";

import { buildCalendar, escapeCalendarText, foldLine, utcCalendarDate } from "./ics";

describe("calendar text", () => {
  it("escapes reserved characters", () => {
    expect(escapeCalendarText("A, B; C\\D\nE")).toBe("A\\, B\\; C\\\\D\\nE");
  });

  it("formats UTC timestamps", () => {
    expect(utcCalendarDate(new Date("2026-10-06T08:05:00.000Z"))).toBe(
      "20261006T080500Z",
    );
  });

  it("folds long lines on octet boundaries", () => {
    const latin = foldLine(`SUMMARY:${"å".repeat(40)}`);
    expect(latin.split("\r\n").every((line) => Buffer.byteLength(line) <= 75)).toBe(
      true,
    );
    const arabic = foldLine(`SUMMARY:${"م".repeat(40)}`);
    expect(arabic.includes("\r\n ")).toBe(true);
    expect(
      arabic
        .split("\r\n")
        .every((line) => Buffer.byteLength(line.startsWith(" ") ? line : line) <= 75),
    ).toBe(true);
    const rebuilt = arabic
      .split("\r\n")
      .map((line, index) => (index === 0 ? line : line.slice(1)))
      .join("");
    expect(rebuilt).toBe(`SUMMARY:${"م".repeat(40)}`);
  });

  it("builds a calendar with folded lines", () => {
    const calendar = buildCalendar({
      prodId: "-//Makina//Test//SV",
      name: "Makina – lektioner",
      timezone: "Europe/Stockholm",
      refreshInterval: "PT1H",
      now: new Date("2026-10-01T00:00:00.000Z"),
      events: [
        {
          uid: "booking@makina.se",
          startsAt: new Date("2026-10-06T08:00:00.000Z"),
          endsAt: new Date("2026-10-06T08:50:00.000Z"),
          summary: `Körlektion – ${"ن".repeat(30)}`,
          location: "Centralvägen 5",
        },
      ],
    });
    expect(calendar).toContain("BEGIN:VCALENDAR");
    expect(calendar).toContain("X-WR-TIMEZONE:Europe/Stockholm");
    expect(calendar.endsWith("\r\n")).toBe(true);
  });
});