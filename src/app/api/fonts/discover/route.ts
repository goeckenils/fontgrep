import { NextResponse } from "next/server";
import {
  githubRepoSearchUrl,
  extractFontPaths,
  type GitHubRepoSearchItem,
  type GitHubTreeResponse,
} from "@/lib/githubFontSearch";

export const dynamic = "force-dynamic";

const PER_PAGE = 5; // repos per page
const MAX_FONTS = 30; // cap fonts returned per request

export interface DiscoveredFont {
  repository: string;
  branch: string;
  path: string;
  format: string;
  license: string | null;
  family: string;
}

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

  const repoRes = await fetch(githubRepoSearchUrl(query, page, PER_PAGE), {
    headers: { Authorization: `Bearer ${token}`, "User-Agent": "fontgrep" },
  });
  if (!repoRes.ok) {
    return NextResponse.json(
      { error: "github_repo_search_failed", status: repoRes.status },
      { status: 502 }
    );
  }
  const repoJson = (await repoRes.json()) as { items: GitHubRepoSearchItem[] };
  const repos = repoJson.items ?? [];

  const discovered: DiscoveredFont[] = [];
  for (const repo of repos) {
    if (discovered.length >= MAX_FONTS) break;
    const treeRes = await fetch(
      `https://api.github.com/repos/${repo.full_name}/git/trees/${repo.default_branch}?recursive=1`,
      { headers: { Authorization: `Bearer ${token}`, "User-Agent": "fontgrep" } }
    );
    if (!treeRes.ok) continue;
    const tree = (await treeRes.json()) as GitHubTreeResponse;
    const fonts = extractFontPaths(tree);
    for (const f of fonts) {
      if (discovered.length >= MAX_FONTS) break;
      discovered.push({
        repository: repo.full_name,
        branch: repo.default_branch,
        path: f.path,
        format: f.format,
        license: repo.license?.spdx_id ?? null,
        family: f.path.split("/").pop() ?? f.path,
      });
    }
  }

  return NextResponse.json({
    query,
    page,
    fonts: discovered,
    hasMore: repos.length === PER_PAGE,
  });
}
