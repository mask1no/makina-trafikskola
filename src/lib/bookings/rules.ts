/** Minutes blocked around each confirmed lesson for the same teacher. */
export const TEACHER_LESSON_BUFFER_MINUTES = 15;

/** Furthest ahead a lesson may be booked (calendar weeks from `now`). */
export const MAX_BOOKING_HORIZON_WEEKS = 4;

export function maxBookingHorizonDays(
  weeks: number = MAX_BOOKING_HORIZON_WEEKS,
) {
  return weeks * 7;
}

export function isWithinBookingHorizon(
  startsAt: Date,
  now: Date,
  weeks: number = MAX_BOOKING_HORIZON_WEEKS,
) {
  const horizonMs = maxBookingHorizonDays(weeks) * 24 * 60 * 60 * 1000;
  return startsAt.getTime() <= now.getTime() + horizonMs;
}
