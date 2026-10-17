import { describe, expect, it } from "vitest";

import { slotOverlapsBusy } from "@/lib/calendar/google";

const slot = {
  startsAt: new Date("2026-10-19T08:00:00.000Z"),
  endsAt: new Date("2026-10-19T08:50:00.000Z"),
};

describe("slotOverlapsBusy", () => {
  it("detects a Google Calendar event inside the lesson", () => {
    expect(
      slotOverlapsBusy(slot, [
        {
          start: "2026-10-19T08:15:00.000Z",
          end: "2026-10-19T08:30:00.000Z",
        },
      ]),
    ).toBe(true);
  });

  it("allows an event ending exactly when the lesson starts", () => {
    expect(
      slotOverlapsBusy(slot, [
        {
          start: "2026-10-19T07:00:00.000Z",
          end: "2026-10-19T08:00:00.000Z",
        },
      ]),
    ).toBe(false);
  });

  it("allows an event starting exactly when the lesson ends", () => {
    expect(
      slotOverlapsBusy(slot, [
        {
          start: "2026-10-19T08:50:00.000Z",
          end: "2026-10-19T09:30:00.000Z",
        },
      ]),
    ).toBe(false);
  });
});
