import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
    allowLoginAttempt: vi.fn(),
    auth: vi.fn(),
    consumeOtp: vi.fn(),
    transaction: vi.fn(),
    tx,
    updateSession: vi.fn(),
  };
});

vi.mock("@/auth", () => ({
  auth: mocks.auth,
  updateSession: mocks.updateSession,
}));
vi.mock("@/lib/auth/otp-store", () => ({
  allowLoginAttempt: mocks.allowLoginAttempt,
  consumeOtp: mocks.consumeOtp,
}));
vi.mock("@/lib/db", () => ({
  db: { $transaction: mocks.transaction },
}));

import { POST } from "./route";

function request(code = "123456") {
  return new Request("http://localhost/api/auth/phone/link", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-forwarded-for": "198.51.100.10",
    },
    body: JSON.stringify({ phone: "0701234567", code }),
  });
}

describe("Google phone linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "google-shell", role: "STUDENT" },
    });
    mocks.allowLoginAttempt.mockResolvedValue(true);
    mocks.consumeOtp.mockResolvedValue(true);
    mocks.transaction.mockImplementation(
      async (callback: (tx: typeof mocks.tx) => Promise<unknown>) =>
        callback(mocks.tx),
    );
  });

  it("merges a one-word-name Google shell into the phone account", async () => {
    const verifiedAt = new Date("2026-01-02T03:04:05.000Z");
    mocks.tx.user.findUnique
      .mockResolvedValueOnce({
        id: "google-shell",
        googleSub: "google-sub",
        email: "google@example.com",
        emailVerifiedAt: verifiedAt,
        firstName: "Prince",
        lastName: "",
        deletedAt: null,
      })
      .mockResolvedValueOnce({
        id: "phone-user",
        googleSub: null,
        email: null,
        phoneVerifiedAt: null,
        deletedAt: null,
      });
    mocks.tx.user.update
      .mockResolvedValueOnce({ id: "google-shell" })
      .mockResolvedValueOnce({ id: "phone-user" });

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(mocks.consumeOtp).toHaveBeenCalledWith(
      "+46701234567",
      "123456",
      expect.any(Date),
    );
    expect(mocks.tx.user.update).toHaveBeenNthCalledWith(1, {
      where: { id: "google-shell" },
      data: {
        email: null,
        googleSub: null,
        deletedAt: expect.any(Date),
      },
    });
    expect(mocks.tx.user.update).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        where: { id: "phone-user" },
        data: expect.objectContaining({
          googleSub: "google-sub",
          email: "google@example.com",
          emailVerifiedAt: verifiedAt,
        }),
      }),
    );
    expect(mocks.updateSession).toHaveBeenCalledWith({
      user: { id: "phone-user" },
    });
  });

  it("adds an unused phone directly to the Google account", async () => {
    mocks.tx.user.findUnique
      .mockResolvedValueOnce({
        id: "google-shell",
        googleSub: "google-sub",
        deletedAt: null,
      })
      .mockResolvedValueOnce(null);
    mocks.tx.user.update.mockResolvedValue({ id: "google-shell" });

    const response = await POST(request());

    expect(response.status).toBe(204);
    expect(mocks.tx.user.update).toHaveBeenCalledWith({
      where: { id: "google-shell" },
      data: {
        phone: "+46701234567",
        phoneVerifiedAt: expect.any(Date),
      },
      select: { id: true },
    });
    expect(mocks.updateSession).toHaveBeenCalledWith({
      user: { id: "google-shell" },
    });
  });

  it("does not start account work when the OTP is invalid", async () => {
    mocks.consumeOtp.mockResolvedValue(false);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
    expect(mocks.tx.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });

  it("burns the OTP after five wrong codes so the right sixth code fails", async () => {
    let attempts = 0;
    let burned = false;
    mocks.consumeOtp.mockImplementation(
      async (_phone: string, code: string, _now: Date, client?: unknown) => {
        expect(client).toBeUndefined();
        if (burned) return false;
        if (code !== "123456") {
          attempts += 1;
          burned = attempts >= 5;
          return false;
        }
        return true;
      },
    );

    for (let attempt = 0; attempt < 5; attempt += 1) {
      expect((await POST(request("000000"))).status).toBe(401);
    }

    expect((await POST(request("123456"))).status).toBe(401);
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns RATE_LIMITED before checking the code", async () => {
    mocks.allowLoginAttempt.mockResolvedValue(false);

    const response = await POST(request());

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toEqual({
      error: { code: "RATE_LIMITED", message: "RATE_LIMITED" },
    });
    expect(mocks.allowLoginAttempt).toHaveBeenCalledWith(
      "phone-link:+46701234567",
      "198.51.100.10",
      expect.any(Date),
    );
    expect(mocks.consumeOtp).not.toHaveBeenCalled();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
