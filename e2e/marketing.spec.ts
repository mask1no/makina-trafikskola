import { expect, test } from "@playwright/test";

const locales = ["sv", "en", "ti", "ar"] as const;

async function allowCookies(page: import("@playwright/test").Page) {
  await page.context().addCookies([
    {
      name: "makina-cookie-consent",
      value: "necessary",
      domain: "localhost",
      path: "/",
    },
  ]);
}

test.describe("marketing layout", () => {
  test.beforeEach(async ({ page }) => {
    await allowCookies(page);
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 1280, height: 800 },
  ]) {
    for (const locale of locales) {
      test(`${locale} has no horizontal overflow at ${viewport.width}`, async ({ page }) => {
        await page.setViewportSize(viewport);
        for (const path of ["", "/priser", "/paket/en-korlektion", "/kontakt"]) {
          const response = await page.goto(`/${locale}${path}`);
          expect(response?.ok(), `${locale}${path}`).toBeTruthy();
          const fits = await page.evaluate(
            () => document.documentElement.scrollWidth <= window.innerWidth + 1,
          );
          expect(fits, `${locale}${path}`).toBeTruthy();
        }
      });
    }
  }

  test("call actions use generic labels without exposed details", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/sv");
    const hero = page.locator("main section").first();
    await expect(hero.getByRole("link", { name: "Ring oss" })).toHaveCount(0);
    await expect(hero.getByRole("link", { name: "Boka nu" })).toBeVisible();
    await expect(hero.getByRole("link", { name: "Se priser" })).toBeVisible();
    await expect(page.locator("nav.fixed.bottom-0 a")).toHaveCount(5);
    const bottomCall = page.locator("nav.fixed.bottom-0 a[href^='tel:']");
    const bottomBooking = page.locator("nav.fixed.bottom-0 a[href$='/boka']");
    expect((await bottomCall.count()) + (await bottomBooking.count())).toBe(1);
    await expect(page.locator("main")).not.toContainText("070-097 04 83");
    await expect(page.locator("main")).not.toContainText("info@makina.se");
    await expect(page.locator("main")).not.toContainText("Filtrera på språk, plats och växellåda.");
  });

  test("header shows Kontakt once", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sv");
    await expect(page.locator("header").getByRole("link", { name: "Kontakt" })).toHaveCount(1);
  });

  test("contact map loads after the privacy confirmation", async ({ page }) => {
    await page.goto("/sv/kontakt");
    const load = page.getByRole("button", { name: "Visa karta" });
    await expect(load).toBeVisible();
    await load.click();
    const map = page.getByTitle("Hitta oss");
    await expect(map).toBeVisible();
    await expect(map).toHaveAttribute("src", /google\.com\/maps/);
  });

  test("marquee copy is hidden and has no pause control", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sv");
    const copy = page.locator(".benefit-copy");
    await expect(copy.first()).toHaveAttribute("aria-hidden", "true");
    await expect(page.getByRole("button", { name: "Pausa" })).toHaveCount(0);
    const animation = await page.locator(".benefit-track").first().evaluate((node) =>
      getComputedStyle(node).animationName,
    );
    expect(animation).toContain("benefit-marquee");
  });

  test("reduced motion does not animate the marquee", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sv");
    const duration = await page.locator(".benefit-track").first().evaluate((node) =>
      getComputedStyle(node).animationName,
    );
    expect(duration === "none" || duration === "").toBeTruthy();
    await expect.poll(() =>
      page.locator(".hero-pan").evaluate((node) => getComputedStyle(node).animationName),
    ).toBe("none");
  });

  test("mobile benefits keep running", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/sv");
    const animation = await page.locator(".benefit-track").first().evaluate((node) =>
      getComputedStyle(node).animationName,
    );
    expect(animation).toContain("benefit-marquee");
    await expect(page.locator(".benefit-copy").first()).toHaveAttribute("aria-hidden", "true");
  });

  test("shows the four confirmed teaching languages", async ({ page }) => {
    await page.goto("/sv/kontakt");
    const staffCards = page
      .locator("section")
      .filter({ has: page.getByRole("heading", { name: "Vår personal" }) })
      .locator(":scope > ul > li");
    await expect(staffCards).toHaveCount(6);
    const contact = await page.locator("body").innerText();
    expect(contact).toContain("Undervisning på svenska, engelska, tigrinja och kurdiska.");
    expect(contact).not.toMatch(/arabiska/i);

    await page.goto("/sv");
    const home = await page.locator("body").innerText();
    expect(home).toContain("Undervisning på svenska, engelska, tigrinja och kurdiska.");

    const prefixes = {
      sv: "Undervisning på ",
      en: "Lessons in ",
      ti: "ትምህርቲ ብ",
      ar: "التدريس بـ",
    } as const;
    for (const locale of locales) {
      await page.goto(`/${locale}/kontakt`);
      const lines = (await page.locator("body").innerText()).split("\n");
      const claims = lines.filter((line) => line.startsWith(prefixes[locale]));
      expect(claims.length).toBeGreaterThan(0);
      for (const claim of claims) {
        const offeredSentence = claim.split(/[.።]/, 1)[0];
        expect(offeredSentence).not.toContain("العربية");
      }
    }
  });

  test("shows the short terms in every locale", async ({ page }) => {
    const summaries = {
      sv: "Kortfattade villkor",
      en: "Short terms",
      ti: "ሓጺር ውዕላት",
      ar: "شروط مختصرة",
    } as const;
    for (const [locale, title] of Object.entries(summaries)) {
      await page.goto(`/${locale}/villkor`);
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
  });

  test("shows the Farsta town page", async ({ page }) => {
    const response = await page.goto("/sv/trafikskola/farsta");
    expect(response?.status()).toBeLessThan(400);
    await expect(page.getByRole("heading", { name: "Trafikskola i Farsta" })).toBeVisible();
  });

  test("does not promise free theory when none is published", async ({ page }) => {
    await page.goto("/sv");
    const comingSoon = page.getByText("Teorin på fem språk släpps snart.");
    if ((await comingSoon.count()) === 0) {
      test.skip(true, "Free theory questions are published in this database.");
    }
    await expect(page.getByText("Öva gratis")).toHaveCount(0);
    await expect(page.getByText("Gratis övningsfrågor")).toHaveCount(0);
    await expect(page.getByText("Ett urval är gratis")).toHaveCount(0);
  });

  test("tablet keeps the tab bar and the header on one line", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/sv");
    await expect(page.locator("nav.fixed.bottom-0")).toBeVisible();
    const wraps = await page.getByRole("banner").evaluate((node) => node.scrollWidth <= node.clientWidth + 1);
    expect(wraps).toBeTruthy();
  });
});
