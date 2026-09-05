import { subHours } from "date-fns";

export type CancellationActorRole = "STUDENT" | "TEACHER" | "ADMIN";

export function getCancellationDeadline(
  startsAt: Date,
  cancellationWindowHours: number,
) {
  return subHours(startsAt, cancellationWindowHours);
}

export function isLateStudentCancellation(input: {
  actorRole: CancellationActorRole;
  startsAt: Date;
  now: Date;
  cancellationWindowHours: number;
}) {
  return (
    input.actorRole === "STUDENT" &&
    input.now >=
      getCancellationDeadline(
        input.startsAt,
        input.cancellationWindowHours,
      )
  );
}

export function getCancellationCreditReason(input: {
  actorRole: CancellationActorRole;
  creditCharged: boolean;
  startsAt: Date;
  now: Date;
  cancellationWindowHours: number;
}) {
  if (!input.creditCharged) return null;
  if (input.actorRole !== "STUDENT") {
    return "TEACHER_CANCELLATION_REFUND" as const;
  }
  return isLateStudentCancellation(input)
    ? ("LATE_CANCELLATION_CHARGE" as const)
    : ("CANCELLATION_REFUND" as const);
}

export function cancellationRequiresImmediateStudentNotification(
  actorRole: CancellationActorRole,
) {
  return actorRole !== "STUDENT";
}

export function canDeactivateInstructor(futureBookingCount: number) {
  return futureBookingCount === 0;
}
