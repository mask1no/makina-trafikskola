import { afterEach, describe, expect, it, vi } from "vitest";

import { verifyTurnstileToken } from "./turnstile";

describe("turnstile", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    delete process.env.TURNSTILE_SITE_KEY;
    delete process.env.TURNSTILE_SECRET_KEY;
  });

  it("skips verification when keys are unset", async () => {
    await expect(verifyTurnstileToken(undefined, "1.1.1.1")).resolves.toEqual({
      ok: true,
      skipped: true,
    });
  });

  it("fails when keys are set but the token is missing", async () => {
    process.env.TURNSTILE_SITE_KEY = "site";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    await expect(verifyTurnstileToken("", "1.1.1.1")).resolves.toEqual({
      ok: false,
      skipped: false,
    });
  });

  it("accepts a successful siteverify response", async () => {
    process.env.TURNSTILE_SITE_KEY = "site";
    process.env.TURNSTILE_SECRET_KEY = "secret";
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      }),
    );

    await expect(
      verifyTurnstileToken("token-1", "203.0.113.9"),
    ).resolves.toEqual({ ok: true, skipped: false });
  });
});
