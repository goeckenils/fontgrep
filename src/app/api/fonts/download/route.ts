import { NextResponse } from "next/server";
import path from "node:path";
import fs from "node:fs/promises";
import { randomUUID } from "node:crypto";
import { getFontsBySourceUrl, insertFont, FONTS_DIR_PATH } from "@/lib/db";
import { validateFontFile } from "@/lib/fontValidate";
import { parseFontBuffer } from "@/lib/fontMeta";
import type { FontFormat } from "@/types/fontDiscovery";

export const dynamic = "force-dynamic";

const MAX_FONT_SIZE_MB = Number(process.env.MAX_FONT_SIZE_MB) || 50;

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

  const fetched = await fetchFont(body.repository, body.path);
  if (!fetched) {
    return NextResponse.json(
      { error: "Could not download font file from GitHub" },
      { status: 502 }
    );
  }

  // Use the actual branch that fetchFont resolved, not hardcoded "main" (fixes master-branch dedup).
  const sourceUrl = `https://github.com/${body.repository}/blob/${fetched.branch}/${body.path}`;
  const existing = getFontsBySourceUrl(sourceUrl);
  if (existing) {
    return NextResponse.json({
      id: existing.id,
      alreadyExists: true,
      publicPath: existing.public_path,
    });
  }

  const buf = Buffer.from(await fetched.res.arrayBuffer());

  const validation = validateFontFile(buf, body.format ?? "unknown", MAX_FONT_SIZE_MB * 1024 * 1024);
  if (!validation.valid) {
    const status = validation.error?.includes("size limit") ? 413 : 415;
    return NextResponse.json({ error: validation.error }, { status });
  }

  const ext = EXT_BY_FORMAT[body.format ?? "unknown"];
  const fileName = `${randomUUID()}.${ext}`;
  const localPath = path.join(FONTS_DIR_PATH, fileName);
  const publicPath = `/fonts/${fileName}`;
  await fs.writeFile(localPath, buf);

  // Parse metadata from the downloaded binary.
  const meta = parseFontBuffer(buf);

  const row = insertFont({
    family: body.fileName ?? body.path.split("/").pop() ?? "unknown",
    source_url: sourceUrl,
    local_path: localPath,
    public_path: publicPath,
    format: body.format ?? "unknown",
    license: body.license ?? null,
    real_family: meta.family ?? null,
    weight: meta.weight ?? null,
    style: meta.style ?? null,
    is_variable: meta.isVariable,
    designer: meta.designer ?? null,
  });

  return NextResponse.json({
    id: row.id,
    family: row.family,
    format: row.format,
    publicPath: row.public_path,
    alreadyExists: false,
    metadata: {
      realFamily: meta.family,
      weight: meta.weight,
      style: meta.style,
      isVariable: meta.isVariable,
      designer: meta.designer,
      axes: meta.axes,
    },
  });
}
