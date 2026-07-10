import { NextResponse } from "next/server";
import { cssFontFormat, resolvePreviewFormat } from "@/lib/fontPreview";
import { fetchGithubFontBytes } from "@/lib/githubFontFetch";

export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<string, string> = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  variable: "font/ttf",
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const repository = searchParams.get("repository");
  const path = searchParams.get("path");
  const branch = searchParams.get("branch");
  const format = resolvePreviewFormat(
    searchParams.get("format") ?? undefined,
    path ?? undefined,
  );

  if (!repository || !path || !format) {
    return NextResponse.json(
      { error: "invalid preview request" },
      { status: 400 },
    );
  }

  const hit = await fetchGithubFontBytes(repository, path, branch);
  if (!hit) {
    return NextResponse.json(
      { error: "font preview unavailable" },
      { status: 404 },
    );
  }

  return new NextResponse(hit.bytes, {
    status: 200,
    headers: {
      "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
      "Content-Type":
        CONTENT_TYPE[format] ?? `font/${cssFontFormat(format, path)}`,
      "Access-Control-Allow-Origin": "*",
    },
  });
}