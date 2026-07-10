export function hashString(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i++) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0;
  }
  return hash;
}

export type AgencyPinLayout =
  | "monolith"
  | "poster"
  | "cascade"
  | "bleed"
  | "marginalia"
  | "grid"
  | "stamp"
  | "vertical";

const HERO_GLYPHS = ["A", "G", "Q", "R", "M", "ß", "∞", "Ж"];
const PHRASE_SAMPLES = [
  "The quick brown fox",
  "sphinx of black quartz",
  "pack my box with five",
  "judge my vow",
  "hamburgefonts",
  "wild display type",
];

const LAYOUTS: AgencyPinLayout[] = [
  "poster",
  "monolith",
  "cascade",
  "bleed",
  "marginalia",
  "grid",
  "stamp",
  "vertical",
];

export interface AgencyPinVariant {
  layout: AgencyPinLayout;
  sample: string;
  secondary?: string;
  specimenIndex: string;
  accent: "primary" | "inverse" | "accent" | "void";
  rotate: number;
  scale: number;
  tracking: string;
  stroke: boolean;
}

export function discoverPinVariant(
  familyKey: string,
  previewText: string,
  styleCount = 1,
): AgencyPinVariant {
  const h = hashString(familyKey);
  const layout = LAYOUTS[h % LAYOUTS.length];
  const accents: AgencyPinVariant["accent"][] = [
    "primary",
    "inverse",
    "accent",
    "void",
  ];
  const accent = accents[h % accents.length];

  const familyName = familyKey.split("::").pop() ?? previewText;
  const hero = HERO_GLYPHS[h % HERO_GLYPHS.length];

  const samples: Record<AgencyPinLayout, string> = {
    monolith: hero,
    poster: hero,
    cascade: previewText.length > 28 ? `${previewText.slice(0, 28)}…` : previewText,
    bleed: PHRASE_SAMPLES[h % PHRASE_SAMPLES.length],
    marginalia: familyName.slice(0, 24),
    grid: "Aa Bb Cc Dd",
    stamp: previewText,
    vertical: familyName.slice(0, 16),
  };

  const rotations = [-14, -8, -4, 0, 3, 6, 9, -11];
  const scales = [1, 1.05, 1.1, 0.95, 1.15, 1.02];
  const trackings = ["-0.06em", "-0.02em", "0em", "0.04em", "0.12em", "0.2em"];

  return {
    layout,
    sample: samples[layout],
    secondary:
      layout === "marginalia"
        ? `${styleCount} cut${styleCount === 1 ? "" : "s"} · ${PHRASE_SAMPLES[(h + 2) % PHRASE_SAMPLES.length]}`
        : layout === "cascade"
          ? hero.repeat(2)
          : undefined,
    specimenIndex: String((h % 899) + 100),
    accent,
    rotate: rotations[h % rotations.length],
    scale: scales[h % scales.length],
    tracking: trackings[h % trackings.length],
    stroke: h % 3 === 0,
  };
}