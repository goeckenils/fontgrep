import { NextResponse } from "next/server";
import { cssFontFormat, resolvePreviewFormat } from "@/lib/fontPreview";
import { fetchGithubFontBytes } from "@/lib/githubFontFetch";

export const dynamic = "force-dynamic";

/**
 * Proxies a font binary from GitHub with permissive CORS headers.
 * Fallback when /api/fonts/preview fails on the client.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  const p = searchParams.get("path");
  const branch = searchParams.get("branch");

  if (!repo || !p) {
    return NextResponse.json({ error: "repo and path are required" }, { status: 400 });
  }

  const hit = await fetchGithubFontBytes(repo, p, branch);
  if (!hit) {
    return NextResponse.json({ error: "Upstream fetch failed" }, { status: 404 });
  }

  const format = resolvePreviewFormat(searchParams.get("format") ?? undefined, p);
  return new NextResponse(hit.bytes, {
    status: 200,
    headers: {
      "Content-Type": format
        ? `font/${cssFontFormat(format, p)}`
        : "application/octet-stream",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": "public, max-age=3600",
    },
  });
}