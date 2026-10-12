import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  allowRateLimitedAction: vi.fn(),
  consumeOtp: vi.fn(),
  findFirst: vi.fn(),
  update: vi.fn(),
  auditCreate: vi.fn(),
  bumpSessionVersion: vi.fn(),
  compare: vi.fn(),
  hash: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/auth/otp-store", () => ({
  allowRateLimitedAction: mocks.allowRateLimitedAction,
  consumeOtp: mocks.consumeOtp,
}));
vi.mock("@/lib/auth/session-version", () => ({
  bumpSessionVersion: mocks.bumpSessionVersion,
}));
vi.mock("@/lib/db", () => ({
  db: {
    user: { findFirst: mocks.findFirst, update: mocks.update },
    auditLog: { create: mocks.auditCreate },
  },
}));
vi.mock("bcryptjs", () => ({
  default: { compare: mocks.compare, hash: mocks.hash },
}));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/me/password", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("student password changes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.auth.mockResolvedValue({ user: { id: "student-1", role: "STUDENT" } });
    mocks.allowRateLimitedAction.mockResolvedValue(true);
    mocks.hash.mockResolvedValue("new-hash");
    mocks.bumpSessionVersion.mockResolvedValue(1);
  });

  it("sets a first password for SMS-only users with an SMS code", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "student-1",
      phone: "+46701111111",
      passwordHash: null,
    });
    mocks.consumeOtp.mockResolvedValue(true);

    const response = await POST(
      request({ password: "password12", code: "123456" }),
    );

    expect(response.status).toBe(204);
    expect(mocks.update).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: { passwordHash: "new-hash" },
    });
    expect(mocks.bumpSessionVersion).toHaveBeenCalled();
  });

  it("changes an existing password with the current password", async () => {
    mocks.findFirst.mockResolvedValue({
      id: "student-1",
      phone: "+46701111111",
      passwordHash: "old-hash",
    });
    mocks.compare.mockResolvedValue(true);

    const response = await POST(
      request({
        password: "password99",
        currentPassword: "password12",
      }),
    );

    expect(response.status).toBe(204);
    expect(mocks.compare).toHaveBeenCalledWith("password12", "old-hash");
    expect(mocks.auditCreate).toHaveBeenCalledWith({
      data: expect.objectContaining({ action: "user.password_changed" }),
    });
  });
});
