import { detectFontFormat } from "@/lib/githubFontSearch";
import type { FontFormat } from "@/types/fontDiscovery";

const PREVIEWABLE_FORMATS = new Set<FontFormat>([
  "ttf",
  "otf",
  "woff",
  "woff2",
  "variable",
]);

export function isPreviewableFontFormat(format: string): format is FontFormat {
  return PREVIEWABLE_FORMATS.has(format as FontFormat);
}

export function resolvePreviewFormat(
  format: string | undefined,
  path?: string,
): FontFormat | null {
  if (format && isPreviewableFontFormat(format)) return format;
  if (!path) return null;
  const detected = detectFontFormat(path);
  return isPreviewableFontFormat(detected) ? detected : null;
}

export function previewFontFamilyId(
  repository?: string,
  path?: string,
  publicPath?: string,
): string {
  const key = publicPath ?? `${repository ?? ""}::${path ?? ""}`;
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return `fg-${hash.toString(36)}`;
}

export function cssFontFormat(format: string, path?: string): string {
  if (format === "woff2") return "woff2";
  if (format === "woff") return "woff";
  if (format === "otf" || path?.toLowerCase().endsWith(".otf"))
    return "opentype";
  return "truetype";
}

export function fontPreviewUrl(font: {
  repository?: string;
  branch?: string;
  path?: string;
  format?: string;
}): string | null {
  const resolved = resolvePreviewFormat(font.format, font.path);
  if (!font.repository || !font.path || !resolved) return null;

  const params = new URLSearchParams({
    repository: font.repository,
    path: font.path,
    format: resolved,
  });

  if (font.branch) params.set("branch", font.branch);

  return `/api/fonts/preview?${params.toString()}`;
}

/** Client-loadable URL for FontFace — never raw GitHub (CORS-blocked). */
export function resolveViewerFontUrl(font: {
  publicPath?: string | null;
  rawUrl?: string | null;
  repository?: string;
  branch?: string;
  path?: string;
  format?: string;
}): string | null {
  if (font.publicPath) return font.publicPath;
  const preview = fontPreviewUrl(font);
  if (preview) return preview;
  if (font.repository && font.path) {
    const params = new URLSearchParams({
      repo: font.repository,
      path: font.path,
    });
    if (font.branch) params.set("branch", font.branch);
    return `/api/fonts/proxy?${params.toString()}`;
  }
  return null;
}