import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { deleteFont } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const numericId = Number(id);
  if (!Number.isInteger(numericId)) {
    return NextResponse.json({ error: "Invalid id" }, { status: 400 });
  }

  const row = deleteFont(numericId);
  if (!row) {
    return NextResponse.json({ error: "Font not found" }, { status: 404 });
  }

  // Best-effort file removal.
  try {
    await fs.unlink(row.local_path);
  } catch {
    /* already gone */
  }
  try {
    if (row.public_path) {
      const p = path.join(process.cwd(), "public", row.public_path);
      await fs.unlink(p);
    }
  } catch {
    /* already gone */
  }

  return NextResponse.json({ ok: true });
}
