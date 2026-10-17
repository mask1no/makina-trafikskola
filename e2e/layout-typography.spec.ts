import { expect, test } from "@playwright/test";

const locales = ["sv", "en", "ti", "ar"] as const;
const touchedRoutes = ["", "/priser", "/paket/en-korlektion", "/kontakt", "/villkor", "/teori", "/logga-in"] as const;

test.beforeEach(async ({ context }) => {
  await context.addCookies([
    {
      name: "makina-cookie-consent",
      value: "necessary",
      domain: "localhost",
      path: "/",
    },
  ]);
});

test("desktop header is a rounded panel with the nav inside", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const locale of ["sv", "ar"] as const) {
    await page.goto(`/${locale}`);
    const inside = await page.evaluate(() => {
      const header = document.querySelector("header");
      const panel = header?.querySelector(".rounded-xl");
      const nav = panel?.querySelector("nav[aria-label]");
      if (!header || !panel || !nav) return false;
      const panelBox = panel.getBoundingClientRect();
      const navBox = nav.getBoundingClientRect();
      return navBox.left >= panelBox.left && navBox.right <= panelBox.right + 1;
    });
    expect(inside).toBe(true);
  }
});

test("h1 max size and minimum readable body size", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const locale of ["sv", "ar"] as const) {
    for (const route of touchedRoutes) {
      await page.goto(`/${locale}${route}`);
      const [largestH1, bodyFontSize, minTextSize] = await page.evaluate(() => {
        const h1Sizes = Array.from(document.querySelectorAll("h1"))
          .map((el) => Number.parseFloat(getComputedStyle(el).fontSize))
          .filter(Number.isFinite);
        const bodySize = Number.parseFloat(getComputedStyle(document.body).fontSize);
        const textSizes = Array.from(document.querySelectorAll("*"))
          .filter((el) => {
            const style = getComputedStyle(el);
            return style.display !== "none" && style.visibility !== "hidden";
          })
          .map((el) => Number.parseFloat(getComputedStyle(el).fontSize))
          .filter((size) => Number.isFinite(size) && size > 0);
        return [Math.max(0, ...h1Sizes), bodySize, Math.min(...textSizes)];
      });
      expect(bodyFontSize, `${locale}${route}`).toBeGreaterThanOrEqual(16);
      expect(minTextSize, `${locale}${route}`).toBeGreaterThanOrEqual(12);
      if (largestH1 > 0) {
        expect(largestH1, `${locale}${route}`).toBeLessThanOrEqual(60);
      }
    }
  }
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 1280, height: 800 },
]) {
  test(`no horizontal overflow at ${viewport.width}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    for (const locale of locales) {
      for (const route of touchedRoutes) {
        await page.goto(`/${locale}${route}`);
        const fits = await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth + 1,
        );
        expect(fits, `${locale}${route}`).toBeTruthy();
      }
    }
  });
}
