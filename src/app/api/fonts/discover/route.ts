import { NextResponse } from "next/server";
import {
  githubRepoSearchUrl,
  githubSearchUrl,
  buildDiscoverFilesQuery,
  buildDiscoverFilesQueryFallback,
  extractFontPaths,
  detectFontFormat,
  codeSearchItemsToFontFiles,
  DISCOVER_FILES_PER_PAGE,
  DISCOVER_FILES_MAX_PAGE,
  type DiscoverLane,
  type GitHubRepoSearchItem,
  type GitHubTreeResponse,
} from "@/lib/githubFontSearch";
import { groupFonts, type DiscoveredFontFamily } from "@/lib/fontFamily";
import type { FontFormat } from "@/types/fontDiscovery";
import type { GitHubCodeSearchItem } from "@/types/fontDiscovery";
import { cacheKey, getCached, setCached, parseRateLimit, isRateLimitCritical } from "@/lib/githubCache";
import { DISCOVER_REPOS_PER_PAGE, filterTreasureFamilies } from "@/lib/fontFilters";

export const dynamic = "force-dynamic";

const MAX_TREE_FONTS = 50;

export type { DiscoveredFontFamily };

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("query") ?? "font";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const treasure = searchParams.get("treasure") !== "0";
  const lane: DiscoverLane = searchParams.get("lane") === "repos" ? "repos" : "files";
  const variant = Math.max(0, Number(searchParams.get("variant") ?? "0") || 0);
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    return NextResponse.json(
      {
        error: "github_auth_required",
        message: "Set GITHUB_TOKEN in your .env to discover fonts from GitHub.",
      },
      { status: 401 },
    );
  }

  const ck = cacheKey([
    "discover",
    lane,
    query,
    page,
    variant,
    treasure ? "treasure" : "default",
  ]);
  const cached = getCached(ck) as {
    families: DiscoveredFontFamily[];
    hasMore: boolean;
    totalCount: number | null;
    reposFetched: number;
    lane: DiscoverLane;
    variant: number;
  } | null;

  if (cached) {
    return NextResponse.json({
      query,
      page,
      lane: cached.lane,
      variant: cached.variant,
      families: cached.families,
      hasMore: cached.hasMore,
      totalCount: cached.totalCount,
      reposFetched: cached.reposFetched,
      treasure,
    });
  }

  if (lane === "files") {
    return discoverFilesLane(query, page, variant, treasure, token, ck);
  }

  return discoverReposLane(query, page, treasure, token, ck);
}

async function discoverFilesLane(
  query: string,
  page: number,
  variant: number,
  treasure: boolean,
  token: string,
  ck: string,
) {
  const perPage = DISCOVER_FILES_PER_PAGE;
  let q = buildDiscoverFilesQuery(query, variant, treasure);
  let codeRes = await fetchCodeSearch(q, perPage, page, token);
  let rate = parseRateLimit(codeRes.headers);

  if (!codeRes.ok && (codeRes.status === 422 || codeRes.status === 400)) {
    q = buildDiscoverFilesQueryFallback(query);
    codeRes = await fetchCodeSearch(q, perPage, page, token);
    rate = parseRateLimit(codeRes.headers);
  }

  if (!codeRes.ok) {
    const errBody = (await codeRes.json().catch(() => ({}))) as {
      message?: string;
      errors?: { message?: string }[];
    };
    const detail =
      errBody.message ??
      errBody.errors?.[0]?.message ??
      `GitHub code search failed (${codeRes.status}).`;
    return NextResponse.json(
      {
        error: "github_code_search_failed",
        status: codeRes.status,
        message: detail,
      },
      { status: 502, headers: rateHeaders(rate) },
    );
  }

  if (isRateLimitCritical(rate)) {
    return NextResponse.json(
      {
        error: "github_rate_limited",
        message: "GitHub API rate limit nearly exhausted. Try again later.",
        retryAfter: rate.reset,
      },
      { status: 429, headers: rateHeaders(rate) },
    );
  }

  const codeJson = (await codeRes.json()) as {
    items: GitHubCodeSearchItem[];
    total_count?: number;
  };
  const items = codeJson.items ?? [];
  const totalCount = codeJson.total_count ?? null;
  const rawFiles = codeSearchItemsToFontFiles(items);
  let families = groupFonts(rawFiles);
  if (treasure) {
    families = filterTreasureFamilies(families);
  }

  const atPageCap = page >= DISCOVER_FILES_MAX_PAGE;
  const atResultCap =
    totalCount != null ? page * perPage >= Math.min(totalCount, 1000) : false;
  const hasMore = items.length === perPage && !atPageCap && !atResultCap;

  const payload = {
    families,
    hasMore,
    totalCount,
    reposFetched: 0,
    lane: "files" as const,
    variant,
  };

  if (families.length > 0) {
    setCached(ck, payload);
  }

  return NextResponse.json(
    {
      query,
      page,
      treasure,
      ...payload,
    },
    { headers: rateHeaders(rate) },
  );
}

