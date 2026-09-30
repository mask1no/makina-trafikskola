import { expect, test } from "@playwright/test";

test("renders key public routes on mobile", async ({ page }, testInfo) => {
  const locale = testInfo.project.name.replace("mobile-", "");
  await page.context().addCookies([
    {
      name: "makina-cookie-consent",
      value: "necessary",
      domain: "localhost",
      path: "/",
    },
  ]);

  for (const path of [
    "",
    "/korlektioner",
    "/larare",
    "/kurser",
    "/teori",
    "/teori/prov",
    "/kontakt",
  ]) {
    const response = await page.goto(`/${locale}${path}`);
    expect(response?.ok(), `${locale}${path}`).toBeTruthy();
    await expect(page.locator("html")).toHaveAttribute("lang", locale);
    await expect(page.locator("main")).toBeVisible();
  }

  await expect(page.locator("html")).toHaveAttribute(
    "dir",
    locale === "ar" ? "rtl" : "ltr",
  );
});

test("has no horizontal overflow and shows the tab bar only under md", async ({ page }, testInfo) => {
  const locale = testInfo.project.name.replace("mobile-", "");
  await page.context().addCookies([
    {
      name: "makina-cookie-consent",
      value: "necessary",
      domain: "localhost",
      path: "/",
    },
  ]);

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
  ] as const) {
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    for (const path of ["", "/paket/korpaket-b5", "/boka"]) {
      const response = await page.goto(`/${locale}${path}`);
      expect(response?.ok(), `${locale}${path} @${viewport.width}`).toBeTruthy();
      const fits = await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      );
      expect(fits, `${locale}${path} @${viewport.width}`).toBeTruthy();
    }
    const tabBar = page.locator("nav.fixed.bottom-0");
    if (viewport.width < 768) {
      await expect(tabBar).toBeVisible();
    } else {
      await expect(tabBar).toBeHidden();
    }
  }
});
