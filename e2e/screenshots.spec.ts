import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, type BrowserContext, type Page, test } from "@playwright/test";

const enabled = process.env.SCREENSHOTS === "1";
const locales = ["sv", "ar"] as const;
const viewports = [
  { width: 360, height: 800, label: "360x800" },
  { width: 390, height: 844, label: "390x844" },
  { width: 768, height: 1024, label: "768x1024" },
  { width: 1024, height: 768, label: "1024x768" },
  { width: 1280, height: 800, label: "1280x800" },
  { width: 1440, height: 900, label: "1440x900" },
] as const;
const publicPages = [
  { route: "/", slug: "home" },
  { route: "/korlektioner", slug: "korlektioner" },
  { route: "/priser", slug: "priser" },
  { route: "/kurser", slug: "kurser" },
  { route: "/teori", slug: "teori" },
  { route: "/teori/ovning", slug: "teori-practice" },
  { route: "/teori/ovning?screen=end", slug: "teori-end" },
  { route: "/teori/vagmarkesspel", slug: "teori-vagmarkesspel" },
  { route: "/teori/bok", slug: "teori-bok" },
  { route: "/teori/faktabank", slug: "teori-faktabank" },
  { route: "/kontakt", slug: "kontakt" },
  { route: "/larare", slug: "larare" },
  { route: "/trafikskola/farsta", slug: "town-farsta" },
  { route: "/logga-in", slug: "login" },
  { route: "/skapa-konto", slug: "create-account" },
] as const;
const roleSessions = new Map<
  string,
  Awaited<ReturnType<BrowserContext["cookies"]>>
>();

async function capture(page: Page, folder: string, slug: string) {
  await page.evaluate(() => document.fonts.ready);
  await expect(page.locator(".animate-pulse")).toHaveCount(0, {
    timeout: 15_000,
  });
  const overflow = await page.evaluate(() => {
    const viewport = document.documentElement.clientWidth;
    if (document.documentElement.scrollWidth <= viewport + 1) return [];
    return [...document.querySelectorAll<HTMLElement>("body *")]
      .map((element) => {
        const rect = element.getBoundingClientRect();
        return {
          tag: element.tagName.toLowerCase(),
          className: element.className.toString().slice(0, 120),
          text: (element.textContent ?? "").trim().replace(/\s+/g, " ").slice(0, 80),
          left: Math.round(rect.left),
          right: Math.round(rect.right),
        };
      })
      .filter((item) => item.left < -1 || item.right > viewport + 1)
      .slice(0, 10);
  });
  expect(overflow, `Horizontal overflow on ${page.url()}`).toEqual([]);
  await page.screenshot({
    path: path.join(folder, `${slug}.png`),
    fullPage: true,
  });
}

async function login(page: Page, locale: string, email: string, destination: string) {
  const existingSession = roleSessions.get(email);
  if (existingSession) {
    await page.context().clearCookies();
    await page.context().addCookies(existingSession);
    await page.goto(`/${locale}${destination}`, { waitUntil: "networkidle" });
    return;
  }
  await page.context().addCookies([
    {
      name: "makina-cookie-consent",
      value: "necessary",
      domain: "localhost",
      path: "/",
    },
  ]);
  await page.goto(`/${locale}/logga-in?next=${encodeURIComponent(`/${locale}${destination}`)}`);
  await page.locator("fieldset button").nth(1).click();
  await page.locator('input[name="identifier"]').fill(email);
  await page.locator("#password").fill("Passw0rd!");
  await page
    .locator('form:has(input[name="identifier"]) button[type="submit"]')
    .click();
  await page.waitForURL(`**/${locale}${destination}`);
  await page.waitForLoadState("networkidle");
  roleSessions.set(email, await page.context().cookies());
}

async function captureBookingSteps(page: Page, locale: string, folder: string) {
  await page.goto(`/${locale}/boka`, { waitUntil: "networkidle" });
  await capture(page, folder, "boka-step-1-area");

  const areas = page.locator("main .choice-card:not([disabled])");
  const area = (await areas.count()) > 1 ? areas.nth(1) : areas.first();
  await area.click();
  await expect(area).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-2-pickup");

  const pickup = page.locator("main .choice-card").first();
  await pickup.click();
  await expect(pickup).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-3-gearbox");

  const gearbox = page.locator("main .choice-card").first();
  await gearbox.click();
  await expect(gearbox).toHaveAttribute("aria-pressed", "true");
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-4-schedule");

  const slot = page.locator("main section button").filter({ has: page.locator("bdi") }).first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
  await expect(slot).toHaveClass(/bg-accent/);
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-5-payment");

  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-6-account");
}

test.describe("screenshots", () => {
  test.setTimeout(180_000);

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
        const folder = path.join("screenshots", locale, viewport.label);
        await mkdir(folder, { recursive: true });

        for (const item of publicPages) {
          await page.goto(`/${locale}${item.route}`, { waitUntil: "networkidle" });
          await capture(page, folder, item.slug);
        }

        await page.goto(`/${locale}/teori`, { waitUntil: "networkidle" });
        const questionLink = page
          .locator(`#steg-for-steg a[href^="/${locale}/teori/"]`)
          .first();
        await expect(questionLink).toBeVisible();
        await questionLink.click();
        await expect(page).toHaveURL(new RegExp(`/${locale}/teori/del-\\d+$`));
        await expect(page.locator("main .choice-card").first()).toBeVisible();
        await capture(page, folder, "teori-question");

        await captureBookingSteps(page, locale, folder);

        await login(page, locale, "elev@makina.local", "/mina-sidor");
        await capture(page, folder, "mina-sidor");
        await page.goto(`/${locale}/mina-sidor/bokningar`, { waitUntil: "networkidle" });
        await capture(page, folder, "mina-sidor-bokningar");
        await page.context().clearCookies();

        await login(page, locale, "aron-kessete@makina.local", "/larare-portal");
        await capture(page, folder, "larare-portal");
        await page.context().clearCookies();

        await login(page, locale, "admin@makina.local", "/admin");
        await capture(page, folder, "admin-overview");
        await page.goto(`/${locale}/admin/kurser`, { waitUntil: "networkidle" });
        await capture(page, folder, "admin-kurser");
        await page.goto(`/${locale}/admin/larare`, { waitUntil: "networkidle" });
        await capture(page, folder, "admin-larare");
        await page.goto(`/${locale}/admin/produkter`, { waitUntil: "networkidle" });
        await capture(page, folder, "admin-produkter");
        await page.goto(`/${locale}/admin/omraden`, { waitUntil: "networkidle" });
        await capture(page, folder, "admin-omraden");
      });
    }
  }
});
