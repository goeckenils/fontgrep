import { test, expect } from "@playwright/test";
import { mockGitHub } from "./setup";

test.beforeEach(async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/");
});

test("save font then appears in library, delete removes it", async ({ page }) => {
  // Open Inter family viewer and save the regular style.
  await page.getByText("Inter").first().click();
  const saveBtn = page.getByRole("button", { name: /Save font/ });
  await expect(saveBtn).toBeVisible({ timeout: 10000 });
  await saveBtn.click();

  // Go to library.
  await page.getByRole("tab", { name: /Library/ }).click();
  await expect(page.getByText("Inter")).toBeVisible({ timeout: 10000 });

  // Delete it.
  await page.getByRole("button", { name: "Delete font" }).first().click();
  page.once("dialog", (d) => d.accept());
  // After deletion the library should be empty (only Inter was saved).
  await expect(page.getByText(/No saved fonts yet/)).toBeVisible({ timeout: 10000 });
});
