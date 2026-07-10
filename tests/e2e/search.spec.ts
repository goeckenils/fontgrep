import { test, expect } from "@playwright/test";
import { gotoApp } from "./setup";

test.beforeEach(async ({ page }) => {
  await gotoApp(page);
});

test("search flow opens viewer", async ({ page }) => {
  await page.getByRole("tab", { name: /Search/ }).click();
  await page.getByPlaceholder(/font name or keyword/).fill("Inter");
  await page.getByRole("button", { name: "Run search", exact: true }).click();

  await expect(page.getByText("Inter-Regular.ttf", { exact: true }).first()).toBeVisible({
    timeout: 10000,
  });
  await page.getByText("Inter-Regular.ttf", { exact: true }).first().click();

  await expect(page.getByRole("button", { name: /Save font|Saved/ })).toBeVisible({
    timeout: 10000,
  });
});