async function discoverReposLane(
  query: string,
  page: number,
  treasure: boolean,
  token: string,
  ck: string,
) {
  const perPage = DISCOVER_REPOS_PER_PAGE;
  const repoRes = await fetch(githubRepoSearchUrl(query, page, perPage, { treasure }), {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "fontgrep" },
  });
  const rate = parseRateLimit(repoRes.headers);

  if (!repoRes.ok) {
    const errBody = (await repoRes.json().catch(() => ({}))) as { message?: string };
    return NextResponse.json(
      {
        error: "github_repo_search_failed",
        status: repoRes.status,
        message:
          repoRes.status === 401
            ? "GitHub rejected the token. Regenerate GITHUB_TOKEN in .env and restart the dev server."
            : errBody.message ?? `GitHub repo search failed (${repoRes.status}).`,
      },
      { status: 502, headers: rateHeaders(rate) },
    );
  }

  if (isRateLimitCritical(rate)) {
    return NextResponse.json(
      {
        error: "github_rate_limited",
        message: "GitHub API rate limit nearly exhausted. Try again later.",
        retryAfter: rate.reset,
      },
      { status: 429, headers: rateHeaders(rate) },
    );
  }

  const repoJson = (await repoRes.json()) as {
    items: GitHubRepoSearchItem[];
    total_count?: number;
  };
  const repos = repoJson.items ?? [];
  const totalCount = repoJson.total_count ?? null;

  const rawFiles: {
    repository: string;
    branch: string;
    license: string | null;
    stars: number;
    path: string;
    format: FontFormat;
  }[] = [];

  for (const repo of repos) {
    if (rawFiles.length >= MAX_TREE_FONTS) break;
    const treeRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": "fontgrep" } },
    );
    if (!treeRes.ok) continue;
    const tree = (await treeRes.json()) as GitHubTreeResponse;
    const fonts = extractFontPaths(tree);
    for (const f of fonts) {
      if (rawFiles.length >= MAX_TREE_FONTS) break;
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

  let families = groupFonts(rawFiles);
  if (treasure) {
    families = filterTreasureFamilies(families);
  }
  const hasMore = repos.length === perPage;

  const payload = {
    families,
    hasMore,
    totalCount,
    reposFetched: repos.length,
    lane: "repos" as const,
    variant: 0,
  };

  if (families.length > 0) {
    setCached(ck, payload);
  }

  return NextResponse.json(
    {
      query,
      page,
      treasure,
      ...payload,
    },
    { headers: rateHeaders(rate) },
  );
}

async function fetchCodeSearch(query: string, perPage: number, page: number, token: string) {
  return fetch(githubSearchUrl(query, perPage, page), {
    headers: {
      Authorization: `Bearer ${token}`,
      "User-Agent": "fontgrep",
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });
}

function rateHeaders(rate: {
  remaining: number | null;
  reset: number | null;
  limit: number | null;
}) {
  const h: Record<string, string> = {};
  if (rate.remaining != null) h["x-ratelimit-remaining"] = String(rate.remaining);
  if (rate.limit != null) h["x-ratelimit-limit"] = String(rate.limit);
  if (rate.reset != null) h["x-ratelimit-reset"] = String(rate.reset);
  return h;
}