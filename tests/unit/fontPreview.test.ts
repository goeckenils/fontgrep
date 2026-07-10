import { describe, it, expect } from "vitest";
import {
  fontPreviewUrl,
  previewFontFamilyId,
  resolvePreviewFormat,
  resolveViewerFontUrl,
} from "@/lib/fontPreview";

describe("resolvePreviewFormat", () => {
  it("infers format from path when format is unknown", () => {
    expect(resolvePreviewFormat("unknown", "fonts/Grenze.woff2")).toBe("woff2");
    expect(resolvePreviewFormat(undefined, "Inter-Bold.ttf")).toBe("ttf");
  });

  it("returns null for non-font paths", () => {
    expect(resolvePreviewFormat("unknown", "README.md")).toBeNull();
  });
});

describe("fontPreviewUrl", () => {
  it("builds preview proxy url with resolved format", () => {
    const url = fontPreviewUrl({
      repository: "owner/repo",
      branch: "main",
      path: "fonts/Grenze.woff2",
      format: "unknown",
    });
    expect(url).toContain("/api/fonts/preview?");
    expect(url).toContain("format=woff2");
  });
});

describe("resolveViewerFontUrl", () => {
  it("prefers preview proxy over raw GitHub url", () => {
    const url = resolveViewerFontUrl({
      rawUrl:
        "https://raw.githubusercontent.com/owner/repo/main/fonts/Inter.woff2",
      repository: "owner/repo",
      branch: "main",
      path: "fonts/Inter.woff2",
      format: "woff2",
    });
    expect(url).toBe("/api/fonts/preview?repository=owner%2Frepo&path=fonts%2FInter.woff2&format=woff2&branch=main");
    expect(url).not.toContain("raw.githubusercontent.com");
  });

  it("uses publicPath for saved fonts", () => {
    expect(
      resolveViewerFontUrl({
        publicPath: "/fonts/abc.woff2",
        rawUrl: "https://raw.githubusercontent.com/x/y/z.ttf",
        repository: "x/y",
        path: "z.ttf",
        format: "ttf",
      }),
    ).toBe("/fonts/abc.woff2");
  });
});

describe("previewFontFamilyId", () => {
  it("is stable for the same font", () => {
    expect(previewFontFamilyId("a/b", "fonts/x.ttf")).toBe(
      previewFontFamilyId("a/b", "fonts/x.ttf"),
    );
  });
});