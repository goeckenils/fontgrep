import { clusterFamilyKey, dedupeFamiliesByCluster } from "@/lib/fontCluster";
import type { DiscoveredFontFamily, FontStyle } from "@/lib/fontFamily";

export { clusterFamilyKey };

export type DiscoverSort = "relevance" | "name" | "stars" | "hidden_gems";

export interface DiscoverFilters {
  hideMegaRepos: boolean;
  hideCommonFonts: boolean;
  hideIconFonts: boolean;
  hideJunkNames: boolean;
  dedupeByFamily: boolean;
  indieOnly: boolean;
}

/** Default Treasure mode: indie long-tail, not Google Fonts / FA mirrors. */
export const TREASURE_DISCOVER_FILTERS: DiscoverFilters = {
  hideMegaRepos: true,
  hideCommonFonts: true,
  hideIconFonts: true,
  hideJunkNames: true,
  dedupeByFamily: true,
  indieOnly: true,
};

export const DEFAULT_DISCOVER_FILTERS = TREASURE_DISCOVER_FILTERS;

export const POPULAR_DISCOVER_FILTERS: DiscoverFilters = {
  hideMegaRepos: false,
  hideCommonFonts: false,
  hideIconFonts: false,
  hideJunkNames: false,
  dedupeByFamily: false,
  indieOnly: false,
};

export const DEFAULT_DISCOVER_SORT: DiscoverSort = "hidden_gems";

export const DISCOVER_REPOS_PER_PAGE = 15;
export const MAX_AUTO_LOAD_PAGES = 30;
export const MIN_VISIBLE_BEFORE_AUTO_LOAD = 8;

/** Star cap when "indie only" is enabled — drops mega-popular repos. */
export const INDIE_MAX_STARS = 500;

/** Owners that publish CDN / mirror font collections. */
export const MIRROR_REPO_OWNERS = new Set(
  [
    "google",
    "googlefonts",
    "fortawesome",
    "fontsource",
    "adobe-fonts",
    "android",
    "materialdesignicons",
    "twbs",
  ].map((o) => o.toLowerCase()),
);

/** Exact repos that mirror Google Fonts, FA, Fontsource, Adobe Source, etc. */
export const MEGA_FONT_REPOS = new Set(
  [
    "google/fonts",
    "googlefonts/noto-fonts",
    "googlefonts/noto-emoji",
    "googlefonts/roboto",
    "googlefonts/roboto-flex",
    "adobe-fonts/source-code-pro",
    "adobe-fonts/source-sans-pro",
    "adobe-fonts/source-serif-pro",
    "fontsource/font-files",
    "fontsource/fontsource",
    "fortawesome/font-awesome",
    "fortawesome/font-awesome-5",
    "fortawesome/font-awesome-6",
    "fortawesome/fontawesome-free",
    "twbs/icons",
    "microsoft/cascadia-code",
    "ibm/plex",
    "rsms/inter",
    "theleagueof/league-fonts",
    "iconify/iconify",
    "tabler/tabler-icons",
    "primer/octicons",
    "ionic-team/ionicons",
    "remix-design/remixicon",
    "fontello/fontello",
    "flaticon/flaticon",
    "icomoon/icomoon",
  ].map((r) => r.toLowerCase()),
);

const MIRROR_REPO_PREFIXES = [
  "google/",
  "googlefonts/",
  "fontsource/",
  "adobe-fonts/",
  "fortawesome/",
  "ibm/plex",
  "rsms/",
  "materialdesignicons/",
  "android/platform",
];

/** Substrings in `owner/repo` that usually mean a mirror or vendor bundle. */
const MIRROR_REPO_SUBSTRINGS = [
  "google-font",
  "google_font",
  "googlefont",
  "font-awesome",
  "fontawesome",
  "font_awesome",
  "fonts-offline",
  "typeface-roboto",
  "npm-font",
  "webfontloader",
  "fontello",
  "flaticon",
  "icomoon",
  "icofont",
];

/** Path hints for icon packs vendored into random repos. */
const ICON_FONT_PATH_HINTS = [
  "fontawesome",
  "font-awesome",
  "font_awesome",
  "/fa-solid",
  "/fa-regular",
  "/fa-brands",
  "fa-solid-900",
  "fa-regular-400",
  "fa-brands-400",
  "webfonts/fa",
  "materialicons",
  "material-icons",
  "materialsymbols",
  "material-symbols",
  "bootstrap-icons",
  "remixicon",
  "octicons",
  "ionicons",
  "tabler-icons",
  "fontello",
  "flaticon",
  "icomoon",
  "icofont",
  "lineicons",
  "themify",
  "dripicons",
  "entypo",
  "typicons",
  "weathericons",
  "weather-icons",
];

