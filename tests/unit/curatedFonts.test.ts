import { describe, it, expect } from "vitest";
import { EXCLUDED_FONT_NAMES } from "@/lib/exclude-fonts";
import { CURATED_FONTS } from "@/lib/curated-fonts";

describe("exclude-fonts", () => {
  it("flags common system/web-default fonts as excluded", () => {
    expect(EXCLUDED_FONT_NAMES.has("arial")).toBe(true);
    expect(EXCLUDED_FONT_NAMES.has("inter")).toBe(true);
    expect(EXCLUDED_FONT_NAMES.has("roboto")).toBe(true);
  });

  it("does not flag curated-only fonts", () => {
    expect(EXCLUDED_FONT_NAMES.has("space grotesk")).toBe(false);
    expect(EXCLUDED_FONT_NAMES.has("fira code")).toBe(false);
  });
});

describe("curated-fonts", () => {
  it("has no duplicate repo keys", () => {
    const repos = CURATED_FONTS.map((f) => f.repo);
    expect(new Set(repos).size).toBe(repos.length);
  });

  it("every curated font points to a github repo", () => {
    for (const f of CURATED_FONTS) {
      expect(f.repo).toMatch(/^[\w.-]+\/[\w.-]+(?:\/[\w./-]*)?$/);
    }
  });
});
