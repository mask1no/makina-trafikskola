import { expect, test } from "@playwright/test";

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

test("skip link is first, focuses the single main landmark", async ({ page }) => {
  await page.goto("/en");
  await page.keyboard.press("Tab");
  const skipLink = page.getByRole("link", { name: "Skip to content" });
  await expect(skipLink).toBeFocused();
  await skipLink.click();
  await expect(page.locator("main#main")).toBeFocused();
  await expect(page.locator("main")).toHaveCount(1);
});

test("bottom sheet traps focus, closes on Escape, restores focus and inerts the page", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/en");
  const trigger = page.locator('button[aria-haspopup="menu"]').first();
  const headerBefore = await page.getByRole("banner").boundingBox();
  await trigger.click();

  const dialog = page.getByRole("dialog", { name: "Choose language" });
  await expect(dialog).toBeVisible();
  await expect.poll(() =>
    dialog.evaluate((element) => element.contains(document.activeElement)),
  ).toBe(true);
  await expect.poll(() =>
    page.evaluate(() =>
      [...document.body.children]
        .filter((element) => !element.hasAttribute("data-bottom-sheet-layer"))
        .every((element) => (element as HTMLElement).inert),
    ),
  ).toBe(true);
  await expect.poll(() =>
    page.evaluate(() => document.body.style.overflow),
  ).toBe("hidden");
  const headerDuring = await page.getByRole("banner").boundingBox();
  expect(Math.abs((headerDuring?.width ?? 0) - (headerBefore?.width ?? 0))).toBeLessThanOrEqual(1);

  const items = dialog.getByRole("menuitem");
  await items.last().focus();
  await page.keyboard.press("Tab");
  await expect(items.first()).toBeFocused();
  await page.keyboard.press("Shift+Tab");
  await expect(items.last()).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(dialog).toBeHidden();
  await expect(trigger).toBeFocused();
  await expect.poll(() =>
    page.evaluate(() => document.body.style.overflow),
  ).toBe("");
});

test("Arabic call numbers keep their logical left-to-right order", async ({ page }) => {
  await page.goto("/ar/kontakt");
  const phone = page.locator('bdi.numbers-ltr[dir="ltr"]').filter({
    hasText: "070-097 04 83",
  });
  expect(await phone.count()).toBeGreaterThan(0);
  for (const value of await phone.allTextContents()) {
    expect(value).toBe("070-097 04 83");
  }
});
