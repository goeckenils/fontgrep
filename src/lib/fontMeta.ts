import * as fontkit from "fontkit";

export interface VariableAxis {
  tag: string; // 'wght', 'wdth', 'slnt', 'ital', 'opsz'
  name: string; // 'Weight', 'Width', ...
  min: number;
  max: number;
  default: number;
}

export interface FontMetadata {
  family: string | null;
  subfamily: string | null;
  fullName: string | null;
  postscriptName: string | null;
  copyright: string | null;
  designer: string | null;
  weight: number | null; // OS/2 weight class
  style: "normal" | "italic" | "oblique" | null;
  isVariable: boolean;
  axes: VariableAxis[];
}

// fontkit ships no types, so we describe the slice we use.
type FontNameTable = { get?: (id: number) => unknown; records?: Record<number, { toString(): string }> };
type FontAxis = { min?: number; max?: number; default?: number };
interface FontLike {
  name?: FontNameTable;
  fullName?: string;
  familyName?: string;
  subfamilyName?: string;
  postscriptName?: string;
  "OS/2"?: { usWeightClass?: number; fsSelection?: number };
  variationAxes?: Record<string, FontAxis>;
}

const AXIS_NAMES: Record<string, string> = {
  wght: "Weight",
  wdth: "Width",
  slnt: "Slant",
  ital: "Italic",
  opsz: "Optical Size",
};

function getFontName(font: FontLike, nameId: number): string | null {
  try {
    const name = font.name?.get?.(nameId);
    if (name) return String(name);
    const rec = font.name?.records?.[nameId];
    if (rec?.toString) return rec.toString();
  } catch {
    /* noop */
  }
  return null;
}

/** Parse a font binary (Buffer) and return normalized metadata. */
export function parseFontBuffer(buffer: Buffer): FontMetadata {
  let font: FontLike;
  try {
    font = fontkit.create(buffer) as unknown as FontLike;
  } catch {
    return emptyMeta();
  }

  const fullName = getFontName(font, 1) ?? font.fullName ?? null;
  const family = getFontName(font, 16) ?? getFontName(font, 1) ?? font.familyName ?? null;
  const subfamily = getFontName(font, 2) ?? font.subfamilyName ?? null;
  const postscriptName = getFontName(font, 6) ?? font.postscriptName ?? null;
  const copyright = getFontName(font, 0) ?? null;
  const designer = getFontName(font, 9) ?? null;

  const weight: number | null =
    typeof font["OS/2"]?.usWeightClass === "number" ? font["OS/2"].usWeightClass : null;
  const fsSelection = font["OS/2"]?.fsSelection;
  let style: FontMetadata["style"] = "normal";
  if (typeof fsSelection === "number") {
    if (fsSelection & 0x1) style = "italic";
    else if (fsSelection & 0x200) style = "oblique";
  }

  const isVariable = Boolean(font.variationAxes && Object.keys(font.variationAxes).length > 0);
  const axes: VariableAxis[] = [];
  if (isVariable && font.variationAxes) {
    for (const [tag, axis] of Object.entries(font.variationAxes)) {
      axes.push({
        tag,
        name: AXIS_NAMES[tag] ?? tag,
        min: axis.min ?? 0,
        max: axis.max ?? 1000,
        default: axis.default ?? axis.min ?? 0,
      });
    }
  }

  return {
    fullName,
    family,
    subfamily,
    postscriptName,
    copyright,
    designer,
    weight: weight && weight > 0 ? weight : 400,
    style,
    isVariable,
    axes,
  };
}

export function emptyMeta(): FontMetadata {
  return {
    family: null,
    subfamily: null,
    fullName: null,
    postscriptName: null,
    copyright: null,
    designer: null,
    weight: 400,
    style: "normal",
    isVariable: false,
    axes: [],
  };
}
