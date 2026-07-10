import { describe, it, expect } from "vitest";
import {
  buildDiscoverFilesQuery,
  buildDiscoverRepoQuery,
  buildGitHubFontQuery,
  detectFontFormat,
  normalizeGitHubItem,
  githubRepoSearchUrl,
  extractFontPaths,
} from "@/lib/githubFontSearch";
import type { GitHubCodeSearchItem } from "@/types/fontDiscovery";

describe("detectFontFormat", () => {
  it("detects common binary formats by extension", () => {
    expect(detectFontFormat("fonts/Inter.ttf")).toBe("ttf");
    expect(detectFontFormat("fonts/Inter.otf")).toBe("otf");
    expect(detectFontFormat("fonts/Inter.woff")).toBe("woff");
    expect(detectFontFormat("fonts/Inter.WOFF2")).toBe("woff2");
    expect(detectFontFormat("fonts/Inter.eot")).toBe("eot");
  });

  it("detects svg", () => {
    expect(detectFontFormat("icons/logo.svg")).toBe("svg");
  });

  it("detects variable fonts by name", () => {
    expect(detectFontFormat("fonts/Inter-Variable.ttf")).toBe("variable");
    expect(detectFontFormat("vendor/vf.woff2")).toBe("variable");
  });

  it("falls back to unknown", () => {
    expect(detectFontFormat("README.md")).toBe("unknown");
  });
});

describe("buildGitHubFontQuery", () => {
  it("filename mode quotes multi-word terms and scopes to fonts path", () => {
    expect(buildGitHubFontQuery({ query: "Inter", mode: "filename" })).toBe('Inter path:fonts');
    expect(buildGitHubFontQuery({ query: "Open Sans", mode: "filename" })).toBe(
      '"Open Sans" path:fonts',
    );
  });

  it("extension mode ORs the font extensions", () => {
    const q = buildGitHubFontQuery({ query: "Inter", mode: "extension" });
    expect(q).toContain("Inter");
    expect(q).toContain("extension:ttf OR extension:otf OR extension:woff OR extension:woff2");
  });

  it("css mode wraps font-family and defaults to language:CSS", () => {
    const q = buildGitHubFontQuery({ query: "Inter", mode: "css" });
    expect(q).toBe('"font-family: Inter" language:CSS');
  });

  it("css mode omits language filter when language is set explicitly", () => {
    const q = buildGitHubFontQuery({ query: "Inter", mode: "css", language: "CSS" });
    expect(q).toBe('"font-family: Inter"');
  });

  it("license mode scopes to license files", () => {
    const q = buildGitHubFontQuery({ query: "OFL", mode: "license" });
    expect(q).toContain("OFL");
    expect(q).toContain("(path:LICENSE OR path:OFL.txt OR path:FONTLOG.txt)");
  });

  it("throws when query is empty", () => {
    expect(() => buildGitHubFontQuery({ query: "   ", mode: "filename" })).toThrow();
  });
});

describe("normalizeGitHubItem", () => {
  const item: GitHubCodeSearchItem = {
    name: "Inter.ttf",
    path: "src/fonts/Inter.ttf",
    html_url: "https://github.com/foo/bar/blob/main/src/fonts/Inter.ttf",
    repository: {
      full_name: "foo/bar",
      html_url: "https://github.com/foo/bar",
      license: { key: "ofl", name: "Other", spdx_id: "OFL-1.1" },
    },
  };

  it("maps item to discovery result and derives format + license", () => {
    const r = normalizeGitHubItem(item);
    expect(r).toEqual({
      repository: "foo/bar",
      path: "src/fonts/Inter.ttf",
      fileName: "Inter.ttf",
      url: "https://github.com/foo/bar/blob/main/src/fonts/Inter.ttf",
      format: "ttf",
      licenseName: "OFL-1.1",
    });
  });

  it("prefers spdx_id over name for license", () => {
    const r = normalizeGitHubItem(item);
    expect(r.licenseName).toBe("OFL-1.1");
  });

  it("returns undefined license when none present", () => {
    const r = normalizeGitHubItem({ ...item, repository: { ...item.repository, license: null } });
    expect(r.licenseName).toBeUndefined();
  });
});

describe("buildDiscoverFilesQuery", () => {
  it("searches font extensions with the topic keyword", () => {
    const q = buildDiscoverFilesQuery("display");
    expect(q).toContain("display");
    expect(q).toContain("extension:woff2");
    expect(q).toContain("NOT path:node_modules");
  });

  it("never uses repo-only qualifiers", () => {
    for (let variant = 0; variant < 5; variant++) {
      const q = buildDiscoverFilesQuery("display", variant);
      expect(q).not.toContain("topic:");
      expect(q).not.toContain("path:dist/");
    }
  });

  it("rotates query variants", () => {
    expect(buildDiscoverFilesQuery("font", 0)).not.toBe(buildDiscoverFilesQuery("font", 1));
  });

  it("adds mirror exclusions in treasure mode", () => {
    const q = buildDiscoverFilesQuery("display", 0, true);
    expect(q).toContain("-user:google");
    expect(q).toContain("-user:fortawesome");
    expect(q).toContain("NOT path:fontawesome");
    expect(q).toContain("NOT path:fontello");
    expect(q).toContain("NOT path:flaticon");
  });
});

describe("buildDiscoverRepoQuery", () => {
  it("does not require topic: tag", () => {
    const q = buildDiscoverRepoQuery("display", false);
    expect(q).toContain("font");
    expect(q).toContain("display");
    expect(q).not.toMatch(/^topic:/);
    expect(q).not.toContain("in:topics");
  });

  it("excludes mirror orgs in treasure mode", () => {
    const q = buildDiscoverRepoQuery("display", true);
    expect(q).toContain("-user:fortawesome");
    expect(q).toContain("-user:fontsource");
  });
});

describe("githubRepoSearchUrl", () => {
  it("builds a broad repository-search url", () => {
    const url = githubRepoSearchUrl("font", 1, 5);
    expect(url).toContain("https://api.github.com/search/repositories?");
    expect(url).toContain("font");
    expect(url).toContain("sort=stars");
    expect(url).toContain("per_page=5");
  });

  it("clamps page and perPage", () => {
    expect(githubRepoSearchUrl("font", 0, 0)).toContain("page=1");
    expect(githubRepoSearchUrl("font", 1, 999)).toContain("per_page=100");
  });
});

describe("extractFontPaths", () => {
  it("keeps only font binaries from a tree", () => {
    const tree = {
      tree: [
        { path: "fonts/Inter.ttf", type: "blob" },
        { path: "fonts/Inter.woff2", type: "blob" },
        { path: "README.md", type: "blob" },
        { path: "src", type: "tree" },
      ],
    };
    const fonts = extractFontPaths(tree);
    expect(fonts).toHaveLength(2);
    expect(fonts[0]).toEqual({ path: "fonts/Inter.ttf", format: "ttf" });
    expect(fonts[1].format).toBe("woff2");
  });
});
