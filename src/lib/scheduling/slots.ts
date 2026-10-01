import {
  addDays,
  addHours,
  addMinutes,
  differenceInMilliseconds,
  fromUnixTime,
  parseISO,
} from "date-fns";

import { stockholmParts } from "@/lib/format/datetime";

export type SlotInput = {
  now: Date;
  from: Date;
  to: Date;
  lessonMinutes: number;
  travelBufferMin: number;
  minNoticeHours: number;
  rules: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
    validFrom: Date | null;
    validUntil: Date | null;
  }[];
  exceptions: {
    date: Date;
    type: "FULL_DAY_OFF" | "PARTIAL_BLOCK" | "EXTRA_HOURS";
    startTime: string | null;
    endTime: string | null;
  }[];
  bookings: { startsAt: Date; endsAt: Date }[];
};

export type Slot = { startsAt: Date; endsAt: Date };

type MinuteInterval = { start: number; end: number };
type DateInterval = { start: Date; end: Date };

function localParts(date: Date) {
  return stockholmParts(date);
}

function localDateKey(date: Date) {
  const parts = localParts(date);
  return `${parts.year.toString().padStart(4, "0")}-${parts.month
    .toString()
    .padStart(2, "0")}-${parts.day.toString().padStart(2, "0")}`;
}

function utcDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function parseMinutes(time: string) {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
}

function localDateTimeToUtc(dateKey: string, minutes: number) {
  const hours = Math.floor(minutes / 60);
  const minute = minutes % 60;
  const localAsUtc = parseISO(
    `${dateKey}T${hours.toString().padStart(2, "0")}:${minute
      .toString()
      .padStart(2, "0")}:00Z`,
  );
  let result = localAsUtc;

  for (let iteration = 0; iteration < 3; iteration += 1) {
    const parts = localParts(result);
    const representedAsUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    );
    const corrected =
      localAsUtc.getTime() - (representedAsUtc - result.getTime());
    result = fromUnixTime(corrected / 1000);
  }

  return result;
}

function enumerateLocalDates(from: Date, to: Date) {
  const first = localDateKey(from);
  const last = localDateKey(to);
  const dates: string[] = [];
  let cursor = parseISO(`${first}T12:00:00Z`);

  while (utcDateKey(cursor) <= last) {
    dates.push(utcDateKey(cursor));
    cursor = addDays(cursor, 1);
  }

  return dates;
}

function subtractMinuteInterval(
  intervals: MinuteInterval[],
  block: MinuteInterval,
) {
  return intervals.flatMap((interval) => {
    if (block.end <= interval.start || block.start >= interval.end) {
      return [interval];
    }

    const remaining: MinuteInterval[] = [];
    if (block.start > interval.start) {
      remaining.push({
        start: interval.start,
        end: Math.min(block.start, interval.end),
      });
    }
    if (block.end < interval.end) {
      remaining.push({
        start: Math.max(block.end, interval.start),
        end: interval.end,
      });
    }
    return remaining;
  });
}

function mergeMinuteIntervals(intervals: MinuteInterval[]) {
  const sorted = intervals
    .filter((interval) => interval.end > interval.start)
    .sort((left, right) => left.start - right.start);
  const merged: MinuteInterval[] = [];

  for (const interval of sorted) {
    const previous = merged.at(-1);
    if (!previous || interval.start > previous.end) {
      merged.push({ ...interval });
    } else {
      previous.end = Math.max(previous.end, interval.end);
    }
  }

  return merged;
}

function subtractDateInterval(
  intervals: DateInterval[],
  block: DateInterval,
) {
  return intervals.flatMap((interval) => {
    if (block.end <= interval.start || block.start >= interval.end) {
      return [interval];
    }

    const remaining: DateInterval[] = [];
    if (block.start > interval.start) {
      remaining.push({
        start: interval.start,
        end: block.start < interval.end ? block.start : interval.end,
      });
    }
    if (block.end < interval.end) {
      remaining.push({
        start: block.end > interval.start ? block.end : interval.start,
        end: interval.end,
      });
    }
    return remaining;
  });
}

function ruleIsValidOn(
  dateKey: string,
  rule: SlotInput["rules"][number],
) {
  const fromKey = rule.validFrom ? localDateKey(rule.validFrom) : null;
  const untilKey = rule.validUntil ? localDateKey(rule.validUntil) : null;
  return (!fromKey || dateKey >= fromKey) && (!untilKey || dateKey <= untilKey);
}

export function getAvailableSlots(input: SlotInput): Slot[] {
  if (
    input.to <= input.from ||
    input.lessonMinutes <= 0 ||
    input.travelBufferMin < 0 ||
    input.minNoticeHours < 0
  ) {
    return [];
  }

  const noticeThreshold = addHours(input.now, input.minNoticeHours);
  const bookingBlocks = input.bookings.map((booking) => ({
    start: addMinutes(booking.startsAt, -input.travelBufferMin),
    end: addMinutes(booking.endsAt, input.travelBufferMin),
  }));
  const slots: Slot[] = [];

  for (const dateKey of enumerateLocalDates(input.from, input.to)) {
    const dayOfWeek = parseISO(`${dateKey}T12:00:00Z`).getUTCDay();
    const dayExceptions = input.exceptions.filter(
      (exception) => utcDateKey(exception.date) === dateKey,
    );
    if (
      dayExceptions.some((exception) => exception.type === "FULL_DAY_OFF")
    ) {
      continue;
    }

    let wallIntervals: MinuteInterval[] = input.rules
      .filter(
        (rule) =>
          rule.dayOfWeek === dayOfWeek && ruleIsValidOn(dateKey, rule),
      )
      .map((rule) => ({
        start: parseMinutes(rule.startTime),
        end: parseMinutes(rule.endTime),
      }));

    wallIntervals.push(
      ...dayExceptions
        .filter(
          (
            exception,
          ): exception is typeof exception & {
            startTime: string;
            endTime: string;
          } =>
            exception.type === "EXTRA_HOURS" &&
            exception.startTime !== null &&
            exception.endTime !== null,
        )
        .map((exception) => ({
          start: parseMinutes(exception.startTime),
          end: parseMinutes(exception.endTime),
        })),
    );

    wallIntervals = mergeMinuteIntervals(wallIntervals);

    for (const exception of dayExceptions) {
      if (
        exception.type === "PARTIAL_BLOCK" &&
        exception.startTime &&
        exception.endTime
      ) {
        wallIntervals = subtractMinuteInterval(wallIntervals, {
          start: parseMinutes(exception.startTime),
          end: parseMinutes(exception.endTime),
        });
      }
    }

    for (const wallInterval of wallIntervals) {
      let available: DateInterval[] = [
        {
          start: localDateTimeToUtc(dateKey, wallInterval.start),
          end: localDateTimeToUtc(dateKey, wallInterval.end),
        },
      ];

      for (const block of bookingBlocks) {
        available = subtractDateInterval(available, block);
      }

      for (const interval of available) {
        let startsAt = interval.start;
        while (
          differenceInMilliseconds(interval.end, startsAt) >=
          input.lessonMinutes * 60 * 1000
        ) {
          const endsAt = addMinutes(startsAt, input.lessonMinutes);
          if (
            startsAt >= input.from &&
            endsAt <= input.to &&
            startsAt >= noticeThreshold
          ) {
            slots.push({ startsAt, endsAt });
          }
          startsAt = endsAt;
        }
      }
    }
  }

  return slots.sort(
    (left, right) => left.startsAt.getTime() - right.startsAt.getTime(),
  );
}
