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
      .getByRole("link", { name: "Prices", exact: true })
      .click();
    await expect(page).toHaveURL(/\/en\/priser$/);
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
    await expect(page.locator(".choice-card")).toHaveCount(3);
    await page.locator(".choice-card").first().click();
    await expect(page.getByRole("button", { name: "التالي" })).toBeVisible();
    await expect(page.getByText("تعذر حفظ الإجابة")).toHaveCount(0);
  });

  test("keeps the Google account option visible", async ({ page }) => {
    await page.goto("/en/skapa-konto");
    const google = page.getByRole("button", { name: "Continue with Google" });
    await expect(google).toBeVisible();
    await expect(page.locator("form").getByRole("button", { name: "Continue with Google" })).toHaveCount(0);
  });

  test("submits Google sign-in once on a double click", async ({ page }) => {
    let posts = 0;
    page.on("request", (request) => {
      if (
        request.method() === "POST" &&
        request.url().includes("/api/auth/signin/google")
      ) {
        posts += 1;
      }
    });
    await page.goto("/en/logga-in");
    await page
      .getByRole("button", { name: "Continue with Google" })
      .dblclick();
    await expect.poll(() => posts).toBe(1);
  });

  test("shows a translated notice for Auth.js errors", async ({ page }) => {
    await page.goto("/en/logga-in?error=AccessDenied");
    const notice = page.getByText(
      "Google sign-in was denied. Try again or choose another way to sign in.",
    );
    await expect(notice).toBeVisible();
    await expect(notice).not.toContainText("AccessDenied");
  });

  test("preserves an instructor deep link in booking", async ({ page }) => {
    await page.goto("/en/larare/aron-kessete");
    await page.getByRole("link", { name: /Aron/ }).last().click();
    await expect(page).toHaveURL(/\/en\/boka\?teacher=/);
    const teacher = page.getByRole("button", { name: /Aron Kessete/ });
    test.skip((await teacher.count()) === 0, "This server has booking disabled.");
    await expect(teacher).toHaveAttribute("aria-pressed", "true");
  });

  test("falls back to plain pickup input and requires selecting an address suggestion", async ({
    page,
  }) => {
    await page.route("**://maps.googleapis.com/**", (route) => route.abort());
    await page.route("**://maps.gstatic.com/**", (route) => route.abort());
    await page.goto("/sv/boka");
    const nextButton = page.getByRole("button", { name: "Nästa" });
    test.skip(
      (await nextButton.count()) === 0,
      "This server has booking disabled.",
    );
    await nextButton.click();
    await page.getByRole("button", { name: "Hämta mig" }).click();
    await page.getByLabel("Hämtningsadress").fill("Centralvägen 5");
    await nextButton.click();
    await expect(page.getByText("Välj en adress i listan.")).toBeVisible();
  });
});

test("stores cookie consent", async ({ page }) => {
  await page.goto("/en");
  const banner = page.getByRole("region", { name: "Cookie settings" });
  await expect(banner).toBeVisible();
  await banner.getByRole("button", { name: "OK" }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(banner).toBeHidden();
});

test("keeps shallow health public and protects deep diagnostics", async ({ request }) => {
  const shallow = await request.get("/api/health");
  expect(shallow.status()).toBe(200);
  await expect(shallow.json()).resolves.toEqual({ status: "ok" });

  const unauthenticated = await request.get("/api/health?deep=1");
  expect(unauthenticated.status()).toBe(401);
  const secret = process.env.CRON_SECRET ?? "e2e-cron-secret";
  const deep = await request.get("/api/health?deep=1", {
    headers: { authorization: `Bearer ${secret}` },
  });
  expect([200, 503]).toContain(deep.status());
  const body = await deep.json();
  expect(body.checks.database.ok).toBe(true);
  expect(body.checks.migrations).toBeTruthy();
  expect(body.checks.backup).toBeTruthy();
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
