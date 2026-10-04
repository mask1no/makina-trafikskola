import { mkdir } from "node:fs/promises";
import path from "node:path";

import { test } from "@playwright/test";

const enabled = process.env.SCREENSHOTS === "1";
const locales = ["sv", "ar"] as const;
const viewports = [
  { width: 390, height: 844, label: "390x844" },
  { width: 1280, height: 800, label: "1280x800" },
] as const;
const routes = [
  "/",
  "/korlektioner",
  "/paket/en-korlektion",
  "/kontakt",
  "/villkor",
  "/teori",
  "/logga-in",
] as const;

test.describe("screenshots", () => {
  test.beforeEach(async ({ context, page }) => {
    test.skip(!enabled, "Set SCREENSHOTS=1 to capture launch screenshots.");
    await context.addCookies([
      {
        name: "makina-cookie-consent",
        value: "necessary",
        domain: "localhost",
        path: "/",
      },
    ]);
    await page.emulateMedia({ reducedMotion: "reduce" });
  });

  for (const locale of locales) {
    for (const viewport of viewports) {
      test(`${locale} ${viewport.label}`, async ({ page }) => {
        await page.setViewportSize({
          width: viewport.width,
          height: viewport.height,
        });

        for (const route of routes) {
          await page.goto(`/${locale}${route}`, { waitUntil: "networkidle" });
          const folder = path.join("screenshots", locale, viewport.label);
          await mkdir(folder, { recursive: true });
          const slug = route === "/" ? "home" : route.replaceAll("/", "-").slice(1);
          await page.screenshot({
            path: path.join(folder, `${slug}.png`),
            fullPage: true,
          });
        }

        await page.goto(`/${locale}/boka`, { waitUntil: "networkidle" });
        const bookingCta = page.getByRole("button", { name: /Boka|Book|احجز|መዝግብ|Qabso/i });
        if ((await bookingCta.count()) > 0) {
          await bookingCta.first().click();
          await page.waitForLoadState("networkidle");
        }
        const folder = path.join("screenshots", locale, viewport.label);
        await mkdir(folder, { recursive: true });
        await page.screenshot({
          path: path.join(folder, "boka-step-1.png"),
          fullPage: true,
        });
      });
    }
  }
});
