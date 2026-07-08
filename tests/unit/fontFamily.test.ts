import { describe, it, expect } from "vitest";
import {
  inferFontInfo,
  groupFonts,
  styleLabel,
  type FontStyle,
} from "@/lib/fontFamily";
import type { FontFormat } from "@/types/fontDiscovery";

function style(
  path: string,
  format: FontFormat = "ttf",
  extra: Partial<FontStyle> = {}
): FontStyle {
  const info = inferFontInfo(path.split("/").pop() ?? path, format);
  return { ...info, path, ...extra };
}

describe("inferFontInfo", () => {
  it("strips -Regular and yields weight 400 / normal", () => {
    const r = inferFontInfo("Inter-Regular.ttf", "ttf");
    expect(r.family).toBe("Inter");
    expect(r.weight).toBe(400);
    expect(r.style).toBe("normal");
  });

  it("derives Bold weight from -Bold", () => {
    const r = inferFontInfo("Inter-Bold.ttf", "ttf");
    expect(r.family).toBe("Inter");
    expect(r.weight).toBe(700);
  });

  it("derives italic style from -Italic", () => {
    const r = inferFontInfo("Inter-BoldItalic.ttf", "ttf");
    expect(r.family).toBe("Inter");
    expect(r.weight).toBe(700);
    expect(r.style).toBe("italic");
  });

  it("handles underscore separators", () => {
    const r = inferFontInfo("Open_Sans_Light.ttf", "ttf");
    expect(r.family).toBe("Open Sans");
    expect(r.weight).toBe(300);
  });

  it("handles a bare filename with no weight token", () => {
    const r = inferFontInfo("Inter.ttf", "ttf");
    expect(r.family).toBe("Inter");
    expect(r.weight).toBe(400);
    expect(r.style).toBe("normal");
  });

  it("handles Black / Heavy weight", () => {
    expect(inferFontInfo("Foo-Black.ttf", "ttf").weight).toBe(900);
    expect(inferFontInfo("Foo-Heavy.ttf", "ttf").weight).toBe(900);
  });
});

describe("groupFonts", () => {
  const files = [
    { repository: "owner/Inter", branch: "main", license: "OFL", stars: 10, path: "Inter-Regular.ttf", format: "ttf" as const },
    { repository: "owner/Inter", branch: "main", license: "OFL", stars: 10, path: "Inter-Bold.ttf", format: "ttf" as const },
    { repository: "owner/Inter", branch: "main", license: "OFL", stars: 10, path: "Inter-Italic.ttf", format: "ttf" as const },
    { repository: "owner/Roboto", branch: "main", license: null, stars: 5, path: "Roboto.ttf", format: "ttf" as const },
  ];

  it("groups multiple weights of the same family into one entry", () => {
    const families = groupFonts(files);
    const inter = families.find((f) => f.family === "Inter");
    expect(inter).toBeTruthy();
    expect(inter!.styles.length).toBe(3);
  });

  it("shows a single entry for a single-file family", () => {
    const families = groupFonts(files);
    const roboto = families.find((f) => f.family === "Roboto");
    expect(roboto).toBeTruthy();
    expect(roboto!.styles.length).toBe(1);
  });

  it("sorts styles by weight then regular before italic", () => {
    const families = groupFonts(files);
    const inter = families.find((f) => f.family === "Inter")!;
    expect(inter.styles.map((s) => s.weight)).toEqual([400, 400, 700]);
  });
});

describe("styleLabel", () => {
  it("returns Regular for 400 normal", () => {
    expect(styleLabel(style("Inter-Regular.ttf"))).toBe("Regular");
  });
  it("returns Bold for 700 normal", () => {
    expect(styleLabel(style("Inter-Bold.ttf"))).toBe("Bold");
  });
  it("returns Bold Italic", () => {
    const s = style("Inter-BoldItalic.ttf");
    expect(s.style).toBe("italic");
    expect(styleLabel(s)).toBe("Bold Italic");
  });
  it("returns Variable for variable fonts", () => {
    const s = style("Inter-VF.ttf", "variable");
    expect(styleLabel(s)).toBe("Variable");
  });
});