const ICON_FONT_FAMILY_PATTERNS = [
  /^font\s*awesome/,
  /^fa\s+(solid|regular|brands|sharp)/,
  /^material\s+(icons|symbols)/,
  /^bootstrap\s+icons/,
  /^remix\s*icon/,
  /^tabler\s+icons/,
  /^ionicons/,
  /^octicons/,
  /^fontello/,
  /^flaticon/,
  /^icomoon/,
  /^icofont/,
  /^line\s*icons/,
  /^themify/,
  /^dripicons/,
  /^entypo/,
  /^typicons/,
  /^weather\s+icons/,
];

/** OS-bundled system & metric-compatible fallback faces vendored in repos. */
export const SYSTEM_FONT_FAMILIES = new Set(
  [
    "arial",
    "arial black",
    "arial narrow",
    "arial rounded mt bold",
    "calibri",
    "cambria",
    "candara",
    "consolas",
    "constantia",
    "corbel",
    "courier",
    "courier new",
    "comic sans ms",
    "franklin gothic medium",
    "garamond",
    "georgia",
    "impact",
    "lucida console",
    "lucida sans unicode",
    "lucida grande",
    "lucida bright",
    "microsoft sans serif",
    "palatino linotype",
    "book antiqua",
    "palatino",
    "segoe ui",
    "segoe ui light",
    "segoe ui semibold",
    "segoe ui bold",
    "segoe ui symbol",
    "segoe ui emoji",
    "segoe print",
    "segoe script",
    "tahoma",
    "times new roman",
    "times",
    "trebuchet ms",
    "verdana",
    "wingdings",
    "webdings",
    "symbol",
    "sf pro",
    "sf pro display",
    "sf pro text",
    "sf pro rounded",
    "sf mono",
    "sf compact",
    "sf arabic",
    "helvetica",
    "helvetica neue",
    "menlo",
    "monaco",
    "apple color emoji",
    "apple symbols",
    "new york",
    "san francisco",
    "system ui",
    "system-ui",
    "ui sans serif",
    "ui-serif",
    "ui-monospace",
    "ui-rounded",
    "blinkmacsystemfont",
    "liberation sans",
    "liberation serif",
    "liberation mono",
    "dejavu sans",
    "dejavu serif",
    "dejavu sans mono",
    "nimbus sans",
    "nimbus roman",
    "nimbus mono",
    "droid sans",
    "droid serif",
    "droid sans mono",
    "clear sans",
    "geneva",
    "charcoal",
    "chicago",
    "ms sans serif",
    "ms serif",
    "small fonts",
  ].map((n) => n.toLowerCase()),
);

const SYSTEM_FONT_FAMILY_PATTERNS = [
  /^segoe\s/,
  /^sf\s+(pro|mono|compact|arabic)/,
  /^microsoft\s/,
  /^liberation\s/,
  /^dejavu\s/,
  /^droid\s/,
  /^nimbus\s/,
  /^system\s+ui$/,
  /^ui\s+(sans|serif|monospace|rounded)/,
  /^apple\s+(color\s+emoji|symbols)/,
];

const SYSTEM_FONT_PATH_HINTS = [
  "segoeui",
  "segoe-ui",
  "segoe_ui",
  "sf-pro",
  "sfpro",
  "sf-mono",
  "sfmono",
  "helvetica",
  "liberation",
  "dejavu",
  "droid-sans",
  "droidserif",
  "corefonts",
  "mscorefonts",
  "windowfonts",
  "system/fonts",
  "macsystem",
  "blinkmacsystemfont",
  "courier-new",
  "times-new-roman",
  "trebuchet",
  "comic-sans",
];

