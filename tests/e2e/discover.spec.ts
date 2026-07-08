import { test, expect } from "@playwright/test";
import { mockGitHub } from "./setup";

test.beforeEach(async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/");
});

test("home loads with discover tab active", async ({ page }) => {
  await expect(page).toHaveTitle(/fontgrep/);
  await expect(page.getByRole("heading", { name: "fontgrep" })).toBeVisible();
  await expect(page.getByRole("tab", { name: /Discover/ })).toHaveAttribute(
    "data-active",
    "true"
  );
});

test("discover shows font families", async ({ page }) => {
  await expect(page.getByText("Inter")).toBeVisible({ timeout: 10000 });
  await expect(page.getByText("Roboto")).toBeVisible();
  // Inter should be grouped into a family with a style count badge.
  await expect(page.getByText(/3 styles/)).toBeVisible();
});

test("topic search loads new results", async ({ page }) => {
  const input = page.getByPlaceholder(/Topic/);
  await input.fill("monospace");
  await page.getByRole("button", { name: "Search" }).click();
  await expect(page.getByText("Inter")).toBeVisible({ timeout: 10000 });
});

test("surprise me opens the viewer", async ({ page }) => {
  await page.getByRole("button", { name: /Surprise me/ }).click();
  await expect(page.getByRole("button", { name: /Save font|Saved/ })).toBeVisible({
    timeout: 10000,
  });
});
