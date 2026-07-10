import { describe, it, expect } from "vitest";
import { otherDiscoverTopics } from "@/lib/discoverTopics";

describe("otherDiscoverTopics", () => {
  it("excludes the active topic", () => {
    const out = otherDiscoverTopics("display");
    expect(out).not.toContain("display");
    expect(out.length).toBeGreaterThan(0);
  });

  it("is case-insensitive", () => {
    expect(otherDiscoverTopics("Display")).not.toContain("display");
  });
});