import type { FontDiscoveryResult, FontFormat, FontSearchInput, GitHubCodeSearchItem } from "@/types/fontDiscovery";

const FONT_EXTENSIONS = ["ttf", "otf", "woff", "woff2", "eot"] as const;

export function detectFontFormat(path: string): FontFormat {
  const lower = path.toLowerCase();
  if (lower.includes("variable") || lower.includes("vf.")) return "variable";
  for (const ext of FONT_EXTENSIONS) {
    if (lower.endsWith(`.${ext}`)) return ext;
  }
  if (lower.endsWith(".svg")) return "svg";
  return "unknown";
}

export function buildGitHubFontQuery(input: FontSearchInput): string {
  const term = input.query.trim();
  if (!term) throw new Error("query is required");

  const parts: string[] = [];
  const quotedTerm = term.includes(" ") ? `\"${term}\"` : term;

  if (input.mode === "filename") {
    parts.push(quotedTerm, "path:fonts");
  }

  if (input.mode === "extension") {
    parts.push(quotedTerm, "(extension:ttf OR extension:otf OR extension:woff OR extension:woff2)");
  }

  if (input.mode === "css") {
    parts.push(`\"font-family: ${term}\"`);
    if (!input.language || input.language === "any") parts.push("language:CSS");
  }

  if (input.mode === "license") {
    parts.push(quotedTerm, "(path:LICENSE OR path:OFL.txt OR path:FONTLOG.txt)");
  }

  if (input.language && input.language !== "any" && input.mode !== "css") {
    parts.push(`language:${input.language}`);
  }

  return parts.join(" ");
}

export function normalizeGitHubItem(item: GitHubCodeSearchItem): FontDiscoveryResult {
  return {
    repository: item.repository.full_name,
    path: item.path,
    fileName: item.name,
    url: item.html_url,
    format: detectFontFormat(item.path),
    branch: item.repository.default_branch,
    licenseName: item.repository.license?.spdx_id || item.repository.license?.name || undefined,
  };
}

export type DiscoverLane = "files" | "repos";

export const DISCOVER_FILES_PER_PAGE = 50;
/** GitHub code search caps at 1000 results (100/page). */
export const DISCOVER_FILES_MAX_PAGE = 10;

const FONT_EXTENSIONS_Q =
  "(extension:woff2 OR extension:ttf OR extension:otf OR extension:woff)";
/** Code search supports NOT path: — avoid slashes in path literals (use simple segments). */
const FONT_PATH_EXCLUDES = "NOT path:node_modules NOT path:vendor";

/** Treasure code search: skip mega mirror owners/repos at the source. */
export const TREASURE_CODE_SEARCH_EXCLUDES = [
  "-user:google",
  "-org:googlefonts",
  "-user:fortawesome",
  "-org:fortawesome",
  "-user:fontsource",
  "-org:fontsource",
  "-repo:google/fonts",
  "-repo:fontsource/font-files",
  "-repo:fortawesome/Font-Awesome",
  "-repo:fortawesome/Font-Awesome-6",
  "NOT path:fontawesome",
  "NOT path:font-awesome",
  "NOT path:fontello",
  "NOT path:flaticon",
  "NOT path:icomoon",
  "NOT path:icofont",
  "NOT path:system",
].join(" ");

export interface RepoSearchOptions {
  /** Bias toward low-star indie repos; excludes Google mega-collections. */
  treasure?: boolean;
}

const DISCOVER_FILE_QUERY_VARIANTS = [
  (term: string) => `${term} ${FONT_EXTENSIONS_Q} ${FONT_PATH_EXCLUDES}`,
  (term: string) => `${FONT_EXTENSIONS_Q} ${term} path:fonts ${FONT_PATH_EXCLUDES}`,
  (term: string) =>
    `${FONT_EXTENSIONS_Q} ${term} (path:assets OR path:static OR path:public) ${FONT_PATH_EXCLUDES}`,
  (term: string) => `${FONT_EXTENSIONS_Q} ${term} path:font ${FONT_PATH_EXCLUDES}`,
  (term: string) => `font ${term} ${FONT_EXTENSIONS_Q} ${FONT_PATH_EXCLUDES}`,
] as const;