/** Families that dominate GitHub font repos (Google Fonts mirrors, system UI stacks). */
export const COMMON_FONT_FAMILIES = new Set(
  [
    "inter",
    "roboto",
    "open sans",
    "lato",
    "montserrat",
    "poppins",
    "noto sans",
    "noto serif",
    "noto color emoji",
    "source sans",
    "source sans pro",
    "source sans 3",
    "source serif",
    "source serif pro",
    "source serif 4",
    "source code pro",
    "raleway",
    "ubuntu",
    "nunito",
    "oswald",
    "merriweather",
    "playfair display",
    "work sans",
    "fira sans",
    "fira code",
    "jetbrains mono",
    "ibm plex sans",
    "ibm plex mono",
    "ibm plex serif",
    "material icons",
    "material symbols",
    "fontawesome",
    "font awesome",
    "font awesome 5 free",
    "font awesome 6 free",
    "font awesome 6 brands",
    "font awesome 6 pro",
    "dm sans",
    "manrope",
    "cabin",
    "mulish",
    "quicksand",
    "rubik",
    "kanit",
    "pt sans",
    "pt serif",
    "libre franklin",
    "barlow",
    "josefin sans",
    "archivo",
    "space grotesk",
    "space mono",
    "red hat display",
    "red hat text",
    "public sans",
    "geist",
    "geist mono",
  ].map((n) => n.toLowerCase()),
);

export const ICON_FONT_FAMILIES = new Set(
  [
    "fontawesome",
    "font awesome",
    "font awesome 5 free",
    "font awesome 5 brands",
    "font awesome 6 free",
    "font awesome 6 brands",
    "font awesome 6 pro",
    "font awesome 6 sharp",
    "material icons",
    "material symbols",
    "material symbols outlined",
    "material symbols rounded",
    "material symbols sharp",
    "bootstrap icons",
    "remixicon",
    "tabler icons",
    "ionicons",
    "octicons",
    "feather",
    "feather icons",
    "line awesome",
    "glyphicons halflings",
    "fontello",
    "flaticon",
    "icomoon",
    "icofont",
    "lineicons",
    "line icons",
    "themify",
    "dripicons",
    "entypo",
    "typicons",
    "weather icons",
    "elusive icons",
  ].map((n) => n.toLowerCase()),
);

export function normalizeFamilyName(family: string): string {
  return family.trim().toLowerCase();
}

export function isMirrorRepo(repository: string): boolean {
  const repo = repository.toLowerCase();
  const [owner] = repo.split("/");

  if (owner && MIRROR_REPO_OWNERS.has(owner)) return true;
  if (MEGA_FONT_REPOS.has(repo)) return true;
  if (MIRROR_REPO_PREFIXES.some((prefix) => repo.startsWith(prefix))) return true;
  if (MIRROR_REPO_SUBSTRINGS.some((hint) => repo.includes(hint))) return true;

  return false;
}

/** @deprecated use isMirrorRepo */
export function isMegaRepo(repository: string): boolean {
  return isMirrorRepo(repository);
}

export function isSystemFontFamily(
  family: string,
  styles: Pick<FontStyle, "path" | "fileName">[] = [],
): boolean {
  const name = normalizeFamilyName(family);
  const cluster = clusterFamilyKey(family);

  if (SYSTEM_FONT_FAMILIES.has(name) || SYSTEM_FONT_FAMILIES.has(cluster)) return true;
  if (SYSTEM_FONT_FAMILY_PATTERNS.some((pattern) => pattern.test(name))) return true;

  return styles.some((style) => {
    const path = `${style.path}/${style.fileName}`.toLowerCase();
    return SYSTEM_FONT_PATH_HINTS.some((hint) => path.includes(hint));
  });
}

export function isCommonFamily(family: string): boolean {
  const name = normalizeFamilyName(family);
  const cluster = clusterFamilyKey(family);
  if (COMMON_FONT_FAMILIES.has(name) || COMMON_FONT_FAMILIES.has(cluster)) return true;
  if (isSystemFontFamily(family)) return true;
  return [...COMMON_FONT_FAMILIES].some(
    (common) =>
      name.startsWith(`${common} `) ||
      name === common ||
      cluster === common.replace(/[^a-z0-9]/g, ""),
  );
}

