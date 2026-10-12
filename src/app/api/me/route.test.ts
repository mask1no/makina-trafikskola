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
    updateUser: vi.fn(),
    auditCreate: vi.fn(),
    retrieveIntent: vi.fn(),
    stripeIsConfigured: vi.fn(),
    transaction: vi.fn(),
    getAvailableCreditBalance: vi.fn(),
    tx,
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/otp-store", () => ({ consumeOtp: mocks.consumeOtp }));
vi.mock("@/lib/credits/ledger", () => ({
  getAvailableCreditBalance: mocks.getAvailableCreditBalance,
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: mocks.findUser, update: mocks.updateUser },
    auditLog: { create: mocks.auditCreate },
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

import { DELETE, PATCH } from "./route";

function request(body: Record<string, unknown> = {}) {
  return new Request("http://localhost/api/me", {
    method: "DELETE",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      confirm: "DELETE",
      unusedCreditsAck: true,
      code: "123456",
      ...body,
    }),
  });
}

function userWithPendingIntent() {
  return {
    id: "student-1",
    phone: "+46701111111",
    passwordHash: "hash",
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

  it("requires unusedCreditsAck before deleting", async () => {
    const response = await DELETE(
      new Request("http://localhost/api/me", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ confirm: "DELETE", code: "123456" }),
      }),
    );
    expect(response.status).toBe(400);
  });

  it("updates the student name after validation", async () => {
    mocks.findUser.mockResolvedValue({
      id: "student-1",
      firstName: "Ada",
      lastName: "Student",
    });
    mocks.updateUser.mockResolvedValue({
      firstName: "Nova",
      lastName: "Student",
    });

    const response = await PATCH(
      new Request("http://localhost/api/me", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ firstName: "Nova" }),
      }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      firstName: "Nova",
      lastName: "Student",
    });
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "user.name_changed" }),
    });
  });
});

