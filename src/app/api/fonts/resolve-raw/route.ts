import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Resolves the working raw.githubusercontent.com URL for a font when the branch
 * is unknown (e.g. search results only provide repo + path).
 *   GET /api/fonts/resolve-raw?repo=owner/repo&path=fonts/Inter.woff2
 * Returns { rawUrl, branch } or 404.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  const p = searchParams.get("path");

  if (!repo || !p) {
    return NextResponse.json({ error: "repo and path are required" }, { status: 400 });
  }

  for (const branch of ["main", "master"]) {
    const url = `https://raw.githubusercontent.com/${repo}/${branch}/${p}`;
    try {
      const res = await fetch(url, { method: "HEAD", headers: { "User-Agent": "fontgrep" } });
      if (res.ok) {
        return NextResponse.json({ rawUrl: url, branch });
      }
    } catch {
      /* try next */
    }
  }

  return NextResponse.json({ error: "Could not resolve font URL" }, { status: 404 });
}
