import type { FontFormat } from "@/types/fontDiscovery";

// Weight tokens -> numeric weight.
const WEIGHT_TOKENS: { token: string; weight: number }[] = [
  { token: "hairline", weight: 100 },
  { token: "thin", weight: 100 },
  { token: "ultralight", weight: 200 },
  { token: "extralight", weight: 200 },
  { token: "light", weight: 300 },
  { token: "book", weight: 400 },
  { token: "normal", weight: 400 },
  { token: "regular", weight: 400 },
  { token: "medium", weight: 500 },
  { token: "demibold", weight: 600 },
  { token: "semibold", weight: 600 },
  { token: "bold", weight: 700 },
  { token: "ultrabold", weight: 800 },
  { token: "extrabold", weight: 800 },
  { token: "black", weight: 900 },
  { token: "heavy", weight: 900 },
];

const STYLE_TOKENS: { token: string; style: string }[] = [
  { token: "italic", style: "italic" },
  { token: "oblique", style: "oblique" },
];

function splitStyleTokens(name: string): { base: string; weight: number; style: string } {
  let weight = 400;
  let style = "normal";
  let base = name;

  // Style detection (italic/oblique). Match as a standalone token OR a
  // camelCase suffix (e.g. "BoldItalic" -> "italic").
  for (const { token, style: s } of STYLE_TOKENS) {
    const re = new RegExp(`(^|[ _-])${token}([ _-]|$)`, "i");
    const reCamel = new RegExp(`${token}$`, "i");
    if (re.test(base) || reCamel.test(base)) {
      style = s;
      base = base.replace(new RegExp(`${token}`, "i"), "");
    }
  }

  // Weight detection. Same token-matching strategy.
  for (const { token, weight: w } of WEIGHT_TOKENS) {
    const re = new RegExp(`(^|[ _-])${token}([ _-]|$)`, "i");
    const reCamel = new RegExp(`${token}(?=[A-Z]|$)`, "i");
    if (re.test(base) || reCamel.test(base)) {
      weight = w;
      base = base.replace(new RegExp(`${token}`, "i"), "");
      break;
    }
  }

  // Clean up leftover separators and collapse spaces.
  base = base
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  return { base, weight, style };
}

export interface FontStyle {
  path: string;
  fileName: string;
  format: FontFormat;
  weight: number;
  style: string;
  /** Inferred family name (filename minus weight/style tokens). */
  family: string;
  /** Whether this is a variable font (single file with axes). */
  variable?: boolean;
  /** Branch the file lives on (added when merged into a ViewerFont). */
  branch?: string;
}

export interface DiscoveredFontFamily {
  family: string;
  repository: string;
  branch: string;
  license: string | null;
  stars: number;
  styles: FontStyle[];
}

/** Derive a family name + weight/style from a single font file path. */
export function inferFontInfo(fileName: string, format: FontFormat): FontStyle {
  const baseName = fileName.replace(/\.[^.]+$/, "");
  const { base, weight, style } = splitStyleTokens(baseName);
  const family = base.trim() === "" ? baseName : base.trim();
  return {
    path: fileName,
    fileName,
    format,
    weight,
    style,
    family,
    variable: format === "variable",
  };
}

/**
 * Group a flat list of discovered font files into families.
 * `files` come as { repository, branch, license, stars, path, format }.
 */