/** Placeholder names from filenames like `custom-font.woff2`, `fonts-fa.ttf`. */
export const JUNK_FAMILY_EXACT = new Set(
  [
    "font",
    "fonts",
    "custom font",
    "custom fonts",
    "fonts fa",
    "font fa",
    "fa font",
    "fa fonts",
    "main font",
    "default font",
    "my font",
    "web font",
    "web fonts",
    "local font",
    "base font",
    "project font",
    "app font",
    "site font",
    "new font",
    "the font",
    "type font",
    "text font",
    "primary font",
    "secondary font",
    "icon font",
    "logo font",
    "title font",
    "heading font",
    "body font",
    "calculator font",
    "game font",
    "demo font",
    "test font",
    "sample font",
    "unknown font",
    "untitled font",
    "placeholder font",
    "digital font",
    "pixel font",
    "font ui",
    "fontello",
    "flaticon",
    "base fonts",
    "sw",
    "jb",
    "i main",
  ].map((n) => n.toLowerCase()),
);

const JUNK_FAMILY_PATTERNS = [
  /^fonts?\s+fa\b/,
  /^fa\s+fonts?\b/,
  /^custom\s+fonts?\b/,
  /^default\s+fonts?\b/,
  /^main\s+fonts?\b/,
  /^my\s+fonts?\b/,
  /^web\s+fonts?\b/,
  /^local\s+fonts?\b/,
  /^project\s+fonts?\b/,
  /^app\s+fonts?\b/,
  /^site\s+fonts?\b/,
  /^new\s+fonts?\b/,
  /^the\s+fonts?\b/,
  /^demo\s+fonts?\b/,
  /^test\s+fonts?\b/,
  /^sample\s+fonts?\b/,
  /^placeholder\s+fonts?\b/,
  /^untitled\s+fonts?\b/,
  /^unknown\s+fonts?\b/,
  /^(calculator|game|digital|pixel|icon|logo|title|heading|body|primary|secondary|base|type|text|font|ui)\s+fonts?\b/,
  /^font\s+ui\b/,
  /^base\s+fonts?\b/,
];

const JUNK_FILE_BASE_PATTERNS = [
  /^fonts?$/,
  /^fonts?[-_\s]fa$/,
  /^fa[-_\s]fonts?$/,
  /^custom[-_\s]fonts?$/,
  /^default[-_\s]fonts?$/,
  /^main[-_\s]fonts?$/,
  /^my[-_\s]fonts?$/,
  /^web[-_\s]fonts?$/,
  /^local[-_\s]fonts?$/,
  /^project[-_\s]fonts?$/,
  /^app[-_\s]fonts?$/,
  /^(calculator|game|demo|test|sample|placeholder|untitled|unknown)[-_\s]fonts?$/,
  /^font[-_\s]ui$/,
  /^base[-_\s]fonts?$/,
  /^fontello$/,
  /^flaticon$/,
  /^icomoon$/,
  /^icofont$/,
  /^i[-_\s]main$/,
  /^sw$/,
  /^jb$/,
];

