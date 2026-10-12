import { expect, test } from "@playwright/test";
import { mkdirSync } from "node:fs";

const cases = [
  { locale: "sv", width: 390, height: 844, file: "pickup-modal-sv-390.png" },
  { locale: "sv", width: 1280, height: 800, file: "pickup-modal-sv-1280.png" },
  { locale: "ar", width: 390, height: 844, file: "pickup-modal-ar-390.png" },
  { locale: "ar", width: 1280, height: 800, file: "pickup-modal-ar-1280.png" },
] as const;

async function dismissCookies(page: import("@playwright/test").Page) {
  const banner = page.getByRole("region", {
    name: /Cookie|كوكيز|بسكويت|Cookieinställningar|إعدادات/i,
  });
  if (await banner.isVisible().catch(() => false)) {
    await banner
      .getByRole("button")
      .filter({ hasText: /nödvändiga|Necessary|الضرورية/i })
      .click();
    await expect(banner).toBeHidden({ timeout: 10_000 });
  }
}

test.describe("pickup modal screenshots", () => {
  test.skip(!process.env.SCREENSHOTS, "Set SCREENSHOTS=1 to capture");

  for (const item of cases) {
    test(`${item.locale} @ ${item.width}`, async ({ page }) => {
      mkdirSync("screenshots", { recursive: true });
      await page.setViewportSize({ width: item.width, height: item.height });
      await page.goto(`/${item.locale}/boka`);
      await dismissCookies(page);

      await page
        .getByRole("button")
        .filter({ hasText: /Farsta|فرستا/i })
        .first()
        .click();
      await page
        .getByRole("button", { name: /Fortsätt|Continue|متابعة/i })
        .click();

      await page
        .getByRole("button", {
          name: /Hämta mig|Pick me up|تعال لاصطحابي/i,
        })
        .click();

      const openMap = page.getByRole("button", {
        name: /Välj på kartan|Choose on the map|اختر على الخريطة/i,
      });
      await expect(openMap).toBeVisible({ timeout: 15_000 });
      await openMap.click();
      const dialog = page.getByRole("dialog");
      await expect(dialog).toBeVisible({ timeout: 20_000 });
      await expect(
        dialog.getByRole("heading", {
          name: /Välj en plats|Choose a place|اختر مكان/i,
        }),
      ).toBeVisible({ timeout: 10_000 });
      await page.waitForTimeout(800);
      await page.screenshot({
        path: `screenshots/${item.file}`,
        fullPage: false,
      });
    });
  }
});
