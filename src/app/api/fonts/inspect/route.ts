import { NextResponse } from "next/server";
import { getFontById } from "@/lib/db";
import { isValidFontBuffer } from "@/lib/fontBytes";
import { parseFontBuffer } from "@/lib/fontMeta";
import { fetchGithubFontBytes } from "@/lib/githubFontFetch";
import fs from "node:fs/promises";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    id?: number;
    rawUrl?: string;
    repo?: string;
    path?: string;
    branch?: string;
  } | null;

  if (!body) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  let buf: Buffer | null = null;
  let resolvedBranch: string | null = null;

  // 1) Already-saved font: read from disk.
  if (typeof body.id === "number") {
    const row = getFontById(body.id);
    if (row?.local_path) {
      try {
        buf = await fs.readFile(row.local_path);
      } catch {
        buf = null;
      }
    }
  }

  // 2) repo/path/branch — validated GitHub fetch.
  if (!buf && body.repo && body.path) {
    const hit = await fetchGithubFontBytes(body.repo, body.path, body.branch ?? null);
    if (hit) {
      buf = Buffer.from(hit.bytes);
      resolvedBranch = hit.resolvedBranch;
    }
  }

  // 3) Remote URL fallback.
  if (!buf && body.rawUrl) {
    try {
      const res = await fetch(body.rawUrl, { headers: { "User-Agent": "fontgrep" } });
      if (res.ok) {
        const candidate = Buffer.from(await res.arrayBuffer());
        if (isValidFontBuffer(candidate)) buf = candidate;
      }
    } catch {
      buf = null;
    }
  }

  if (!buf) {
    return NextResponse.json(
      { error: "Could not load font binary for inspection" },
      { status: 502 }
    );
  }

  const meta = parseFontBuffer(buf);
  let publicPath: string | null = null;
  if (typeof body.id === "number") {
    const row = getFontById(body.id);
    publicPath = row?.public_path ?? null;
  }

  return NextResponse.json({
    family: meta.family,
    subfamily: meta.subfamily,
    fullName: meta.fullName,
    postscriptName: meta.postscriptName,
    copyright: meta.copyright,
    designer: meta.designer,
    weight: meta.weight,
    style: meta.style,
    isVariable: meta.isVariable,
    axes: meta.axes,
    publicPath,
    resolvedBranch,
  });
}
