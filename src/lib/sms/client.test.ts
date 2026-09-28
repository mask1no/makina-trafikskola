import { afterEach, describe, expect, it, vi } from "vitest";

import { sendSmsMessage } from "./client";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("46elks SMS client", () => {
  it("skips delivery without credentials outside production", async () => {
    vi.stubEnv("NODE_ENV", "test");
    vi.stubEnv("ELKS_API_USERNAME", "");
    vi.stubEnv("ELKS_API_PASSWORD", "");

    await expect(
      sendSmsMessage({ to: "+46700000000", message: "Test" }),
    ).resolves.toBe(false);
  });

  it("fails closed without credentials in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ELKS_API_USERNAME", "");
    vi.stubEnv("ELKS_API_PASSWORD", "");

    await expect(
      sendSmsMessage({ to: "+46700000000", message: "Test" }),
    ).rejects.toThrow("SMS_PROVIDER_NOT_CONFIGURED");
  });

  it("posts the message without logging contact data", async () => {
    vi.stubEnv("ELKS_API_USERNAME", "user");
    vi.stubEnv("ELKS_API_PASSWORD", "pass");
    const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    await expect(
      sendSmsMessage({ to: "+46700000000", message: "Makina test" }),
    ).resolves.toBe(true);

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.46elks.com/a1/sms",
      expect.objectContaining({
        method: "POST",
        body: expect.any(URLSearchParams),
      }),
    );
  });

  it("reports provider delivery failures", async () => {
    vi.stubEnv("ELKS_API_USERNAME", "user");
    vi.stubEnv("ELKS_API_PASSWORD", "pass");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response(null, { status: 500 })),
    );

    await expect(
      sendSmsMessage({ to: "+46700000000", message: "Test" }),
    ).rejects.toThrow("SMS_DELIVERY_FAILED");
  });
});
