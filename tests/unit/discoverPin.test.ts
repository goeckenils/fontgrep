import { describe, it, expect } from "vitest";
import { discoverPinVariant, hashString } from "@/lib/discoverPin";

describe("discoverPinVariant", () => {
  it("is stable for the same family key", () => {
    const a = discoverPinVariant("repo/a::Grenze", "Hello world");
    const b = discoverPinVariant("repo/a::Grenze", "Hello world");
    expect(a).toEqual(b);
  });

  it("varies layout across different families", () => {
    const keys = ["repo/a::Alpha", "repo/b::Beta", "repo/c::Gamma", "repo/d::Delta"];
    const layouts = new Set(keys.map((k) => discoverPinVariant(k, "Sample").layout));
    expect(layouts.size).toBeGreaterThan(1);
  });

  it("assigns specimen index", () => {
    const v = discoverPinVariant("repo/x::Zeta", "sample");
    expect(v.specimenIndex).toMatch(/^\d{3}$/);
  });
});

describe("hashString", () => {
  it("returns a number", () => {
    expect(typeof hashString("test")).toBe("number");
  });
});