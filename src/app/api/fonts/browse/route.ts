import { NextResponse } from "next/server";
import { CURATED_FONTS, type FontCategory } from "@/lib/curated-fonts";
import { EXCLUDED_FONT_NAMES } from "@/lib/exclude-fonts";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const category = searchParams.get("category");
  const exclude = searchParams.get("exclude") !== "0"; // default: exclude pre-installed

  let fonts = CURATED_FONTS;

  if (category && category !== "all") {
    fonts = fonts.filter((f) => f.category === (category as FontCategory));
  }

  if (exclude) {
    fonts = fonts.filter((f) => !EXCLUDED_FONT_NAMES.has(f.name.toLowerCase()));
  }

  const excluded = CURATED_FONTS.filter((f) =>
    EXCLUDED_FONT_NAMES.has(f.name.toLowerCase()),
  ).length;

  return NextResponse.json({
    fonts,
    total: fonts.length,
    excludedFromCurated: exclude ? excluded : 0,
  });
}
