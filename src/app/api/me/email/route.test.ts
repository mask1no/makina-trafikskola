import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    user: { findFirst: vi.fn(), update: vi.fn() },
    auditLog: { create: vi.fn() },
  };
  return {
    auth: vi.fn(),
    allowRateLimitedAction: vi.fn(),
    consumeOtp: vi.fn(),
    compare: vi.fn(),
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
vi.mock("bcryptjs", () => ({ default: { compare: mocks.compare } }));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/me/email", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("student email changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    mocks.allowRateLimitedAction.mockResolvedValue(true);
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) =>
        callback(mocks.tx),
    );
    mocks.tx.user.findFirst
      .mockResolvedValueOnce({
        id: "student-1",
        email: "old@example.com",
        phone: "+46701111111",
        passwordHash: "hash",
      })
      .mockResolvedValueOnce(null);
    mocks.compare.mockResolvedValue(true);
  });

  it("saves a lowercase unique email after password confirmation", async () => {
    const response = await POST(
      request({ email: "New@Example.COM", password: "password12" }),
    );

    expect(response.status).toBe(204);
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: { email: "new@example.com", emailVerifiedAt: expect.any(Date) },
    });
    expect(mocks.tx.auditLog.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        action: "user.email_changed",
        before: { email: "o***@example.com" },
        after: { email: "n***@example.com" },
      }),
    });
  });

  it("returns EMAIL_TAKEN when the address is already used", async () => {
    mocks.tx.user.findFirst
      .mockReset()
      .mockResolvedValueOnce({
        id: "student-1",
        email: "old@example.com",
        phone: "+46701111111",
        passwordHash: "hash",
      })
      .mockResolvedValueOnce({ id: "other" });

    const response = await POST(
      request({ email: "taken@example.com", password: "password12" }),
    );

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "EMAIL_TAKEN" },
    });
  });
});
