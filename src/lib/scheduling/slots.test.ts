import { parseISO } from "date-fns";
import { describe, expect, it } from "vitest";

import {
  getAvailableSlots,
  type SlotInput,
} from "./slots";

const date = (value: string) => parseISO(value);

const mondayRule: SlotInput["rules"][number] = {
  dayOfWeek: 1,
  startTime: "09:00",
  endTime: "12:00",
  validFrom: null,
  validUntil: null,
};

function mondayInput(
  overrides: Partial<SlotInput> = {},
): SlotInput {
  return {
    now: date("2026-01-11T00:00:00Z"),
    from: date("2026-01-12T00:00:00Z"),
    to: date("2026-01-13T00:00:00Z"),
    lessonMinutes: 50,
    travelBufferMin: 0,
    minNoticeHours: 0,
    rules: [mondayRule],
    exceptions: [],
    bookings: [],
    ...overrides,
  };
}

describe("getAvailableSlots", () => {
  const cases: {
    name: string;
    input: SlotInput;
    expectedCount: number;
  }[] = [
    {
      name: "empty rules",
      input: mondayInput({ rules: [] }),
      expectedCount: 0,
    },
    {
      name: "one rule with no bookings",
      input: mondayInput(),
      expectedCount: 3,
    },
    {
      name: "a booking in the middle splits the day",
      input: mondayInput({
        bookings: [
          {
            startsAt: date("2026-01-12T08:50:00Z"),
            endsAt: date("2026-01-12T09:40:00Z"),
          },
        ],
      }),
      expectedCount: 2,
    },
    {
      name: "travel buffer blocks the adjacent slot",
      input: mondayInput({
        travelBufferMin: 10,
        bookings: [
          {
            startsAt: date("2026-01-12T08:50:00Z"),
            endsAt: date("2026-01-12T09:40:00Z"),
          },
        ],
      }),
      expectedCount: 1,
    },
    {
      name: "FULL_DAY_OFF removes everything",
      input: mondayInput({
        exceptions: [
          {
            date: date("2026-01-12T00:00:00Z"),
            type: "FULL_DAY_OFF",
            startTime: null,
            endTime: null,
          },
        ],
      }),
      expectedCount: 0,
    },
    {
      name: "PARTIAL_BLOCK splits an interval",
      input: mondayInput({
        exceptions: [
          {
            date: date("2026-01-12T00:00:00Z"),
            type: "PARTIAL_BLOCK",
            startTime: "10:00",
            endTime: "11:00",
          },
        ],
      }),
      expectedCount: 2,
    },
    {
      name: "EXTRA_HOURS adds time outside a rule",
      input: mondayInput({
        exceptions: [
          {
            date: date("2026-01-12T00:00:00Z"),
            type: "EXTRA_HOURS",
            startTime: "08:00",
            endTime: "09:00",
          },
        ],
      }),
      expectedCount: 4,
    },
    {
      name: "minimum notice removes early same-day slots",
      input: mondayInput({
        now: date("2026-01-12T08:30:00Z"),
        minNoticeHours: 1,
      }),
      expectedCount: 1,
    },
    {
      name: "a crossing interval has seven real hours on the March DST day",
      input: {
        ...mondayInput(),
        from: date("2026-03-28T23:00:00Z"),
        to: date("2026-03-29T22:00:00Z"),
        lessonMinutes: 60,
        rules: [
          {
            dayOfWeek: 0,
            startTime: "00:00",
            endTime: "08:00",
            validFrom: null,
            validUntil: null,
          },
        ],
      },
      expectedCount: 7,
    },
    {
      name: "a crossing interval has nine real hours on the October DST day",
      input: {
        ...mondayInput(),
        from: date("2026-10-24T22:00:00Z"),
        to: date("2026-10-25T23:00:00Z"),
        lessonMinutes: 60,
        rules: [
          {
            dayOfWeek: 0,
            startTime: "00:00",
            endTime: "08:00",
            validFrom: null,
            validUntil: null,
          },
        ],
      },
      expectedCount: 9,
    },
    {
      name: "100-minute lessons never cross the end of a rule",
      input: mondayInput({ lessonMinutes: 100 }),
      expectedCount: 1,
    },
  ];

  it.each(cases)("$name", ({ input, expectedCount }) => {
    expect(getAvailableSlots(input)).toHaveLength(expectedCount);
  });

  it("returns UTC timestamps for Stockholm wall-clock rules", () => {
    const [slot] = getAvailableSlots(mondayInput());
    expect(slot).toEqual({
      startsAt: date("2026-01-12T08:00:00Z"),
      endsAt: date("2026-01-12T08:50:00Z"),
    });
  });
});
