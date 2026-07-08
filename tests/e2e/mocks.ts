// GitHub API response fixtures for E2E tests (no real GITHUB_TOKEN needed).
import { Buffer } from "node:buffer";

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
        license: { key: "ofl", name: "SIL Open Font License", spdx_id: "OFL-1.1" },
      },
    },
  ],
};

// A minimal valid-ish TTF magic header so font validation passes in the mock.
export function fontBuffer(): Buffer {
  return Buffer.concat([
    Buffer.from([0x00, 0x01, 0x00, 0x00]), // TTF magic
    Buffer.alloc(2048, 0x00),
  ]);
}
