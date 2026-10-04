import { expect, test } from "@playwright/test";

const locales = ["sv", "en", "ti", "ar", "so"] as const;

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
        for (const path of ["", "/korlektioner", "/paket/en-korlektion", "/kontakt"]) {
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

  test("booking-off call actions and a single contact link", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/sv");
    const heroCall = page.locator("main section").first().getByRole("link", { name: /^Ring / });
    test.skip((await heroCall.count()) === 0, "This server has booking enabled.");

    await expect(heroCall).toBeVisible();
    await expect(page.locator("nav.fixed.bottom-0 a")).toHaveCount(5);
    await expect(page.locator("nav.fixed.bottom-0 a[href^='tel:']")).toHaveCount(1);
  });

  test("header shows Kontakt once", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sv");
    await expect(page.locator("header").getByRole("link", { name: "Kontakt" })).toHaveCount(1);
  });

  test("contact map makes no Google request before explicit load", async ({ page }) => {
    const googleRequests: string[] = [];
    page.on("request", (request) => {
      if (new URL(request.url()).hostname === "www.google.com") {
        googleRequests.push(request.url());
      }
    });
    await page.goto("/sv/kontakt");
    expect(googleRequests).toEqual([]);
    await page.getByRole("button", { name: "Visa karta" }).click();
    await expect.poll(() => googleRequests.length).toBeGreaterThan(0);
  });

  test("marquee copy is hidden and pause toggles", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto("/sv");
    const copy = page.locator(".benefit-copy");
    await expect(copy.first()).toHaveAttribute("aria-hidden", "true");
    const pause = page.getByRole("button", { name: "Pausa" });
    await pause.click();
    await expect(page.getByRole("button", { name: "Spela" })).toHaveAttribute("aria-pressed", "true");
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

  test("mobile benefits are a static five-card snap row", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/sv");
    await expect(page.locator(".benefit-mobile li")).toHaveCount(5);
    await expect(page.locator(".benefit-mobile")).toHaveCSS(
      "scroll-snap-type",
      /x/,
    );
    await expect(page.locator(".benefit-track")).toBeHidden();
  });

  test("shows confirmed teaching languages and does not claim Arabic or Somali lessons", async ({ page }) => {
    await page.goto("/sv/kontakt");
    await expect(page.getByText(/^Undervisar på /)).toHaveCount(6);
    const contact = await page.locator("body").innerText();
    expect(contact).toContain("Kontakta oss på Svenska, English, ትግርኛ och Kurdiska.");
    expect(contact).toContain("Soomaali kommer snart.");
    expect(contact).not.toMatch(/arabiska/i);
    expect(contact).not.toMatch(/undervisning på somaliska/i);

    await page.goto("/sv");
    const home = await page.locator("body").innerText();
    expect(home).toContain("Kontakta oss på Svenska, English, ትግርኛ och Kurdiska.");
    expect(home).not.toMatch(/arabiska/i);
    expect(home).toContain("Soomaali kommer snart.");
    expect(home).not.toMatch(/undervisning på somaliska/i);

    const prefixes = {
      sv: "Undervisning på ",
      en: "Lessons in ",
      ti: "ትምህርቲ ብ",
      ar: "التدريس بـ",
      so: "Waxbarasho ",
    } as const;
    for (const locale of locales) {
      await page.goto(`/${locale}/kontakt`);
      const lines = (await page.locator("body").innerText()).split("\n");
      const claims = lines.filter((line) => line.startsWith(prefixes[locale]));
      expect(claims.length).toBeGreaterThan(0);
      for (const claim of claims) {
        const offeredSentence = claim.split(/[.።]/, 1)[0];
        expect(offeredSentence).not.toContain("العربية");
        expect(offeredSentence).not.toContain("Soomaali");
      }
    }
  });

  test("shows the short terms in every locale", async ({ page }) => {
    const summaries = {
      sv: "Kortfattade villkor",
      en: "Short terms",
      ti: "ሓጺር ውዕላት",
      ar: "شروط مختصرة",
      so: "Shuruudo kooban",
    } as const;
    for (const [locale, title] of Object.entries(summaries)) {
      await page.goto(`/${locale}/villkor`);
      await expect(page.getByRole("heading", { name: title })).toBeVisible();
    }
    await expect(
      page.getByText("Dhammaan xirmooyinku waxay shaqeeyaan 12 bilood laga bilaabo taariikhda iibsiga."),
    ).toBeVisible();
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

  test("tablet header stays on one line and hides the tab bar", async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 });
    await page.goto("/sv");
    await expect(page.locator("nav.fixed.bottom-0")).toBeHidden();
    const wraps = await page.getByRole("banner").evaluate((node) => node.scrollWidth <= node.clientWidth + 1);
    expect(wraps).toBeTruthy();
  });
});
