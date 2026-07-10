import { test, expect } from "@playwright/test";
import { gotoApp } from "./setup";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("viewer opens with preview controls", async ({ page }) => {
  await page.locator(".group.cursor-pointer").first().click();
  await expect(page.getByPlaceholder(/Type something to preview/)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.getByRole("button", { name: /Copy CSS/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Save font/ })).toBeVisible();
});

test("viewer renders loaded font preview", async ({ page }) => {
  await page.locator(".group.cursor-pointer").first().click();
  await expect(page.getByPlaceholder(/Type something to preview/)).toBeVisible({
    timeout: 10000,
  });
  await expect(page.locator('[data-font-loaded="true"]')).toBeVisible({
    timeout: 15000,
  });
});

test("dark mode toggle applies dark class", async ({ page }) => {
  const html = page.locator("html");
  const toggle = page.getByRole("button", { name: "Toggle theme" });
  await toggle.click();
  await expect(html).toHaveClass(/dark/);
});

test("responsive: usable at 375px width", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await expect(page.getByRole("heading", { name: "fontgrep" })).toBeVisible();
  await expect(page.locator(".group.cursor-pointer").first()).toBeVisible({
    timeout: 10000,
  });
});