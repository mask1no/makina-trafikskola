import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testIgnore: /mobile-locales\.spec\.ts/,
    },
    ...(["sv", "en", "ti", "ar", "so"] as const).map((locale) => ({
      name: `mobile-${locale}`,
      testMatch: /mobile-locales\.spec\.ts/,
      use: {
        ...devices["iPhone 13"],
        browserName: "chromium" as const,
        locale: locale === "ar" ? "ar" : locale === "sv" ? "sv-SE" : locale,
      },
    })),
  ],
  webServer: {
    command: "npm run start -- --hostname 127.0.0.1 --port 3100",
    url: "http://localhost:3100/sv",
    env: {
      ...process.env,
      AUTH_URL: "http://localhost:3100",
      AUTH_SECRET:
        process.env.AUTH_SECRET?.trim() ||
        "e2e-only-auth-secret-e2e-only-auth-secret",
      NEXT_PUBLIC_SITE_URL:
        process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3100",
      STRIPE_SECRET_KEY:
        process.env.STRIPE_SECRET_KEY?.trim() || "sk_test_e2e_placeholder",
      STRIPE_WEBHOOK_SECRET:
        process.env.STRIPE_WEBHOOK_SECRET?.trim() || "whsec_e2e_placeholder",
      ELKS_API_USERNAME: process.env.ELKS_API_USERNAME?.trim() || "e2e",
      ELKS_API_PASSWORD:
        process.env.ELKS_API_PASSWORD?.trim() || "e2e-password",
      BOOKING_ENABLED: process.env.TEST_BOOKING_ENABLED ?? "1",
      INSTRUCTORS_ENABLED: process.env.TEST_INSTRUCTORS_ENABLED ?? "1",
      CRON_SECRET: process.env.CRON_SECRET?.trim() || "e2e-cron-secret",
      AUTH_GOOGLE_ID: process.env.AUTH_GOOGLE_ID?.trim() || "e2e-google-client-id",
      AUTH_GOOGLE_SECRET:
        process.env.AUTH_GOOGLE_SECRET?.trim() || "e2e-google-client-secret",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
