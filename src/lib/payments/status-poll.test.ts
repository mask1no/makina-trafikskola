import { describe, expect, it } from "vitest";

import {
  PAYMENT_POLL_MAX_MS,
  PAYMENT_POLL_MS,
  paymentPollView,
} from "./status-poll";

describe("payment status polling", () => {
  it("uses a 3s interval and 2 minute timeout", () => {
    expect(PAYMENT_POLL_MS).toBe(3000);
    expect(PAYMENT_POLL_MAX_MS).toBe(120_000);
  });

  it("shows paid and failed without a manual reload", () => {
    expect(paymentPollView("PAID", 3000)).toEqual({ kind: "paid" });
    expect(paymentPollView("FAILED", 3000)).toEqual({ kind: "failed" });
  });

  it("stays pending until the timeout, then shows the slow message", () => {
    expect(paymentPollView("PENDING", 0)).toEqual({ kind: "pending" });
    expect(paymentPollView("PENDING", PAYMENT_POLL_MAX_MS - 1)).toEqual({
      kind: "pending",
    });
    expect(paymentPollView("PENDING", PAYMENT_POLL_MAX_MS)).toEqual({
      kind: "slow",
    });
  });
});
