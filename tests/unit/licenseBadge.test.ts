import { describe, it, expect } from "vitest";
import { licenseStatus } from "@/components/LicenseBadge";

describe("licenseStatus", () => {
  it("treats empty license as unknown", () => {
    expect(licenseStatus(null)).toBe("unknown");
    expect(licenseStatus(undefined)).toBe("unknown");
    expect(licenseStatus("   ")).toBe("unknown");
  });

  it("treats non-empty license as known", () => {
    expect(licenseStatus("OFL-1.1")).toBe("known");
    expect(licenseStatus(" MIT ")).toBe("known");
  });
});