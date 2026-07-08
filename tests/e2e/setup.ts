import { type Page, type Route } from "@playwright/test";
import {
  REPO_SEARCH,
  TREE_INTER,
  TREE_ROBOTO,
  CODE_SEARCH,
  fontBuffer,
} from "./mocks";

/**
 * Intercept all GitHub API + raw content requests and fulfill them with fixtures.
 * Lets every E2E spec run without a real GITHUB_TOKEN.
 */
export async function mockGitHub(page: Page) {
  await page.route(/api\.github\.com\//, async (route: Route) => {
    const url = route.request().url();
    if (url.includes("/search/repositories")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: {
          "x-ratelimit-remaining": "4999",
          "x-ratelimit-limit": "5000",
          "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600),
        },
        body: JSON.stringify(REPO_SEARCH),
      });
    }
    if (url.includes("/git/trees/")) {
      const tree = url.includes("Roboto") ? TREE_ROBOTO : TREE_INTER;
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tree),
      });
    }
    if (url.includes("/search/code")) {
      return route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(CODE_SEARCH),
      });
    }
    return route.fulfill({ status: 200, contentType: "application/json", body: "{}" });
  });

  // raw.githubusercontent.com font binaries.
  await page.route(/raw\.githubusercontent\.com\//, async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: "font/ttf",
      body: fontBuffer(),
    });
  });

  // Local /fonts served binaries (after download).
  await page.route(/\/fonts\//, async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: "font/ttf",
      body: fontBuffer(),
    });
  });
}