function normalizeFileBase(fileName: string): string {
  return fileName
    .replace(/\.[^.]+$/, "")
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function isJunkFamilyName(
  family: string,
  styles: Pick<FontStyle, "path" | "fileName">[] = [],
): boolean {
  const name = normalizeFamilyName(family);
  const cluster = clusterFamilyKey(family);

  if (!name || name.length < 2) return true;
  if (JUNK_FAMILY_EXACT.has(name)) return true;
  if (JUNK_FAMILY_PATTERNS.some((pattern) => pattern.test(name))) return true;

  // Collapsed keys for "custom font", "fonts fa", etc.
  if (
    cluster === "font" ||
    cluster === "fonts" ||
    cluster === "customfont" ||
    cluster === "fontsfa" ||
    cluster === "fontfa" ||
    cluster === "fafont" ||
    cluster === "fafonts" ||
    cluster === "fontui" ||
    cluster === "basefonts" ||
    cluster === "imain" ||
    cluster === "sw" ||
    cluster === "jb" ||
    cluster === "fontello" ||
    cluster === "flaticon"
  ) {
    return true;
  }

  return styles.some((style) => {
    const path = `${style.path}/${style.fileName}`.toLowerCase();
    const base = normalizeFileBase(style.fileName);
    if (JUNK_FAMILY_EXACT.has(base)) return true;
    if (JUNK_FILE_BASE_PATTERNS.some((pattern) => pattern.test(base))) return true;
    return (
      path.includes("fontello") ||
      path.includes("flaticon") ||
      path.includes("/icomoon") ||
      path.includes("icofont")
    );
  });
}

export function isIconFontFamily(
  family: string,
  styles: Pick<FontStyle, "path" | "fileName">[] = [],
): boolean {
  const name = normalizeFamilyName(family);
  const cluster = clusterFamilyKey(family);

  if (ICON_FONT_FAMILIES.has(name) || ICON_FONT_FAMILIES.has(cluster)) return true;
  if (ICON_FONT_FAMILY_PATTERNS.some((pattern) => pattern.test(name))) return true;

  return styles.some((style) => {
    const path = `${style.path}/${style.fileName}`.toLowerCase();
    return ICON_FONT_PATH_HINTS.some((hint) => path.includes(hint));
  });
}

/** @deprecated use dedupeFamiliesByCluster */
export function dedupeFamiliesByName(
  families: DiscoveredFontFamily[],
  preferLowStars: boolean,
): DiscoveredFontFamily[] {
  return dedupeFamiliesByCluster(families, preferLowStars);
}

export function applyDiscoverFilters(
  families: DiscoveredFontFamily[],
  fmtFilters: Set<string>,
  filters: DiscoverFilters,
  sortBy: DiscoverSort,
): DiscoveredFontFamily[] {
  let out = families;

  if (fmtFilters.size > 0) {
    out = out.filter((f) => f.styles.some((s) => fmtFilters.has(s.format)));
  }

  if (filters.hideMegaRepos) {
    out = out.filter((f) => !isMirrorRepo(f.repository));
  }

  if (filters.hideCommonFonts) {
    out = out.filter((f) => !isCommonFamily(f.family));
  }

  if (filters.hideIconFonts) {
    out = out.filter((f) => !isIconFontFamily(f.family, f.styles));
  }

  if (filters.hideJunkNames) {
    out = out.filter((f) => !isJunkFamilyName(f.family, f.styles));
  }

  if (filters.indieOnly) {
    out = out.filter((f) => f.stars <= INDIE_MAX_STARS);
  }

  if (filters.dedupeByFamily) {
    const preferLowStars =
      sortBy === "hidden_gems" || filters.indieOnly || filters.hideCommonFonts;
    out = dedupeFamiliesByName(out, preferLowStars);
  }

  if (sortBy === "name") {
    out = [...out].sort((a, b) => a.family.localeCompare(b.family));
  } else if (sortBy === "stars") {
    out = [...out].sort((a, b) => b.stars - a.stars);
  } else if (sortBy === "hidden_gems") {
    out = [...out].sort((a, b) => a.stars - b.stars || a.family.localeCompare(b.family));
  }

  return out;
}

/** Server-side treasure pass after GitHub fetch (before cache). */
export function filterTreasureFamilies(
  families: DiscoveredFontFamily[],
): DiscoveredFontFamily[] {
  return applyDiscoverFilters(
    families,
    new Set(),
    TREASURE_DISCOVER_FILTERS,
    DEFAULT_DISCOVER_SORT,
  );
}

export function isTreasureMode(filters: DiscoverFilters, sortBy: DiscoverSort): boolean {
  return (
    filters.hideMegaRepos &&
    filters.hideCommonFonts &&
    filters.hideIconFonts &&
    filters.hideJunkNames &&
    filters.dedupeByFamily &&
    filters.indieOnly &&
    sortBy === "hidden_gems"
  );
}

export function hasCustomDiscoverSettings(
  fmtFilters: Set<string>,
  filters: DiscoverFilters,
  sortBy: DiscoverSort,
): boolean {
  return (
    fmtFilters.size > 0 ||
    filters.hideMegaRepos !== DEFAULT_DISCOVER_FILTERS.hideMegaRepos ||
    filters.hideCommonFonts !== DEFAULT_DISCOVER_FILTERS.hideCommonFonts ||
    filters.hideIconFonts !== DEFAULT_DISCOVER_FILTERS.hideIconFonts ||
    filters.hideJunkNames !== DEFAULT_DISCOVER_FILTERS.hideJunkNames ||
    filters.dedupeByFamily !== DEFAULT_DISCOVER_FILTERS.dedupeByFamily ||
    filters.indieOnly !== DEFAULT_DISCOVER_FILTERS.indieOnly ||
    sortBy !== DEFAULT_DISCOVER_SORT
  );
}

/** @deprecated use hasCustomDiscoverSettings */
export function hasActiveDiscoverFilters(
  fmtFilters: Set<string>,
  filters: DiscoverFilters,
  sortBy: DiscoverSort,
): boolean {
  return hasCustomDiscoverSettings(fmtFilters, filters, sortBy);
}