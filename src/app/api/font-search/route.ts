import { NextResponse } from "next/server";
import { buildGitHubFontQuery, githubSearchUrl, normalizeGitHubItem } from "@/lib/githubFontSearch";
import type { FontSearchInput, GitHubCodeSearchItem } from "@/types/fontDiscovery";

export async function POST(request: Request) {
  try {
    const input = (await request.json()) as FontSearchInput;
    const query = buildGitHubFontQuery(input);
    const token = process.env.GITHUB_TOKEN;
    const response = await fetch(githubSearchUrl(query, input.limit), {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      next: { revalidate: 60 },
    });

    if (!response.ok) {
      const detail = await response.text();
      if (response.status === 401) {
        return NextResponse.json(
          {
            error: "github_auth_required",
            message:
              "GitHub rejected the request. Set GITHUB_TOKEN in your .env (a fine-grained or classic PAT) to enable search.",
          },
          { status: 401 },
        );
      }
      return NextResponse.json(
        { error: "github_search_failed", status: response.status, detail },
        { status: response.status },
      );
    }

    const data = (await response.json()) as { total_count: number; items: GitHubCodeSearchItem[] };
    return NextResponse.json({
      query,
      totalCount: data.total_count,
      results: data.items.map(normalizeGitHubItem),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown_error";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
