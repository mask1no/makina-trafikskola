import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findUser: vi.fn(),
  sendOtpSms: vi.fn(),
  storeOtp: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: mocks.findUser } },
}));
vi.mock("@/lib/auth/sms", () => ({ sendOtpSms: mocks.sendOtpSms }));
vi.mock("@/lib/auth/otp-store", () => ({ storeOtp: mocks.storeOtp }));

import { POST } from "./route";

function request(body: unknown) {
  return new Request("http://localhost/api/auth/otp/request", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("OTP request", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.storeOtp.mockResolvedValue({ allowed: true });
    mocks.sendOtpSms.mockResolvedValue(true);
  });

  it("rejects non-Swedish phone numbers before storing an OTP", async () => {
    const response = await POST(
      request({ phone: "+12025550123", purpose: "login" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.storeOtp).not.toHaveBeenCalled();
    expect(mocks.sendOtpSms).not.toHaveBeenCalled();
  });

  it("does not send a login code when the phone has no account", async () => {
    mocks.findUser.mockResolvedValue(null);

    const response = await POST(
      request({ phone: "0701234567", purpose: "login" }),
    );

    expect(response.status).toBe(404);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "NO_ACCOUNT" },
    });
    expect(mocks.storeOtp).not.toHaveBeenCalled();
    expect(mocks.sendOtpSms).not.toHaveBeenCalled();
  });

  it("keeps signup OTP requests independent from account discovery", async () => {
    const response = await POST(
      request({ phone: "0701234567", purpose: "signup" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.findUser).not.toHaveBeenCalled();
    expect(mocks.storeOtp).toHaveBeenCalledWith(
      "+46701234567",
      expect.stringMatching(/^\d{6}$/),
      expect.any(Date),
    );
    expect(mocks.sendOtpSms).toHaveBeenCalledWith({
      phone: "+46701234567",
      code: expect.stringMatching(/^\d{6}$/),
    });
  });
});