export function groupFonts(
  files: {
    repository: string;
    branch: string;
    license: string | null;
    stars: number;
    path: string;
    format: FontFormat;
  }[]
): DiscoveredFontFamily[] {
  const map = new Map<string, DiscoveredFontFamily>();

  for (const f of files) {
    const fileName = f.path.split("/").pop() ?? f.path;
    const info = inferFontInfo(fileName, f.format);
    const key = `${f.repository}::${info.family}`;

    let fam = map.get(key);
    if (!fam) {
      fam = {
        family: info.family,
        repository: f.repository,
        branch: f.branch,
        license: f.license,
        stars: f.stars,
        styles: [],
      };
      map.set(key, fam);
    }
    fam.styles.push({
      path: f.path,
      fileName,
      format: f.format,
      weight: info.weight,
      style: info.style,
      family: info.family,
      variable: f.format === "variable",
    });
  }

  // Sort styles: weight asc, then regular before italic.
  const out = Array.from(map.values());
  for (const fam of out) {
    fam.styles.sort((a, b) => {
      if (a.weight !== b.weight) return a.weight - b.weight;
      if (a.style !== b.style) return a.style === "normal" ? -1 : 1;
      return 0;
    });
  }

  return Array.from(map.values()).sort((a, b) => a.family.localeCompare(b.family));
}

/** Prefer upright cuts for grid/card previews (never italic/oblique when a normal cut exists). */
export function pickGridPreviewStyle(styles: FontStyle[]): FontStyle | undefined {
  if (!styles.length) return undefined;
  const upright = styles.filter((s) => s.style === "normal");
  return (
    upright.find((s) => s.weight === 400) ??
    upright[0] ??
    styles.find((s) => s.weight === 400) ??
    styles[0]
  );
}

/** Human-readable style label, e.g. "Bold", "Bold Italic", "Regular". */
export function styleLabel(style: FontStyle): string {
  if (style.variable) return "Variable";
  const parts: string[] = [];
  if (style.weight !== 400) parts.push(weightName(style.weight));
  if (style.style === "italic") parts.push("Italic");
  if (style.style === "oblique") parts.push("Oblique");
  if (parts.length === 0) parts.push("Regular");
  return parts.join(" ");
}

const WEIGHT_NAMES: Record<number, string> = {
  100: "Thin",
  200: "ExtraLight",
  300: "Light",
  400: "Regular",
  500: "Medium",
  600: "SemiBold",
  700: "Bold",
  800: "ExtraBold",
  900: "Black",
};

export function weightName(weight: number): string {
  return WEIGHT_NAMES[weight] ?? String(weight);
}

/** Max characters in the bento card hero line before we shorten further. */
export const GRID_PREVIEW_NAME_MAX = 14;

const GRID_NAME_SUFFIX_RE =
  /\s+(subset\s*\d*|subsets?|vf|variable|static|instances?|fonts?|files?|package|pack)\s*$/i;

/**
 * Shorten family names for the large card preview — keeps the name, drops junk
 * suffixes like "subset 11", then fits whole words or truncates runaway tokens.
 */
export function gridCardPreviewText(fontName: string): string {
  let name = fontName.trim().replace(/\s+/g, " ");
  if (!name) return fontName;

  name = name.replace(GRID_NAME_SUFFIX_RE, "").trim();
  if (name.length <= GRID_PREVIEW_NAME_MAX) return name;

  const words = name.split(/\s+/);
  let fitted = "";
  for (const word of words) {
    const next = fitted ? `${fitted} ${word}` : word;
    if (next.length > GRID_PREVIEW_NAME_MAX) break;
    fitted = next;
  }
  if (fitted) return fitted;

  const token = words[0] ?? name;
  if (token.length <= GRID_PREVIEW_NAME_MAX) return token;

  return `${token.slice(0, GRID_PREVIEW_NAME_MAX - 1)}…`;
}

/** Scale hero type down when the rendered preview string is still long. */
export function gridPreviewTypeClass(displayText: string, recipe: string): string {
  const len = displayText.replace(/…$/, "").length;
  if (len <= 14) return recipe;
  const compact =
    len <= 18
      ? "text-[clamp(2rem,4.2vw,3.2rem)] leading-[0.9]"
      : "text-[clamp(1.55rem,3.4vw,2.55rem)] leading-[0.92]";
  return `${recipe
    .replace(/text-\[clamp\([^)]+\)\]/, "")
    .replace(/leading-\[[^\]]+\]|leading-none/, "")
    .replace(/\s+/g, " ")
    .trim()} ${compact}`;
}
