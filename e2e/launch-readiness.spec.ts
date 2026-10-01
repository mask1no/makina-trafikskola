import { expect, test } from "@playwright/test";

test.describe("public localized experience", () => {
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

  test("keeps the selected locale during public navigation", async ({ page }) => {
    await page.goto("/en");
    await page
      .getByRole("navigation", { name: "Main navigation" })
      .getByRole("link", { name: "Instructors", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/larare$/);
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
  });

  test("renders Arabic right-to-left", async ({ page }) => {
    await page.goto("/ar");
    await expect(page.locator("html")).toHaveAttribute("lang", "ar");
    await expect(page.locator("html")).toHaveAttribute("dir", "rtl");
  });

  test("offers localized free theory questions", async ({ page }) => {
    await page.goto("/ar/teori/del-1");
    await expect(
      page.getByRole("heading", { name: "قواعد المرور", level: 1 }),
    ).toBeVisible();
    await expect(page.getByRole("radio")).toHaveCount(9);
  });

  test("keeps the Google account option visible", async ({ page }) => {
    test.skip(!process.env.AUTH_GOOGLE_ID, "Google sign-in is not configured.");
    await page.goto("/en/skapa-konto");
    await expect(
      page.getByRole("button", { name: "Continue with Google" }),
    ).toBeVisible();
  });

  test("preserves an instructor deep link in booking", async ({ page }) => {
    await page.goto("/en/larare/sara-johansson");
    await page.getByRole("link", { name: /Sara/ }).last().click();
    await expect(page).toHaveURL(/\/en\/boka\?teacher=/);

    await page.getByRole("button", { name: "Continue" }).click();
    await page.getByRole("button", { name: "Continue" }).click();
    await expect(page.getByRole("button", { name: /Sara Johansson/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});

test("stores cookie consent", async ({ page }) => {
  await page.goto("/en");
  const banner = page.getByRole("complementary", { name: "Cookie settings" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "OK" }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(banner).toBeHidden();
});

test.describe("authorization boundaries", () => {
  test("redirects anonymous users to localized login", async ({ page }) => {
    await page.goto("/en/mina-sidor");
    await expect(page).toHaveURL(
      /\/en\/logga-in\?callbackUrl=%2Fen%2Fmina-sidor/,
    );
  });

  test("rejects an authenticated user with the wrong role", async ({ page }) => {
    await page.goto("/en/admin");
    await page.getByRole("button", { name: "Password" }).click();
    await page.getByLabel("Email").fill("admin@makina.local");
    await page.locator("#password").fill("Passw0rd!");
    await page.getByRole("button", { name: "Log in" }).click();
    await expect(page).toHaveURL(/\/en\/admin$/);

    await page.goto("/en/mina-sidor");
    await expect(page).toHaveURL(/\/en\/ingen-behorighet$/);
    await expect(
      page.getByRole("heading", { name: "You do not have access" }),
    ).toBeVisible();
  });
});

test("ships localized offline fallback and service worker artifacts", async ({
  request,
}) => {
  const worker = await request.get("/sw.js");
  expect(worker.ok()).toBeTruthy();
  expect(await worker.text()).toContain("/offline");

  const fallback = await request.get("/en/offline");
  expect(fallback.ok()).toBeTruthy();
  expect(await fallback.text()).toContain("You are offline");
});
