import { Prisma } from "@prisma/client";

export class CreditLockBusyError extends Error {
  constructor() {
    super("CREDIT_LOCK_BUSY");
    this.name = "CreditLockBusyError";
  }
}

export function studentLockKey(studentId: string) {
  return `student:${studentId}`;
}

export function teacherSlotLockKey(teacherId: string, startsAt: Date) {
  return `teacher-slot:${teacherId}:${startsAt.toISOString()}`;
}

// All 'makina-booking' locks go through this helper (consistent order, no deadlocks).
export async function lockBookingKeys(
  tx: Prisma.TransactionClient,
  keys: string[],
) {
  const ordered = [...new Set(keys)].sort((left, right) =>
    left < right ? -1 : left > right ? 1 : 0,
  );
  for (const key of ordered) {
    await tx.$queryRaw`
      SELECT pg_advisory_xact_lock(hashtext('makina-booking'), hashtext(${key})) IS NULL AS locked
    `;
  }
}

// First statement of a serializable transaction: retry when the lock is busy.
export async function lockStudentCredits(
  tx: Prisma.TransactionClient,
  studentId: string,
) {
  const key = studentLockKey(studentId);
  const [row] = await tx.$queryRaw<Array<{ locked: boolean }>>`
    SELECT pg_try_advisory_xact_lock(hashtext('makina-booking'), hashtext(${key})) AS locked
  `;
  if (row?.locked !== true) {
    throw new CreditLockBusyError();
  }
  await lockBookingKeys(tx, [key]);
}
