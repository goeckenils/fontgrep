import { NextResponse } from "next/server";
import { getFontById, FONTS_DIR_PATH } from "@/lib/db";
import { parseFontBuffer } from "@/lib/fontMeta";
import fs from "node:fs/promises";
import path from "node:path";

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

  // 2) Remote URL straight to parser.
  if (!buf && body.rawUrl) {
    try {
      const res = await fetch(body.rawUrl, { headers: { "User-Agent": "fontgrep" } });
      if (res.ok) buf = Buffer.from(await res.arrayBuffer());
    } catch {
      buf = null;
    }
  }

  // 3) repo/path/branch -> probe main/master.
  if (!buf && body.repo && body.path) {
    for (const branch of [body.branch || "main", "master", "main"]) {
      if (branch === body.branch) continue;
      const url = `https://raw.githubusercontent.com/${body.repo}/${branch}/${body.path}`;
      try {
        const res = await fetch(url, { headers: { "User-Agent": "fontgrep" } });
        if (res.ok) {
          buf = Buffer.from(await res.arrayBuffer());
          break;
        }
      } catch {
        /* try next */
      }
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
  });
}
