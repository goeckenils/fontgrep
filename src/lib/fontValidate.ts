// Magic bytes for common font formats.
const FONT_MAGIC_BYTES: Record<string, number[]> = {
  ttf: [0x00, 0x01, 0x00, 0x00], // TrueType (or with 0x0100, but 00 01 00 00 covers most)
  otf: [0x4f, 0x54, 0x54, 0x4f], // "OTTO" (CFF-based OpenType)
  woff: [0x77, 0x4f, 0x46, 0x46], // "wOFF"
  woff2: [0x77, 0x4f, 0x46, 0x32], // "wOF2"
  eot: [0x4c, 0x50], // EOT starts (loose)
};

const TRUE_TYPE_OTTO = [0x00, 0x01, 0x00, 0x00];

export function detectFontMagic(buffer: Buffer): string | null {
  const head = buffer.subarray(0, 4);
  for (const [format, magic] of Object.entries(FONT_MAGIC_BYTES)) {
    if (head.length >= magic.length && magic.every((b, i) => head[i] === b)) {
      return format;
    }
  }
  // TrueType has a variable second byte; accept 00 01 00 00 family only.
  if (
    head.length >= 4 &&
    head[0] === TRUE_TYPE_OTTO[0] &&
    head[1] === TRUE_TYPE_OTTO[1] &&
    head[2] === TRUE_TYPE_OTTO[2]
  ) {
    return "ttf";
  }
  return null;
}

export interface ValidationResult {
  valid: boolean;
  detectedFormat?: string;
  error?: string;
}

export function validateFontFile(
  buffer: Buffer,
  format: string,
  maxSizeBytes = 50 * 1024 * 1024
): ValidationResult {
  if (buffer.byteLength > maxSizeBytes) {
    return {
      valid: false,
      error: `Font file exceeds the ${Math.round(maxSizeBytes / (1024 * 1024))}MB size limit.`,
    };
  }
  const detected = detectFontMagic(buffer);
  if (!detected) {
    return {
      valid: false,
      error: "Downloaded file is not a recognized font binary (magic-byte check failed).",
    };
  }
  // For woff2/woff/otf/ttf compare to declared format when declared is a known font type.
  const declared = String(format || "").toLowerCase();
  const known = ["ttf", "otf", "woff", "woff2", "eot"];
  if (known.includes(declared) && detected !== declared) {
    // Many .ttf also serialize as OTF containers; treat otf<->ttf as compatible.
    if (!(declared === "ttf" && detected === "otf") && !(declared === "otf" && detected === "ttf")) {
      return {
        valid: false,
        detectedFormat: detected,
        error: `Declared format "${declared}" does not match detected "${detected}".`,
      };
    }
  }
  return { valid: true, detectedFormat: detected };
}
