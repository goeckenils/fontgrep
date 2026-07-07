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
    licenseName: item.repository.license?.spdx_id || item.repository.license?.name || undefined,
  };
}

export function githubSearchUrl(query: string, limit = 25): string {
  const params = new URLSearchParams({
    q: query,
    per_page: String(Math.min(Math.max(limit, 1), 100)),
    sort: "indexed",
    order: "desc",
  });
  return `https://api.github.com/search/code?${params.toString()}`;
}
