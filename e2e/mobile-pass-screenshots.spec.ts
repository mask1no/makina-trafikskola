import { mkdir } from "node:fs/promises";
import path from "node:path";

import { expect, type BrowserContext, type Page, test } from "@playwright/test";

const enabled = process.env.SCREENSHOTS === "1";
const locales = ["sv", "ar"] as const;
const viewports = [
  { width: 360, height: 800, label: "360x800" },
  { width: 390, height: 844, label: "390x844" },
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
  const modal = /map|sheet|keyboard/i.test(slug);
  await page.screenshot({
    path: path.join(folder, `${slug}.png`),
    fullPage: !modal,
  });
}

async function simulateKeyboard(page: Page, open: boolean) {
  await page.evaluate((isOpen) => {
    const root = document.documentElement;
    if (!isOpen) {
      root.style.setProperty("--keyboard-inset", "0px");
      root.style.setProperty(
        "--sticky-bottom",
        "calc(var(--tab-bar-height) + var(--safe-bottom))",
      );
      root.style.setProperty("--vv-height", "100dvh");
      return;
    }
    root.style.setProperty("--keyboard-inset", "280px");
    root.style.setProperty("--sticky-bottom", "280px");
    root.style.setProperty("--vv-height", "520px");
  }, open);
}

async function ensureConsent(page: Page) {
  await page.context().addCookies([
    {
      name: "makina-cookie-consent",
      value: "necessary",
      domain: "localhost",
      path: "/",
    },
  ]);
}

async function login(page: Page, locale: string, email: string, destination: string) {
  const existingSession = roleSessions.get(email);
  if (existingSession) {
    await page.context().clearCookies();
    await page.context().addCookies(existingSession);
    await ensureConsent(page);
    await page.goto(`/${locale}${destination}`, { waitUntil: "networkidle" });
    if (page.url().includes(destination)) return;
  }
  await page.context().clearCookies();
  await ensureConsent(page);
  await page.goto(`/${locale}/logga-in?next=${encodeURIComponent(`/${locale}${destination}`)}`);
  await page.locator("fieldset button").nth(1).click();
  await page.locator('input[name="identifier"]').fill(email);
  await page.locator("#password").fill("Passw0rd!");
  await Promise.all([
    page.waitForURL(`**/${locale}${destination}`, { timeout: 45_000 }),
    page
      .locator('form:has(input[name="identifier"]) button[type="submit"]')
      .click(),
  ]);
  await page.waitForLoadState("networkidle");
  roleSessions.set(email, await page.context().cookies());
}

async function captureBookingSteps(page: Page, locale: string, folder: string) {
  await page.goto(`/${locale}/boka`, { waitUntil: "networkidle" });
  await capture(page, folder, "boka-step-1-area");

  const areas = page.locator("main .choice-card:not([disabled])");
  const area = (await areas.count()) > 1 ? areas.nth(1) : areas.first();
  await area.click();
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-2-pickup");

  await capture(page, folder, "boka-step-2-pickup-address");
  const openMap = page.getByRole("button", {
    name: /Välj på kartan|Choose on the map|اختر على الخريطة|ካርታ/i,
  });
  if (await openMap.isVisible().catch(() => false)) {
    await openMap.click();
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 20_000 });
    await capture(page, folder, "boka-pickup-map");
    await simulateKeyboard(page, true);
    const search = dialog.locator("input, [contenteditable='true']").first();
    if (await search.count()) {
      await search.focus().catch(() => undefined);
    }
    await capture(page, folder, "boka-pickup-map-keyboard");
    await simulateKeyboard(page, false);
    await page.keyboard.press("Escape").catch(() => undefined);
    const close = dialog.getByRole("button", { name: /Stäng|Close|إغلاق|ዕጸው/i }).first();
    if (await close.isVisible().catch(() => false)) await close.click();
  }
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-3-gearbox");

  await page.locator("main .choice-card").first().click();
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-4-schedule");

  const slot = page.locator("main section button").filter({ has: page.locator("bdi") }).first();
  await expect(slot).toBeVisible({ timeout: 15_000 });
  await slot.click();
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-5-payment");
  await page.getByTestId("booking-next").click();
  await capture(page, folder, "boka-step-6-account");
  await simulateKeyboard(page, true);
  const accountInput = page.locator("main input").first();
  if (await accountInput.count()) await accountInput.focus();
  await capture(page, folder, "boka-step-6-account-keyboard");
  await simulateKeyboard(page, false);
}

