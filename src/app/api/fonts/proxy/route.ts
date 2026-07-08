import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const ALLOWED_HOSTS = new Set(["raw.githubusercontent.com", "github.com"]);

/**
 * Proxies a font binary from GitHub with permissive CORS headers.
 * Used when @font-face cannot load directly from raw.githubusercontent.com.
 *   GET /api/fonts/proxy?repo=owner/repo&path=fonts/Inter.woff2&branch=main
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repo = searchParams.get("repo");
  const p = searchParams.get("path");
  const branch = searchParams.get("branch") || "main";

  if (!repo || !p) {
    return NextResponse.json({ error: "repo and path are required" }, { status: 400 });
  }

  const url = `https://raw.githubusercontent.com/${repo}/${branch}/${p}`;
  try {
    const res = await fetch(url, { headers: { "User-Agent": "fontgrep" } });
    if (!res.ok) {
      return NextResponse.json({ error: "Upstream fetch failed" }, { status: res.status });
    }
    const buf = await res.arrayBuffer();
    const contentType = res.headers.get("content-type") || "font/woff2";
    return new NextResponse(buf, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "public, max-age=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "proxy fetch failed" }, { status: 502 });
  }
}
