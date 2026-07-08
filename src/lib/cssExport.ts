export interface CssExportInput {
  family: string;
  format: string;
  weight?: number;
  style?: "normal" | "italic" | "oblique";
  srcUrl: string; // resolved URL to the font binary
  isVariable?: boolean;
  variationSettings?: Record<string, number>; // for variable fonts
}

function formatKeyword(format: string, isVariable?: boolean): string {
  if (isVariable) return "woff2-variations";
  switch (format.toLowerCase()) {
    case "woff2":
      return "woff2";
    case "woff":
      return "woff";
    case "otf":
      return "opentype";
    case "ttf":
      return "truetype";
    case "svg":
      return "svg";
    case "eot":
      return "embedded-opentype";
    default:
      return "truetype";
  }
}

/** Generate a ready-to-paste @font-face CSS rule. */
export function buildFontFaceCss(input: CssExportInput): string {
  const {
    family,
    format,
    weight = 400,
    style = "normal",
    srcUrl,
    isVariable = false,
    variationSettings,
  } = input;

  const kw = formatKeyword(format, isVariable);
  const weightDecl = isVariable ? "100 900" : String(weight);

  let css = `@font-face {\n`;
  css += `  font-family: '${family}';\n`;
  css += `  src: url('${srcUrl}') format('${kw}');\n`;
  css += `  font-weight: ${weightDecl};\n`;
  css += `  font-style: ${style};\n`;
  css += `  font-display: swap;\n`;

  if (isVariable && variationSettings && Object.keys(variationSettings).length > 0) {
    const settings = Object.entries(variationSettings)
      .map(([tag, val]) => `'${tag}' ${val}`)
      .join(", ");
    css += `  font-variation-settings: ${settings};\n`;
  }

  css += `}`;
  return css;
}
