import { describe, it, expect } from "vitest";
import { clusterFamilyKey, dedupeFamiliesByCluster } from "@/lib/fontCluster";
import type { DiscoveredFontFamily } from "@/lib/fontFamily";

function family(
  name: string,
  repo: string,
  stars: number,
  extra?: Partial<DiscoveredFontFamily>,
): DiscoveredFontFamily {
  return {
    family: name,
    repository: repo,
    branch: "main",
    license: extra?.license ?? null,
    stars,
    styles: extra?.styles ?? [
      {
        path: `fonts/${name}-Regular.ttf`,
        fileName: `${name}-Regular.ttf`,
        format: "ttf",
        weight: 400,
        style: "normal",
        family: name,
      },
    ],
  };
}

describe("clusterFamilyKey", () => {
  it("collapses spacing and punctuation", () => {
    expect(clusterFamilyKey("Plus Jakarta Sans")).toBe("plusjakartasans");
    expect(clusterFamilyKey("PlusJakartaSans")).toBe("plusjakartasans");
  });

  it("strips common font suffixes", () => {
    expect(clusterFamilyKey("Grenze Font")).toBe("grenze");
    expect(clusterFamilyKey("Grenze Variable")).toBe("grenze");
  });

  it("keeps distinct subfamilies separate", () => {
    expect(clusterFamilyKey("Inter")).not.toBe(clusterFamilyKey("Inter Display"));
  });
});

describe("dedupeFamiliesByCluster", () => {
  it("merges cross-repo name variants and keeps lowest stars in treasure mode", () => {
    const out = dedupeFamiliesByCluster(
      [
        family("Plus Jakarta Sans", "google/fonts", 9000),
        family("PlusJakartaSans", "indie/plus-jakarta", 42),
      ],
      true,
    );

    expect(out).toHaveLength(1);
    expect(out[0].repository).toBe("indie/plus-jakarta");
    expect(out[0].stars).toBe(42);
  });

  it("merges styles from duplicate cluster entries", () => {
    const out = dedupeFamiliesByCluster(
      [
        family("Grenze", "repo/a", 100, {
          styles: [
            {
              path: "Grenze-Regular.ttf",
              fileName: "Grenze-Regular.ttf",
              format: "ttf",
              weight: 400,
              style: "normal",
              family: "Grenze",
            },
          ],
        }),
        family("Grenze", "repo/b", 50, {
          styles: [
            {
              path: "fonts/Grenze-Bold.ttf",
              fileName: "Grenze-Bold.ttf",
              format: "ttf",
              weight: 700,
              style: "normal",
              family: "Grenze",
            },
          ],
        }),
      ],
      true,
    );

    expect(out).toHaveLength(1);
    expect(out[0].styles).toHaveLength(2);
    expect(out[0].repository).toBe("repo/b");
  });

  it("inherits license from duplicate when primary has none", () => {
    const out = dedupeFamiliesByCluster(
      [
        family("Foo", "repo/a", 10, { license: null }),
        family("Foo", "repo/b", 20, { license: "OFL-1.1" }),
      ],
      true,
    );

    expect(out[0].license).toBe("OFL-1.1");
  });
});