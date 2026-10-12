export const PAYMENT_POLL_MS = 3000;
export const PAYMENT_POLL_MAX_MS = 2 * 60 * 1000;

export type PaymentPollView =
  | { kind: "paid" }
  | { kind: "failed" }
  | { kind: "pending" }
  | { kind: "slow" };

/** Pure view model for the checkout return status poller. */
export function paymentPollView(
  status: string,
  elapsedMs: number,
  maxMs: number = PAYMENT_POLL_MAX_MS,
): PaymentPollView {
  if (status === "PAID") return { kind: "paid" };
  if (status === "FAILED") return { kind: "failed" };
  if (status === "PENDING" && elapsedMs >= maxMs) return { kind: "slow" };
  if (status === "PENDING") return { kind: "pending" };
  return { kind: "pending" };
}
