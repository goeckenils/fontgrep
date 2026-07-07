import { describe, it, expect } from "vitest";
import { cn } from "@/lib/cn";

describe("cn", () => {
  it("merges classes", () => {
    expect(cn("p-2", "p-4")).toBe("p-4"); // tailwind-merge dedupes p-.*
  });
  it("respects conditional classes", () => {
    expect(cn("a", false && "b", "c")).toBe("a c");
  });
});
