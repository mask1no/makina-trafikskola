import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auth: vi.fn(),
  findUser: vi.fn(),
  sendOtpSms: vi.fn(),
  storeOtp: vi.fn(),
  checkOtpRequestLimits: vi.fn(),
  verifyTurnstileToken: vi.fn(),
  clientIp: vi.fn(),
  captureMessage: vi.fn(),
}));

vi.mock("@/auth", () => ({ auth: mocks.auth }));
vi.mock("@/lib/db", () => ({
  db: { user: { findUnique: mocks.findUser } },
}));
vi.mock("@/lib/auth/sms", () => ({ sendOtpSms: mocks.sendOtpSms }));
vi.mock("@/lib/auth/otp-store", () => ({
  storeOtp: mocks.storeOtp,
  checkOtpRequestLimits: mocks.checkOtpRequestLimits,
}));
vi.mock("@/lib/auth/turnstile", () => ({
  verifyTurnstileToken: mocks.verifyTurnstileToken,
}));
vi.mock("@/lib/http/client-ip", () => ({ clientIp: mocks.clientIp }));
vi.mock("@sentry/nextjs", () => ({ captureMessage: mocks.captureMessage }));

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
    mocks.auth.mockResolvedValue({
      user: { id: "student-1", role: "STUDENT" },
    });
    mocks.storeOtp.mockResolvedValue({ allowed: true });
    mocks.checkOtpRequestLimits.mockResolvedValue({ allowed: true });
    mocks.sendOtpSms.mockResolvedValue(true);
    mocks.verifyTurnstileToken.mockResolvedValue({ ok: true, skipped: true });
    mocks.clientIp.mockReturnValue("203.0.113.10");
  });

  it("requires a signed-in account before sending a phone-link code", async () => {
    mocks.auth.mockResolvedValue(null);

    const response = await POST(
      request({ phone: "0701234567", purpose: "phone-link" }),
    );

    expect(response.status).toBe(401);
    expect(mocks.storeOtp).not.toHaveBeenCalled();
    expect(mocks.sendOtpSms).not.toHaveBeenCalled();
  });

  it("rejects non-Swedish phone numbers before storing an OTP", async () => {
    const response = await POST(
      request({ phone: "+12025550123", purpose: "login" }),
    );

    expect(response.status).toBe(400);
    expect(mocks.storeOtp).not.toHaveBeenCalled();
    expect(mocks.sendOtpSms).not.toHaveBeenCalled();
  });

  it("returns a neutral 200 for login when the phone has no account", async () => {
    mocks.findUser.mockResolvedValue(null);

    const response = await POST(
      request({ phone: "0701234567", purpose: "login" }),
    );

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      phone: "+46701234567",
      sent: false,
    });
    expect(mocks.checkOtpRequestLimits).toHaveBeenCalled();
    expect(mocks.storeOtp).not.toHaveBeenCalled();
    expect(mocks.sendOtpSms).not.toHaveBeenCalled();
  });

  it("keeps signup OTP requests independent from account discovery", async () => {
    mocks.findUser.mockResolvedValue(null);

    const response = await POST(
      request({ phone: "0701234567", purpose: "signup" }),
    );

    expect(response.status).toBe(200);
    expect(mocks.storeOtp).toHaveBeenCalledWith(
      "+46701234567",
      expect.stringMatching(/^\d{6}$/),
      expect.any(Date),
      { ip: "203.0.113.10" },
    );
    expect(mocks.sendOtpSms).toHaveBeenCalledWith({
      phone: "+46701234567",
      code: expect.stringMatching(/^\d{6}$/),
      locale: "sv",
    });
  });

  it("rate-limits when the global OTP daily cap is hit and alerts Sentry", async () => {
    mocks.findUser.mockResolvedValue({ id: "u1", localePref: "sv" });
    mocks.storeOtp.mockResolvedValue({
      allowed: false,
      retryAfterSeconds: 3600,
      reason: "global",
    });

    const response = await POST(
      request({ phone: "0701234567", purpose: "login" }),
    );

    expect(response.status).toBe(429);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "RATE_LIMITED" },
    });
    expect(mocks.captureMessage).toHaveBeenCalledWith(
      "OTP daily cap reached",
      expect.objectContaining({ level: "warning" }),
    );
    expect(mocks.sendOtpSms).not.toHaveBeenCalled();
  });

  it("rejects public OTP requests when Turnstile fails", async () => {
    mocks.verifyTurnstileToken.mockResolvedValue({ ok: false, skipped: false });

    const response = await POST(
      request({ phone: "0701234567", purpose: "signup", turnstileToken: "bad" }),
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: { code: "TURNSTILE_FAILED" },
    });
    expect(mocks.storeOtp).not.toHaveBeenCalled();
  });
});
