import { test, expect } from "@playwright/test";
import { mockGitHub } from "./setup";

test.beforeEach(async ({ page }) => {
  await mockGitHub(page);
  await page.goto("/");
});

test("search flow opens viewer", async ({ page }) => {
  await page.getByRole("tab", { name: /Search/ }).click();
  await page.getByPlaceholder(/font name or keyword/).fill("Inter");
  await page.getByRole("button", { name: "Search", exact: true }).click();

  await expect(page.getByText("Inter-Regular.ttf")).toBeVisible({ timeout: 10000 });
  await page.getByText("Inter-Regular.ttf").click();

  await expect(page.getByRole("button", { name: /Save font|Saved/ })).toBeVisible({
    timeout: 10000,
  });
});
