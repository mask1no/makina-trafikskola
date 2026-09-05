export type CreditLedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  orderItemId: string | null;
  expiresAt: Date | null;
  createdAt: Date;
};

export type ExpiryWrite = {
  orderItemId: string;
  delta: number;
};

type Lot = {
  orderItemId: string | null;
  expiresAt: Date | null;
  remaining: number;
};

function spendFromLots(lots: Lot[], amount: number) {
  let remaining = amount;
  for (const lot of lots) {
    if (remaining === 0) break;
    const spent = Math.min(lot.remaining, remaining);
    lot.remaining -= spent;
    remaining -= spent;
  }
  return remaining;
}

export function calculateCreditExpiries(
  entries: CreditLedgerEntry[],
  now: Date,
): ExpiryWrite[] {
  const lots: Lot[] = [];
  let debt = 0;

  const chronological = [...entries].sort(
    (left, right) =>
      left.createdAt.getTime() - right.createdAt.getTime() ||
      left.id.localeCompare(right.id),
  );

  for (const entry of chronological) {
    if (entry.delta > 0) {
      const available = Math.max(0, entry.delta - debt);
      debt = Math.max(0, debt - entry.delta);
      if (available > 0) {
        lots.push({
          orderItemId:
            entry.reason === "PURCHASE" ? entry.orderItemId : null,
          expiresAt:
            entry.reason === "PURCHASE" ? entry.expiresAt : null,
          remaining: available,
        });
      }
      continue;
    }

    if (entry.delta === 0) continue;
    let unallocated: number;
    if (entry.reason === "EXPIRY" && entry.orderItemId) {
      unallocated = spendFromLots(
        lots.filter((lot) => lot.orderItemId === entry.orderItemId),
        -entry.delta,
      );
    } else {
      unallocated = spendFromLots(lots, -entry.delta);
    }
    debt += unallocated;
  }

  const byOrderItem = new Map<string, number>();
  for (const lot of lots) {
    if (
      lot.orderItemId &&
      lot.expiresAt &&
      lot.expiresAt.getTime() <= now.getTime() &&
      lot.remaining > 0
    ) {
      byOrderItem.set(
        lot.orderItemId,
        (byOrderItem.get(lot.orderItemId) ?? 0) + lot.remaining,
      );
    }
  }

  return [...byOrderItem.entries()].map(([orderItemId, remainder]) => ({
    orderItemId,
    delta: -remainder,
  }));
}
