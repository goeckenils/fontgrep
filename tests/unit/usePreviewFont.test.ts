import { describe, it, expect } from "vitest";
import { previewFontFamilyId } from "@/lib/fontPreview";

describe("preview font identity", () => {
  it("unique ids per path", () => {
    const a = previewFontFamilyId("owner/a", "fonts/A.ttf");
    const b = previewFontFamilyId("owner/b", "fonts/B.ttf");
    expect(a).not.toBe(b);
  });
});