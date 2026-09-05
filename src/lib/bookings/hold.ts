export type HeldBookingState = {
  studentId: string;
  status: string;
  creditCharged: boolean;
  holdExpiresAt: Date | null;
};

export function checkoutHoldError(
  booking: HeldBookingState | null,
  studentId: string,
  now: Date,
) {
  if (!booking || booking.studentId !== studentId) {
    return "BOOKING_NOT_FOUND" as const;
  }
  if (
    booking.status !== "CONFIRMED" ||
    booking.creditCharged ||
    !booking.holdExpiresAt ||
    booking.holdExpiresAt <= now
  ) {
    return "HOLD_EXPIRED" as const;
  }
  return null;
}

export function shouldConvertPaidHold(input: {
  booking: HeldBookingState | null;
  studentId: string;
  availableBalance: number;
  now: Date;
}) {
  return (
    checkoutHoldError(input.booking, input.studentId, input.now) === null &&
    input.availableBalance > 0
  );
}

export function resolvePaidLessonHold(input: {
  booking: HeldBookingState | null;
  studentId: string;
  availableBalance: number;
  now: Date;
}) {
  if (shouldConvertPaidHold(input)) return "CONFIRM" as const;
  if (
    input.booking?.studentId === input.studentId &&
    !input.booking.creditCharged &&
    (input.booking.status === "EXPIRED_HOLD" ||
      (input.booking.status === "CONFIRMED" &&
        input.booking.holdExpiresAt !== null &&
        input.booking.holdExpiresAt <= input.now))
  ) {
    return "REBOOK" as const;
  }
  return "IGNORE" as const;
}
