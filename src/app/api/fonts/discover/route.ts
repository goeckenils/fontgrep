import { NextResponse } from "next/server";
import {
  githubRepoSearchUrl,
  extractFontPaths,
  detectFontFormat,
  type GitHubRepoSearchItem,
  type GitHubTreeResponse,
} from "@/lib/githubFontSearch";
import { groupFonts, type DiscoveredFontFamily } from "@/lib/fontFamily";
import type { FontFormat } from "@/types/fontDiscovery";
import { cacheKey, getCached, setCached, parseRateLimit, isRateLimitCritical } from "@/lib/githubCache";

export const dynamic = "force-dynamic";

const PER_PAGE = 5; // repos per page
const MAX_FONTS = 30; // cap fonts returned per request

export type { DiscoveredFontFamily };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "font";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error: "github_auth_required",
        message: "Set GITHUB_TOKEN in your .env to discover fonts from GitHub.",
      },
      { status: 401 }
    );
  }

  const ck = cacheKey(["discover", query, page]);
  const cached = getCached(ck) as { families: DiscoveredFontFamily[]; hasMore: boolean } | null;
  if (cached) {
    return NextResponse.json({ query, page, families: cached.families, hasMore: cached.hasMore });
  }

  const repoRes = await fetch(githubRepoSearchUrl(query, page, PER_PAGE), {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "fontgrep" },
  });
  const rate = parseRateLimit(repoRes.headers);
  if (!repoRes.ok) {
    return NextResponse.json(
      { error: "github_repo_search_failed", status: repoRes.status },
      { status: 502, headers: rateHeaders(rate) }
    );
  }
  if (isRateLimitCritical(rate)) {
    return NextResponse.json(
      {
        error: "github_rate_limited",
        message: "GitHub API rate limit nearly exhausted. Try again later.",
        retryAfter: rate.reset,
      },
      { status: 429, headers: rateHeaders(rate) }
    );
  }

  const repoJson = (await repoRes.json()) as { items: GitHubRepoSearchItem[] };
  const repos = repoJson.items ?? [];

  const rawFiles: {
    repository: string;
    branch: string;
    license: string | null;
    stars: number;
    path: string;
    format: FontFormat;
  }[] = [];

  for (const repo of repos) {
    if (rawFiles.length >= MAX_FONTS) break;
    const treeRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": "fontgrep" } }
    );
    if (!treeRes.ok) continue;
    const tree = (await treeRes.json()) as GitHubTreeResponse;
    const fonts = extractFontPaths(tree);
    for (const f of fonts) {
      if (rawFiles.length >= MAX_FONTS) break;
      rawFiles.push({
        repository: repo.full_name,
        branch: repo.default_branch,
        license: repo.license?.spdx_id ?? null,
        stars: repo.stargazers_count ?? 0,
        path: f.path,
        format: detectFontFormat(f.path),
      });
    }
  }

  const families = groupFonts(rawFiles);
  const hasMore = repos.length === PER_PAGE;
  setCached(ck, { families, hasMore });

  return NextResponse.json(
    { query, page, families, hasMore },
    { headers: rateHeaders(rate) }
  );
}

function rateHeaders(rate: { remaining: number | null; reset: number | null; limit: number | null }) {
  const h: Record<string, string> = {};
  if (rate.remaining != null) h["x-ratelimit-remaining"] = String(rate.remaining);
  if (rate.limit != null) h["x-ratelimit-limit"] = String(rate.limit);
  if (rate.reset != null) h["x-ratelimit-reset"] = String(rate.reset);
  return h;
}
