import { test, expect } from "@playwright/test";
import { gotoApp } from "./setup";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("save font then appears in library, delete removes it", async ({ page }) => {
  await page.getByText("Grenze", { exact: true }).click();
  const saveBtn = page.getByRole("button", { name: /Save font/ });
  await expect(saveBtn).toBeVisible({ timeout: 10000 });
  await saveBtn.click();

  // Go to library.
  await page.getByRole("tab", { name: /Library/ }).click();
  await expect(page.getByText("Inter", { exact: true })).toBeVisible({ timeout: 10000 });

  // Delete it.
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "Delete font" }).first().click();
  await expect(page.getByText(/No saved fonts yet/)).toBeVisible({ timeout: 10000 });
});
