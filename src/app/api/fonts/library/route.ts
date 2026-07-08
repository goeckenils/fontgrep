import { NextResponse } from "next/server";
import { getAllFonts, type FontRow } from "@/lib/db";

export const dynamic = "force-dynamic";

export interface LibraryFont {
  id: number;
  family: string;
  realFamily: string | null;
  weight: number | null;
  style: string | null;
  isVariable: boolean;
  designer: string | null;
  format: string;
  license: string | null;
  publicPath: string | null;
  downloadedAt: string;
}

function toLibraryFont(row: FontRow): LibraryFont {
  return {
    id: row.id,
    family: row.family,
    realFamily: row.real_family,
    weight: row.weight,
    style: row.style,
    isVariable: Boolean(row.is_variable),
    designer: row.designer,
    format: row.format,
    license: row.license,
    publicPath: row.public_path,
    downloadedAt: row.downloaded_at,
  };
}

export async function GET() {
  const fonts = getAllFonts().map(toLibraryFont);
  return NextResponse.json({ fonts });
}
