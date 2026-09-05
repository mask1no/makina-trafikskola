import type { Prisma } from "@prisma/client";

import {
  calculateCreditExpiries,
  type CreditLedgerEntry,
} from "./expiry";

type LedgerClient = Pick<Prisma.TransactionClient, "creditTransaction">;

export type AvailableCreditBalance = {
  balance: number;
  rawBalance: number;
  pendingExpiryDelta: number;
  entries: CreditLedgerEntry[];
};

export function calculateAvailableCreditBalance(
  entries: CreditLedgerEntry[],
  now: Date,
): Omit<AvailableCreditBalance, "entries"> {
  const rawBalance = entries.reduce((sum, entry) => sum + entry.delta, 0);
  const pendingExpiryDelta = calculateCreditExpiries(entries, now).reduce(
    (sum, expiry) => sum + expiry.delta,
    0,
  );

  return {
    balance: rawBalance + pendingExpiryDelta,
    rawBalance,
    pendingExpiryDelta,
  };
}

export async function getAvailableCreditBalance(
  tx: LedgerClient,
  studentId: string,
  now: Date,
): Promise<AvailableCreditBalance> {
  const entries = await tx.creditTransaction.findMany({
    where: { studentId },
    select: {
      id: true,
      delta: true,
      reason: true,
      orderItemId: true,
      expiresAt: true,
      createdAt: true,
    },
  });
  return { ...calculateAvailableCreditBalance(entries, now), entries };
}

export async function getCreditBalance(
  tx: Prisma.TransactionClient,
  studentId: string,
  now: Date,
) {
  return (await getAvailableCreditBalance(tx, studentId, now)).balance;
}
