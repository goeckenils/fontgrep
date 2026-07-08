import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import { getFontById } from "@/lib/db";

export const dynamic = "force-dynamic";

const CONTENT_TYPE: Record<string, string> = {
  ttf: "font/ttf",
  otf: "font/otf",
  woff: "font/woff",
  woff2: "font/woff2",
  eot: "application/vnd.ms-fontobject",
  svg: "image/svg+xml",
};

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const fontId = Number(id);
  if (!Number.isInteger(fontId)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const row = getFontById(fontId);
  if (!row) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  try {
    const buf = await fs.readFile(row.local_path);
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": CONTENT_TYPE[row.format] ?? "application/octet-stream",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return NextResponse.json({ error: "file missing on disk" }, { status: 404 });
  }
}
