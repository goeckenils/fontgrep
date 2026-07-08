import { describe, it, expect } from "vitest";
import { validateFontFile, detectFontMagic } from "@/lib/fontValidate";

function magic(bytes: number[]) {
  return Buffer.from(bytes);
}

describe("detectFontMagic", () => {
  it("detects TTF", () => {
    expect(detectFontMagic(magic([0x00, 0x01, 0x00, 0x00]))).toBe("ttf");
  });
  it("detects OTF (OTTO)", () => {
    expect(detectFontMagic(Buffer.from("OTTO", "ascii"))).toBe("otf");
  });
  it("detects WOFF", () => {
    expect(detectFontMagic(Buffer.from("wOFF", "ascii"))).toBe("woff");
  });
  it("detects WOFF2", () => {
    expect(detectFontMagic(Buffer.from("wOF2", "ascii"))).toBe("woff2");
  });
  it("returns null for unknown bytes", () => {
    expect(detectFontMagic(magic([0xde, 0xad, 0xbe, 0xef]))).toBeNull();
  });
});

describe("validateFontFile", () => {
  it("accepts a valid TTF magic with matching format", () => {
    const r = validateFontFile(magic([0x00, 0x01, 0x00, 0x00]), "ttf", 1024);
    expect(r.valid).toBe(true);
    expect(r.detectedFormat).toBe("ttf");
  });

  it("rejects a non-font binary", () => {
    const r = validateFontFile(magic([0x50, 0x4b, 0x03, 0x04]), "ttf", 1024);
    expect(r.valid).toBe(false);
  });

  it("rejects oversized files", () => {
    const big = Buffer.alloc(2048, 0x00);
    big[0] = 0x00;
    big[1] = 0x01;
    big[2] = 0x00;
    big[3] = 0x00;
    const r = validateFontFile(big, "ttf", 1); // 1 byte limit
    expect(r.valid).toBe(false);
    expect(r.error).toContain("size limit");
  });
});
