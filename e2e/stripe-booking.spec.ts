import { expect, test } from "@playwright/test";

const required = [
  "STRIPE_E2E_ENABLED",
  "STRIPE_E2E_STUDENT_EMAIL",
  "STRIPE_E2E_STUDENT_PASSWORD",
  "STRIPE_E2E_TEACHER_ID",
  "STRIPE_E2E_LOCATION_ID",
  "STRIPE_E2E_PRODUCT_ID",
  "STRIPE_E2E_ORDER_ID",
] as const;
const missing = required.filter((name) => !process.env[name]);
const ready = process.env.STRIPE_E2E_ENABLED === "1" && missing.length === 0;
const reason = ready
  ? ""
  : `Dedicated Stripe E2E environment and fixtures are required${
      missing.length ? ` (missing: ${missing.join(", ")})` : ""
    }.`;

for (const locale of ["sv", "ar"] as const) {
  test(`Payment Element ${locale}: dedicated payment fixture`, async ({
    page,
  }) => {
    test.skip(!ready, reason);

    const orderId = process.env.STRIPE_E2E_ORDER_ID!;
    const callbackUrl = `/${locale}/checkout/${orderId}`;
    await page.goto(
      `/${locale}/logga-in?callbackUrl=${encodeURIComponent(callbackUrl)}`,
    );
    await page.getByRole("textbox", { name: /e-post|email|بريد|ኢሜይል/i }).fill(
      process.env.STRIPE_E2E_STUDENT_EMAIL!,
    );
    await page.getByLabel(/lösenord|password|كلمة|ምስጢር/i).fill(
      process.env.STRIPE_E2E_STUDENT_PASSWORD!,
    );
    await page.locator("form").getByRole("button").click();
    await page.waitForURL(`**${callbackUrl}`);
    await expect(page.locator("html")).toHaveAttribute(
      "dir",
      locale === "ar" ? "rtl" : "ltr",
    );
    await expect(
      page.locator('iframe[name^="__privateStripeFrame"]').first(),
    ).toBeVisible();
    await expect(
      page.getByRole("button", {
        name: locale === "ar" ? "ادفع الآن" : "Betala nu",
      }),
    ).toBeEnabled();
    test.info().annotations.push(
      {
        type: "fixture-boundary",
        description:
          "The dedicated Stripe fixture owns confirmation, webhook forwarding, and cancellation/refund assertions.",
      },
    );
  });
}
