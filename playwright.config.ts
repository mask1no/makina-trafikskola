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
      BOOKING_ENABLED: "1",
      INSTRUCTORS_ENABLED: "1",
      CRON_SECRET: process.env.CRON_SECRET ?? "e2e-cron-secret",
    },
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
