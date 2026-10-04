import { expect, test } from "@playwright/test";

const locales = ["sv", "en", "ti", "ar", "so"] as const;
const touchedRoutes = ["", "/korlektioner", "/paket/en-korlektion", "/kontakt", "/villkor", "/teori", "/logga-in"] as const;

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

test("desktop nav stays centered within 8px in sv and ar", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 800 });
  for (const locale of ["sv", "ar"] as const) {
    await page.goto(`/${locale}`);
    const delta = await page.evaluate(() => {
      const header = document.querySelector("header");
      const nav = header?.querySelector("nav[aria-label]");
      if (!header || !nav) return null;
      const h = header.getBoundingClientRect();
      const n = nav.getBoundingClientRect();
      return Math.abs((n.left + n.width / 2) - (h.left + h.width / 2));
    });
    expect(delta).not.toBeNull();
    expect(delta ?? 999).toBeLessThanOrEqual(8);
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
