import { describe, expect, it, vi } from "vitest";

import { validateEnvironment } from "./env";

const required = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://localhost/makina",
  AUTH_SECRET: "test-secret",
  AUTH_URL: "https://example.com",
  STRIPE_SECRET_KEY: "sk_test_value",
  STRIPE_WEBHOOK_SECRET: "whsec_value",
  NEXT_PUBLIC_SITE_URL: "https://example.com",
  ELKS_API_USERNAME: "elks-user",
  ELKS_API_PASSWORD: "elks-pass",
  CRON_SECRET: "cron-secret",
};

describe("production environment validation", () => {
  it("names a missing required variable", () => {
    expect(() =>
      validateEnvironment(
        { ...required, AUTH_SECRET: undefined },
        vi.fn(),
      ),
    ).toThrowError(/AUTH_SECRET/);
  });

  it("warns with the optional variable and degraded feature", () => {
    const warn = vi.fn();
    validateEnvironment(required, warn);
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("Google Maps and pickup autocomplete"),
    );
    expect(warn).toHaveBeenCalledWith(
      expect.stringContaining("GOOGLE_MAPS_BROWSER_KEY"),
    );
  });

  it("does not enforce production variables during development", () => {
    expect(() =>
      validateEnvironment({ NODE_ENV: "development" }, vi.fn()),
    ).not.toThrow();
  });
});