test.describe("mobile pass screenshots", () => {
  test.setTimeout(360_000);

  test.beforeEach(async ({ context, page }) => {
    test.skip(!enabled, "Set SCREENSHOTS=1 to capture mobile-pass screenshots.");
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
        const folder = path.join("screenshots", "mobile-pass", locale, viewport.label);
        await mkdir(folder, { recursive: true });

        for (const route of [
          { path: "/logga-in", slug: "login" },
          { path: "/skapa-konto", slug: "signup" },
          { path: "/glomt-losenord", slug: "forgot-password" },
        ]) {
          await page.goto(`/${locale}${route.path}`, { waitUntil: "networkidle" });
          await capture(page, folder, route.slug);
          await simulateKeyboard(page, true);
          const field = page.locator("main input").first();
          if (await field.count()) await field.focus();
          await capture(page, folder, `${route.slug}-keyboard`);
          await simulateKeyboard(page, false);
        }

        await captureBookingSteps(page, locale, folder);

        await login(page, locale, "elev@makina.local", "/mina-sidor");
        for (const route of [
          { path: "/mina-sidor", slug: "mina-sidor" },
          { path: "/mina-sidor/bokningar", slug: "mina-sidor-bokningar" },
          { path: "/mina-sidor/lektioner", slug: "mina-sidor-saldo" },
          { path: "/mina-sidor/teori", slug: "mina-sidor-teori" },
          { path: "/mina-sidor/meddelanden", slug: "mina-sidor-meddelanden" },
          { path: "/mina-sidor/profil", slug: "mina-sidor-profil" },
        ]) {
          await page.goto(`/${locale}${route.path}`, { waitUntil: "networkidle" });
          await capture(page, folder, route.slug);
        }
        await page.goto(`/${locale}/mina-sidor/profil`, { waitUntil: "networkidle" });
        const edit = page.getByRole("button", { name: /Ändra|Edit|تعديل|ኣርም/i }).first();
        if (await edit.isVisible().catch(() => false)) {
          await edit.click();
          await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
          await capture(page, folder, "mina-sidor-profil-sheet");
          await simulateKeyboard(page, true);
          const sheetInput = page.getByRole("dialog").locator("input").first();
          if (await sheetInput.count()) await sheetInput.focus();
          await capture(page, folder, "mina-sidor-profil-sheet-keyboard");
          await simulateKeyboard(page, false);
          await page.keyboard.press("Escape");
        }
        await page.context().clearCookies();

        await login(page, locale, "aron-kessete@makina.local", "/larare-portal");
        await capture(page, folder, "larare-today");
        await page.goto(`/${locale}/larare-portal?view=week`, { waitUntil: "networkidle" });
        await capture(page, folder, "larare-week");
        const report = page.locator("form[id^='lesson-report-']").first();
        if ((await report.count()) > 0) {
          await report.scrollIntoViewIfNeeded();
          await capture(page, folder, "larare-report");
          await simulateKeyboard(page, true);
          await report.locator("textarea, input").first().focus();
          await capture(page, folder, "larare-report-keyboard");
          await simulateKeyboard(page, false);
        }
        const hoursHeading = page.getByRole("heading", {
          name: /Mina vanliga tider|My usual hours|ساعاتي|ሰዓታተይ/i,
        });
        if (await hoursHeading.isVisible().catch(() => false)) {
          await hoursHeading.scrollIntoViewIfNeeded();
        }
        await capture(page, folder, "larare-hours");
        await page.context().clearCookies();

        await login(page, locale, "admin@makina.local", "/admin/calendar");
        await capture(page, folder, "admin-calendar");
        const manage = page.getByRole("button", { name: /Hantera|Manage|إدارة|ኣመሓድር/i }).first();
        if (await manage.isVisible().catch(() => false)) {
          await manage.click();
          await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
          await capture(page, folder, "admin-booking-sheet");
          await simulateKeyboard(page, true);
          await page.getByRole("dialog").locator("textarea, input").first().focus();
          await capture(page, folder, "admin-booking-sheet-keyboard");
          await simulateKeyboard(page, false);
          await page.keyboard.press("Escape");
        }
        await page.goto(`/${locale}/admin/students`, { waitUntil: "networkidle" });
        await capture(page, folder, "admin-students");
        const student = page.locator("aside a").first();
        if (await student.count()) {
          await student.click();
          await page.waitForLoadState("networkidle");
          await capture(page, folder, "admin-student-detail");
          const editStudent = page.getByRole("button", { name: /Ändra|Edit|تعديل|ኣርም/i }).first();
          if (await editStudent.isVisible().catch(() => false)) {
            await editStudent.click();
            await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });
            await capture(page, folder, "admin-student-sheet");
            await simulateKeyboard(page, true);
            await page.getByRole("dialog").locator("input").first().focus();
            await capture(page, folder, "admin-student-sheet-keyboard");
            await simulateKeyboard(page, false);
          }
        }
      });
    }
  }
});
