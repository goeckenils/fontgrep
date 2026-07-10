// GitHub API response fixtures for E2E tests (no real GITHUB_TOKEN needed).
import { Buffer } from "node:buffer";
import fs from "node:fs";
import path from "node:path";

export const REPO_SEARCH = {
  total_count: 2,
  items: [
    {
      full_name: "owner/Inter",
      default_branch: "main",
      stargazers_count: 1234,
      license: { key: "ofl", name: "SIL Open Font License", spdx_id: "OFL-1.1" },
      description: "Inter font family",
    },
    {
      full_name: "owner/Roboto",
      default_branch: "master",
      stargazers_count: 900,
      license: null,
      description: "Roboto font",
    },
  ],
};

export const TREE_INTER = {
  tree: [
    { path: "fonts/Inter-Regular.ttf", type: "blob", size: 1024 },
    { path: "fonts/Inter-Bold.ttf", type: "blob", size: 1024 },
    { path: "fonts/Inter-Italic.ttf", type: "blob", size: 1024 },
  ],
};

export const TREE_ROBOTO = {
  tree: [{ path: "Roboto.ttf", type: "blob", size: 1024 }],
};

export const CODE_SEARCH = {
  total_count: 1,
  items: [
    {
      name: "Inter-Regular.ttf",
      path: "fonts/Inter-Regular.ttf",
      html_url: "https://github.com/owner/Inter/blob/main/fonts/Inter-Regular.ttf",
      repository: {
        full_name: "owner/Inter",
        html_url: "https://github.com/owner/Inter",
        default_branch: "main",
        license: { key: "ofl", name: "SIL Open Font License", spdx_id: "OFL-1.1" },
      },
    },
  ],
};

/** Indie-style families that pass default rare-hunt filters. */
export const DISCOVER_RESPONSE = {
  query: "font",
  page: 1,
  lane: "files",
  variant: 0,
  hasMore: false,
  reposFetched: 0,
  totalCount: 2,
  treasure: true,
  families: [
    {
      family: "Grenze",
      repository: "treasure/grenze",
      branch: "main",
      license: "OFL-1.1",
      stars: 120,
      styles: [
        {
          path: "fonts/Grenze-Regular.ttf",
          fileName: "Grenze-Regular.ttf",
          format: "ttf",
          weight: 400,
          style: "normal",
          family: "Grenze",
        },
        {
          path: "fonts/Grenze-Bold.ttf",
          fileName: "Grenze-Bold.ttf",
          format: "ttf",
          weight: 700,
          style: "normal",
          family: "Grenze",
        },
        {
          path: "fonts/Grenze-Italic.ttf",
          fileName: "Grenze-Italic.ttf",
          format: "ttf",
          weight: 400,
          style: "italic",
          family: "Grenze",
        },
      ],
    },
    {
      family: "Syne",
      repository: "indie/syne",
      branch: "main",
      license: "OFL-1.1",
      stars: 85,
      styles: [
        {
          path: "fonts/Syne-Regular.ttf",
          fileName: "Syne-Regular.ttf",
          format: "ttf",
          weight: 400,
          style: "normal",
          family: "Syne",
        },
      ],
    },
  ],
};

export const SEARCH_RESPONSE = {
  query: "path:fonts Inter",
  totalCount: 1,
  results: [
    {
      repository: "owner/Inter",
      path: "fonts/Inter-Regular.ttf",
      fileName: "Inter-Regular.ttf",
      url: "https://github.com/owner/Inter/blob/main/fonts/Inter-Regular.ttf",
      format: "ttf",
      branch: "main",
      licenseName: "OFL-1.1",
    },
  ],
};

export const INSPECT_RESPONSE = {
  family: "Inter",
  weight: 400,
  style: "normal",
  isVariable: false,
  axes: [],
};

export const SAVED_LIBRARY_FONT = {
  id: 1,
  family: "Inter-Regular.ttf",
  realFamily: "Inter",
  weight: 400,
  style: "normal",
  isVariable: false,
  designer: null,
  format: "ttf",
  license: "OFL-1.1",
  publicPath: "/fonts/mock-inter.ttf",
  downloadedAt: new Date().toISOString(),
};

const ROBOTO_FIXTURE = path.join(
  process.cwd(),
  "tests",
  "fixtures",
  "Roboto-Regular.ttf",
);

/** Real TTF bytes so FontFace.load() succeeds in the browser. */
export function fontBuffer(): Buffer {
  return fs.readFileSync(ROBOTO_FIXTURE);
}