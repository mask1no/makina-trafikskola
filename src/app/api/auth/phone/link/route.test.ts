import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const tx = {
    user: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
  };
  return {
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
vi.mock("@/lib/auth/otp-store", () => ({ consumeOtp: mocks.consumeOtp }));
vi.mock("@/lib/db", () => ({
  db: { $transaction: mocks.transaction },
}));

import { POST } from "./route";

function request() {
  return new Request("http://localhost/api/auth/phone/link", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ phone: "0701234567", code: "123456" }),
  });
}

describe("Google phone linking", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({
      user: { id: "google-shell", role: "STUDENT" },
    });
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
      mocks.tx,
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

  it("rolls back account work when the OTP is invalid", async () => {
    mocks.consumeOtp.mockResolvedValue(false);

    const response = await POST(request());

    expect(response.status).toBe(401);
    expect(mocks.tx.user.findUnique).not.toHaveBeenCalled();
    expect(mocks.tx.user.update).not.toHaveBeenCalled();
    expect(mocks.updateSession).not.toHaveBeenCalled();
  });
});
