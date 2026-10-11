import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    user: {
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
    },
    otpCode: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    allowRateLimitedAction: vi.fn(),
    auth: vi.fn(),
    consumeOtp: vi.fn(),
    transaction: vi.fn(),
    tx,
  };
});

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/otp-store", () => ({
  allowRateLimitedAction: mocks.allowRateLimitedAction,
  consumeOtp: mocks.consumeOtp,
}));
vi.mock("@/lib/db", () => ({
  db: { $transaction: mocks.transaction },
}));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/me/phone", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("student phone changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT" },
    });
    mocks.allowRateLimitedAction.mockResolvedValue(true);
    mocks.consumeOtp.mockResolvedValue(true);
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) =>
        callback(mocks.tx),
    );
    mocks.tx.user.findFirst
      .mockResolvedValueOnce({ id: "student-1", phone: "+46701111111" })
      .mockResolvedValueOnce(null);
  });

  it("verifies both numbers and records a PII-free audit entry", async () => {
    const response = await POST(
      request({
        phone: "0702222222",
        currentCode: "111111",
        newCode: "222222",
      }),
    );

    expect(response.status).toBe(204);
    expect(mocks.consumeOtp).toHaveBeenNthCalledWith(
      1,
      "+46701111111",
      "111111",
      expect.any(Date),
      mocks.tx,
    );
    expect(mocks.consumeOtp).toHaveBeenNthCalledWith(
      2,
      "+46702222222",
      "222222",
      expect.any(Date),
      mocks.tx,
    );
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: {
        phone: "+46702222222",
        phoneVerifiedAt: expect.any(Date),
      },
    });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user.phone_changed",
        before: { phoneChanged: false },
        after: { phoneChanged: true },
      }),
    });
  });

  it("rejects a phone number owned by another account", async () => {
    mocks.tx.user.findFirst
      .mockReset()
      .mockResolvedValueOnce({ id: "student-1", phone: "+46701111111" })
      .mockResolvedValueOnce({ id: "student-2" });

    const response = await POST(
      request({
        phone: "0702222222",
        currentCode: "111111",
        newCode: "222222",
      }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "PHONE_IN_USE" },
    });
    expect(mocks.consumeOtp).not.toHaveBeenCalled();
  });
});
