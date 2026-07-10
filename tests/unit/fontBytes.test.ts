import { describe, it, expect } from "vitest";
import { isFontBytes, isFontErrorBody, isValidFontBuffer } from "@/lib/fontBytes";

function buf(bytes: number[]): ArrayBuffer {
  return Uint8Array.from(bytes).buffer;
}

describe("fontBytes", () => {
  it("accepts ttf magic", () => {
    const ttf = buf([0x00, 0x01, 0x00, 0x00, ...Array(120).fill(0)]);
    expect(isFontBytes(ttf)).toBe(true);
    expect(isValidFontBuffer(ttf)).toBe(true);
  });

  it("rejects github no-content stubs", () => {
    const text = new TextEncoder().encode(
      "No Content: https://example.com/font.woff2",
    );
    expect(isFontErrorBody(text)).toBe(true);
    expect(isValidFontBuffer(text)).toBe(false);
  });

  it("rejects tiny buffers", () => {
    const tiny = buf([0x00, 0x01, 0x00, 0x00, 0x00]);
    expect(isValidFontBuffer(tiny)).toBe(false);
  });
});