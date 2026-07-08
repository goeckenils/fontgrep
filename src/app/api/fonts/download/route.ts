import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import {
  getFontsBySourceUrl,
  insertFont,
  FONTS_DIR_PATH,
} from "@/lib/db";
import type { FontFormat } from "@/types/fontDiscovery";

export const dynamic = "force-dynamic";

const EXT_BY_FORMAT: Record<string, string> = {
  ttf: "ttf",
  otf: "otf",
  woff: "woff",
  woff2: "woff2",
  eot: "eot",
  svg: "svg",
  variable: "ttf",
  unknown: "ttf",
};

function rawUrl(repo: string, branch: string, filePath: string): string {
  return `https://raw.githubusercontent.com/${repo}/${branch}/${filePath}`;
}

async function fetchFont(repo: string, filePath: string) {
  // Probe both common default branches; GitHub code search doesn't return the branch.
  for (const branch of ["main", "master"]) {
    const url = rawUrl(repo, branch, filePath);
    const res = await fetch(url, { headers: { "User-Agent": "fontgrep" } });
    if (res.ok) return { res, url, branch };
  }
  return null;
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    repository?: string;
    path?: string;
    fileName?: string;
    format?: FontFormat;
    license?: string;
  } | null;

  if (!body?.repository || !body?.path) {
    return NextResponse.json({ error: "repository and path are required" }, { status: 400 });
  }

  const sourceUrl = `https://github.com/${body.repository}/blob/main/${body.path}`;
  const existing = getFontsBySourceUrl(sourceUrl);
  if (existing) {
    return NextResponse.json({
      id: existing.id,
      alreadyExists: true,
      publicPath: existing.public_path,
    });
  }

  const fetched = await fetchFont(body.repository, body.path);
  if (!fetched) {
    return NextResponse.json(
      { error: "Could not download font file from GitHub" },
      { status: 502 }
    );
  }

  const ext = EXT_BY_FORMAT[body.format ?? "unknown"];
  const fileName = `${randomUUID()}.${ext}`;
  const localPath = path.join(FONTS_DIR_PATH, fileName);
  const publicPath = `/fonts/${fileName}`;
  const buf = Buffer.from(await fetched.res.arrayBuffer());
  await fs.writeFile(localPath, buf);

  const row = insertFont({
    family: body.fileName ?? body.path.split("/").pop() ?? "unknown",
    source_url: sourceUrl,
    local_path: localPath,
    public_path: publicPath,
    format: body.format ?? "unknown",
    license: body.license ?? null,
  });

  return NextResponse.json({
    id: row.id,
    family: row.family,
    format: row.format,
    publicPath: row.public_path,
    alreadyExists: false,
  });
}
