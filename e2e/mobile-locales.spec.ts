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

  for (const path of ["", "/korlektioner", "/larare", "/kurser", "/teori", "/teori/prov"]) {
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
