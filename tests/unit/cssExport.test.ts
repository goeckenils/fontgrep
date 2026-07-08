import { describe, it, expect } from "vitest";
import { buildFontFaceCss } from "@/lib/cssExport";

describe("buildFontFaceCss", () => {
  it("builds a basic @font-face rule for a saved font", () => {
    const css = buildFontFaceCss({
      family: "Inter",
      format: "woff2",
      weight: 400,
      style: "normal",
      srcUrl: "/fonts/abc.woff2",
    });
    expect(css).toContain("font-family: 'Inter';");
    expect(css).toContain("url('/fonts/abc.woff2') format('woff2');"); // woff2
    expect(css).toContain("font-weight: 400;");
    expect(css).toContain("font-style: normal;");
    expect(css).toContain("font-display: swap;");
  });

  it("emits a weight range for variable fonts", () => {
    const css = buildFontFaceCss({
      family: "Inter Variable",
      format: "woff2",
      isVariable: true,
      srcUrl: "/fonts/inter.woff2",
    });
    expect(css).toContain("format('woff2-variations');");
    expect(css).toContain("font-weight: 100 900;");
  });

  it("includes font-variation-settings when provided", () => {
    const css = buildFontFaceCss({
      family: "Inter Variable",
      format: "woff2",
      isVariable: true,
      srcUrl: "/fonts/inter.woff2",
      variationSettings: { wght: 450, wdth: 80 },
    });
    expect(css).toContain("font-variation-settings: 'wght' 450, 'wdth' 80;");
  });

  it("uses opentype format keyword for otf", () => {
    const css = buildFontFaceCss({
      family: "Foo",
      format: "otf",
      srcUrl: "/fonts/foo.otf",
    });
    expect(css).toContain("format('opentype');");
  });
});
