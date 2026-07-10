import { describe, it, expect } from "vitest";
import {
  applyDiscoverFilters,
  dedupeFamiliesByName,
  DEFAULT_DISCOVER_FILTERS,
  DEFAULT_DISCOVER_SORT,
  filterTreasureFamilies,
  isCommonFamily,
  isIconFontFamily,
  isJunkFamilyName,
  isMegaRepo,
  isMirrorRepo,
  isSystemFontFamily,
  isTreasureMode,
  TREASURE_DISCOVER_FILTERS,
} from "@/lib/fontFilters";
import type { DiscoveredFontFamily } from "@/lib/fontFamily";

function family(
  name: string,
  repo: string,
  stars: number,
  path?: string,
): DiscoveredFontFamily {
  const file = path ?? `fonts/${name}-Regular.ttf`;
  return {
    family: name,
    repository: repo,
    branch: "main",
    license: "OFL-1.1",
    stars,
    styles: [
      {
        path: file,
        fileName: file.split("/").pop() ?? file,
        format: "ttf",
        weight: 400,
        style: "normal",
        family: name,
      },
    ],
  };
}

describe("fontFilters", () => {
  it("defaults to rare-hunt filters", () => {
    expect(DEFAULT_DISCOVER_FILTERS).toEqual(TREASURE_DISCOVER_FILTERS);
    expect(isTreasureMode(DEFAULT_DISCOVER_FILTERS, DEFAULT_DISCOVER_SORT)).toBe(true);
  });

  it("detects mirror font repos", () => {
    expect(isMirrorRepo("google/fonts")).toBe(true);
    expect(isMirrorRepo("googlefonts/noto-fonts")).toBe(true);
    expect(isMirrorRepo("fortawesome/Font-Awesome-6")).toBe(true);
    expect(isMirrorRepo("fontsource/font-files")).toBe(true);
    expect(isMirrorRepo("acme/google-fonts-mirror")).toBe(true);
    expect(isMirrorRepo("some-indie/font")).toBe(false);
    expect(isMegaRepo("google/fonts")).toBe(true);
  });

  it("detects common font families", () => {
    expect(isCommonFamily("Inter")).toBe(true);
    expect(isCommonFamily("Roboto")).toBe(true);
    expect(isCommonFamily("Grenze")).toBe(false);
  });

  it("detects junk placeholder family names", () => {
    expect(isJunkFamilyName("font")).toBe(true);
    expect(isJunkFamilyName("fonts")).toBe(true);
    expect(isJunkFamilyName("custom font")).toBe(true);
    expect(isJunkFamilyName("fonts fa")).toBe(true);
    expect(isJunkFamilyName("calculator font")).toBe(true);
    expect(isJunkFamilyName("font ui")).toBe(true);
    expect(isJunkFamilyName("base fonts")).toBe(true);
    expect(isJunkFamilyName("sw")).toBe(true);
    expect(isJunkFamilyName("jb")).toBe(true);
    expect(isJunkFamilyName("i main")).toBe(true);
    expect(
      isJunkFamilyName("Berry", [
        { path: "assets/custom-font.woff2", fileName: "custom-font.woff2" },
      ]),
    ).toBe(true);
    expect(
      isJunkFamilyName("Icons", [
        { path: "assets/fontello/fontello.woff2", fileName: "fontello.woff2" },
      ]),
    ).toBe(true);
    expect(isJunkFamilyName("Grenze")).toBe(false);
    expect(isJunkFamilyName("Bungee")).toBe(false);
  });

  it("detects system and icon toolkit families", () => {
    expect(isSystemFontFamily("Segoe UI")).toBe(true);
    expect(isSystemFontFamily("Arial")).toBe(true);
    expect(isSystemFontFamily("SF Pro Display")).toBe(true);
    expect(isSystemFontFamily("Liberation Sans")).toBe(true);
    expect(
      isSystemFontFamily("Pack", [
        { path: "assets/segoeui.ttf", fileName: "segoeui.ttf" },
      ]),
    ).toBe(true);
    expect(isCommonFamily("Times New Roman")).toBe(true);
    expect(isIconFontFamily("Fontello")).toBe(true);
    expect(isIconFontFamily("Flaticon")).toBe(true);
    expect(isIconFontFamily("Grenze")).toBe(false);
    expect(isSystemFontFamily("Grenze")).toBe(false);
  });

  it("detects icon font families by name and path", () => {
    expect(isIconFontFamily("Font Awesome 6 Free")).toBe(true);
    expect(isIconFontFamily("Material Icons")).toBe(true);
    expect(
      isIconFontFamily("Custom UI", [
        { path: "public/webfonts/fa-solid-900.woff2", fileName: "fa-solid-900.woff2" },
      ]),
    ).toBe(true);
    expect(isIconFontFamily("Grenze")).toBe(false);
  });

  it("dedupes by family name keeping highest stars by default", () => {
    const out = dedupeFamiliesByName(
      [family("Inter", "google/fonts", 9000), family("Inter", "indie/inter", 42)],
      false,
    );
    expect(out).toHaveLength(1);
    expect(out[0].repository).toBe("google/fonts");
  });

  it("dedupes by family name keeping lowest stars for treasure mode", () => {
    const out = dedupeFamiliesByName(
      [family("Inter", "google/fonts", 9000), family("Inter", "indie/inter", 42)],
      true,
    );
    expect(out).toHaveLength(1);
    expect(out[0].repository).toBe("indie/inter");
  });

  it("applies treasure filters together", () => {
    const input = [
      family("Inter", "google/fonts", 12000),
      family("Roboto", "acme/fonts", 800),
      family("Font Awesome 6 Free", "vendor/icons", 12, "assets/fontawesome/fa-solid.woff2"),
      family("custom font", "junk/vendor", 5, "public/custom-font.woff2"),
      family("Grenze", "treasure/grenze", 120),
      family("Grenze", "mirror/grenze", 40),
    ];

    const out = applyDiscoverFilters(
      input,
      new Set(),
      TREASURE_DISCOVER_FILTERS,
      "hidden_gems",
    );

    expect(out.map((f) => f.family)).toEqual(["Grenze"]);
    expect(out[0].repository).toBe("mirror/grenze");
    expect(out[0].stars).toBe(40);
  });

  it("filterTreasureFamilies matches treasure preset", () => {
    const input = [
      family("Inter", "google/fonts", 12000),
      family("Grenze", "treasure/grenze", 120),
    ];
    expect(filterTreasureFamilies(input).map((f) => f.family)).toEqual(["Grenze"]);
  });
});