export const DISCOVER_FILE_QUERY_VARIANT_COUNT = DISCOVER_FILE_QUERY_VARIANTS.length;

/** Format a keyword for GitHub search (code + repo). */
export function formatDiscoverTerm(topic: string): string {
  const raw = topic.trim() || "font";
  if (/[\s"]/.test(raw)) return `"${raw.replace(/"/g, '\\"')}"`;
  return raw;
}

/** Code search: font binaries across all of GitHub matching a topic/keyword. */
export function buildDiscoverFilesQuery(
  topic: string,
  variant = 0,
  treasure = false,
): string {
  const term = formatDiscoverTerm(topic);
  const idx =
    ((variant % DISCOVER_FILE_QUERY_VARIANT_COUNT) + DISCOVER_FILE_QUERY_VARIANT_COUNT) %
    DISCOVER_FILE_QUERY_VARIANT_COUNT;
  const base = DISCOVER_FILE_QUERY_VARIANTS[idx](term);
  return treasure ? `${base} ${TREASURE_CODE_SEARCH_EXCLUDES}` : base;
}

/** Minimal fallback when a complex code-search query fails to parse. */
export function buildDiscoverFilesQueryFallback(topic: string): string {
  const term = formatDiscoverTerm(topic);
  return `${term} extension:woff2`;
}

/** Repo search: broad keyword match (not locked to topic: tag). */
export function buildDiscoverRepoQuery(topic: string, treasure: boolean): string {
  const term = formatDiscoverTerm(topic);
  const parts = [term, "font", "in:name,description,readme"];
  if (treasure) {
    parts.push(
      "-user:google",
      "-org:googlefonts",
      "-user:fortawesome",
      "-org:fortawesome",
      "-user:fontsource",
      "-org:fontsource",
      "-user:adobe-fonts",
      "-org:adobe-fonts",
    );
  }
  return parts.join(" ");
}

export function githubRepoSearchUrl(
  query: string,
  page = 1,
  perPage = 10,
  options: RepoSearchOptions = {},
): string {
  const q = buildDiscoverRepoQuery(query, options.treasure ?? false);
  const params = new URLSearchParams({
    q,
    sort: "stars",
    order: options.treasure ? "asc" : "desc",
    page: String(page),
    per_page: String(Math.min(Math.max(perPage, 1), 100)),
  });
  return `https://api.github.com/search/repositories?${params.toString()}`;
}

export function githubSearchUrl(query: string, limit = 25, page = 1): string {
  const params = new URLSearchParams({
    q: query,
    per_page: String(Math.min(Math.max(limit, 1), 100)),
    page: String(Math.max(1, page)),
    sort: "indexed",
    order: "desc",
  });
  return `https://api.github.com/search/code?${params.toString()}`;
}

export function codeSearchItemsToFontFiles(
  items: GitHubCodeSearchItem[],
): {
  repository: string;
  branch: string;
  license: string | null;
  stars: number;
  path: string;
  format: FontFormat;
}[] {
  return items.map((item) => ({
    repository: item.repository.full_name,
    branch: item.repository.default_branch ?? "main",
    license: item.repository.license?.spdx_id ?? null,
    stars: 0,
    path: item.path,
    format: detectFontFormat(item.path),
  }));
}

export interface GitHubRepoSearchItem {
  full_name: string;
  default_branch: string;
  stargazers_count: number;
  license: { key: string; name: string; spdx_id: string } | null;
  description: string | null;
}

export interface GitHubTreeEntry {
  path: string;
  type: string;
  size?: number;
}

export interface GitHubTreeResponse {
  tree: GitHubTreeEntry[];
}

const FONT_EXT_RE = /\.(ttf|otf|woff|woff2|eot)$/i;

export function extractFontPaths(tree: GitHubTreeResponse): { path: string; format: string }[] {
  return tree.tree
    .filter((e) => e.type === "blob" && FONT_EXT_RE.test(e.path))
    .map((e) => ({
      path: e.path,
      format: (e.path.split(".").pop() || "unknown").toLowerCase(),
    }));
}
