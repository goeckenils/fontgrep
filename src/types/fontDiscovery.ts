export type FontFormat = "ttf" | "otf" | "woff" | "woff2" | "eot" | "svg" | "variable" | "unknown";

export type FontSearchMode = "filename" | "extension" | "css" | "license";

export interface FontSearchInput {
  query: string;
  mode: FontSearchMode;
  language?: "CSS" | "HTML" | "JavaScript" | "TypeScript" | "any";
  limit?: number;
}

export interface GitHubCodeSearchItem {
  name: string;
  path: string;
  html_url: string;
  repository: {
    full_name: string;
    html_url: string;
    license?: { key: string; name: string; spdx_id: string } | null;
  };
}

export interface FontDiscoveryResult {
  repository: string;
  path: string;
  fileName: string;
  url: string;
  format: FontFormat;
  licenseName?: string;
}
