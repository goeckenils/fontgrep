import { type Page, type Route } from "@playwright/test";
import {
  REPO_SEARCH,
  TREE_INTER,
  TREE_ROBOTO,
  CODE_SEARCH,
  DISCOVER_RESPONSE,
  SEARCH_RESPONSE,
  INSPECT_RESPONSE,
  SAVED_LIBRARY_FONT,
  fontBuffer,
} from "./mocks";

let libraryFonts: (typeof SAVED_LIBRARY_FONT)[] = [];

function apiPath(url: string | URL): string {
  return new URL(url).pathname;
}

/**
 * Intercept GitHub + local API requests and fulfill them with fixtures.
 * Lets every E2E spec run without a real GITHUB_TOKEN.
 */
export async function gotoApp(page: Page) {
  await mockGitHub(page);
  const discoverLoaded = page.waitForResponse(
    (res) => res.url().includes("/api/fonts/discover") && res.status() === 200,
  );
  await page.goto("/");
  await discoverLoaded;
}

export async function mockGitHub(page: Page) {
  libraryFonts = [];

  await page.route("**/api/**", async (route: Route) => {
    const path = apiPath(route.request().url());
    const method = route.request().method();

    if (path === "/api/fonts/discover") {
      return route.fulfill({ status: 200, json: DISCOVER_RESPONSE });
    }

    if (path === "/api/font-search" && method === "POST") {
      return route.fulfill({ status: 200, json: SEARCH_RESPONSE });
    }

    if (path.startsWith("/api/fonts/preview") || path.startsWith("/api/fonts/proxy")) {
      return route.fulfill({
        status: 200,
        contentType: "font/ttf",
        body: fontBuffer(),
      });
    }

    if (path === "/api/fonts/download" && method === "POST") {
      libraryFonts = [SAVED_LIBRARY_FONT];
      return route.fulfill({
        status: 200,
        json: {
          id: SAVED_LIBRARY_FONT.id,
          publicPath: SAVED_LIBRARY_FONT.publicPath,
          metadata: INSPECT_RESPONSE,
        },
      });
    }

    if (path === "/api/fonts/inspect" && method === "POST") {
      return route.fulfill({ status: 200, json: INSPECT_RESPONSE });
    }

    if (path === "/api/fonts/library") {
      return route.fulfill({ status: 200, json: { fonts: libraryFonts } });
    }

    if (/^\/api\/fonts\/\d+$/.test(path) && method === "DELETE") {
      libraryFonts = [];
      return route.fulfill({ status: 200, json: { ok: true } });
    }

    return route.continue();
  });

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

  await page.route(/raw\.githubusercontent\.com\//, async (route: Route) => {
    return route.fulfill({
      status: 200,
      contentType: "font/ttf",
      body: fontBuffer(),
    });
  });

  // Public saved font binaries only — not /api/fonts/* JSON routes.
  await page.route(
    (url) => {
      const p = apiPath(url);
      return p.startsWith("/fonts/") && !p.startsWith("/api/");
    },
    async (route: Route) => {
      return route.fulfill({
        status: 200,
        contentType: "font/ttf",
        body: fontBuffer(),
      });
    },
  );
}