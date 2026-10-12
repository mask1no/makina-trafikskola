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
    compare: vi.fn(),
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
vi.mock("bcryptjs", () => ({
  default: { compare: mocks.compare },
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
      .mockResolvedValueOnce({
        id: "student-1",
        phone: "+46701111111",
        passwordHash: "hash",
        googleSub: null,
        lastAuthAt: null,
      })
      .mockResolvedValueOnce(null);
  });

  it("verifies both numbers and records a masked audit entry", async () => {
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
      "+46702222222",
      "222222",
      expect.any(Date),
      mocks.tx,
    );
    expect(mocks.consumeOtp).toHaveBeenNthCalledWith(
      2,
      "+46701111111",
      "111111",
      expect.any(Date),
      mocks.tx,
    );
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: {
        phone: "+46702222222",
        phoneVerifiedAt: expect.any(Date),
        sessionVersion: { increment: 1 },
      },
    });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user.phone_changed",
        before: { phone: expect.stringMatching(/^\+46/) },
        after: expect.objectContaining({
          phone: expect.stringMatching(/^\+46/),
          lostOldNumber: false,
        }),
      }),
    });
  });

  it("allows lost-old-number flow with password confirmation", async () => {
    mocks.compare.mockResolvedValue(true);

    const response = await POST(
      request({
        phone: "0702222222",
        newCode: "222222",
        lostOldNumber: true,
        password: "password12",
      }),
    );

    expect(response.status).toBe(204);
    expect(mocks.consumeOtp).toHaveBeenCalledTimes(1);
    expect(mocks.consumeOtp).toHaveBeenCalledWith(
      "+46702222222",
      "222222",
      expect.any(Date),
      mocks.tx,
    );
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user.phone_changed_lost",
        after: expect.objectContaining({ lostOldNumber: true }),
      }),
    });
  });

  it("rejects lost-old-number without password or recent auth", async () => {
    const response = await POST(
      request({
        phone: "0702222222",
        newCode: "222222",
        lostOldNumber: true,
      }),
    );

    expect(response.status).toBe(403);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "LOST_PHONE_NOT_ALLOWED" },
    });
  });

  it("rejects a phone number owned by another account", async () => {
    mocks.tx.user.findFirst
      .mockReset()
      .mockResolvedValueOnce({
        id: "student-1",
        phone: "+46701111111",
        passwordHash: "hash",
        googleSub: null,
        lastAuthAt: null,
      })
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
