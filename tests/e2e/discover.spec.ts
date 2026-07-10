import { test, expect } from "@playwright/test";
import { gotoApp } from "./setup";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("home loads with discover tab active", async ({ page }) => {
  await expect(page).toHaveTitle(/fontgrep/);
  await expect(page.getByRole("heading", { name: "fontgrep" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Discover/ })).toHaveAttribute(
    "aria-selected",
    "true"
  );
});

test("discover shows rare font families", async ({ page }) => {
  await expect(page.getByText("Grenze", { exact: true })).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Syne", { exact: true })).toBeVisible();
  await expect(page.getByText(/3 cuts/)).toBeVisible();
});

test("topic search loads new results", async ({ page }) => {
  const input = page.getByPlaceholder(/Topic/);
  await input.fill("monospace");
  await page.getByRole("button", { name: "Search", exact: true }).click();
  await expect(page.getByText("Grenze", { exact: true })).toBeVisible({ timeout: 10000 });
});

test("surprise me opens the viewer", async ({ page }) => {
  await page.getByRole("button", { name: /Surprise/ }).click();
  await expect(page.getByRole("button", { name: /Save font|Saved/ })).toBeVisible({
    timeout: 10000,
  });
});
