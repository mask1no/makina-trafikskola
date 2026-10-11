import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    payment: { updateMany: vi.fn() },
    order: { updateMany: vi.fn() },
    user: { update: vi.fn() },
    studentProfile: { updateMany: vi.fn() },
    booking: { updateMany: vi.fn() },
    review: { updateMany: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return {
    auth: vi.fn(),
    cancelIntent: vi.fn(),
    consumeOtp: vi.fn(),
    findUser: vi.fn(),
    retrieveIntent: vi.fn(),
    stripeIsConfigured: vi.fn(),
    transaction: vi.fn(),
    tx,
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/otp-store", () => ({ consumeOtp: mocks.consumeOtp }));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: mocks.findUser },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/stripe", () => ({
  stripeIsConfigured: mocks.stripeIsConfigured,
  getStripe: () => ({
    paymentIntents: {
      retrieve: mocks.retrieveIntent,
      cancel: mocks.cancelIntent,
    },
  }),
}));

import { DELETE } from "./route";

function request() {
  return new Request("http://localhost/api/me", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ confirm: "DELETE", code: "123456" }),
  });
}

function userWithPendingIntent() {
  return {
    id: "student-1",
    phone: "+46701111111",
    _count: { bookings: 0, courseBookings: 0 },
    orders: [
      {
        id: "order-old",
        payment: { stripePaymentIntentId: "pi_old" },
      },
    ],
  };
}

describe("student account deletion", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT" },
    });
    mocks.consumeOtp.mockResolvedValue(true);
    mocks.stripeIsConfigured.mockReturnValue(true);
    mocks.findUser.mockResolvedValue(userWithPendingIntent());
    mocks.retrieveIntent.mockResolvedValue({
      id: "pi_old",
      status: "requires_payment_method",
    });
    mocks.cancelIntent.mockResolvedValue({ id: "pi_old", status: "canceled" });
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) =>
        callback(mocks.tx),
    );
  });

  it("cancels old live intents and fails their orders before anonymising", async () => {
    const response = await DELETE(request());

    expect(response.status).toBe(204);
    expect(mocks.cancelIntent).toHaveBeenCalledWith("pi_old");
    expect(mocks.tx.payment.updateMany).toHaveBeenCalledWith({
      where: { orderId: { in: ["order-old"] }, status: "PENDING" },
      data: { status: "FAILED" },
    });
    expect(mocks.tx.order.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["order-old"] }, status: "PENDING" },
      data: { status: "FAILED" },
    });
    expect(mocks.tx.user.update).toHaveBeenCalled();
  });

  it("refuses deletion while a payment is processing", async () => {
    mocks.retrieveIntent.mockResolvedValueOnce({
      id: "pi_old",
      status: "processing",
    });

    const response = await DELETE(request());

    expect(response.status).toBe(409);
    expect(mocks.cancelIntent).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
