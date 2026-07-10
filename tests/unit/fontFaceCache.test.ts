import { describe, it, expect, vi, beforeEach } from "vitest";

class MockFontFace {
  family: string;
  constructor(family: string, _source: ArrayBuffer) {
    this.family = family;
  }
  async load() {
    return this;
  }
}

describe("fontFaceCache", () => {
  beforeEach(() => {
    vi.stubGlobal("FontFace", MockFontFace);
    vi.stubGlobal("document", {
      fonts: {
        add: vi.fn(),
        delete: vi.fn(),
      },
    });
  });

  it("dedupes concurrent loads for the same key", async () => {
    const { retainFontFace, releaseFontFace } = await import(
      "@/lib/fontFaceCache"
    );

    const load = vi.fn(async () => {
      const buf = new ArrayBuffer(8);
      const view = new DataView(buf);
      view.setUint32(0, 0x00010000, false);
      return new MockFontFace("fg-test", buf) as unknown as FontFace;
    });

    const [a, b] = await Promise.all([
      retainFontFace("k1", load),
      retainFontFace("k1", load),
    ]);

    expect(a).toBe(b);
    expect(load).toHaveBeenCalledTimes(1);
    releaseFontFace("k1");
    releaseFontFace("k1");
  });
});