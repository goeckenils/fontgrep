import type { DiscoveredFontFamily, FontStyle } from "@/lib/fontFamily";

const CLUSTER_SUFFIXES = [" font", " fonts", " typeface", " family", " vf", " variable"];

/** Collapse family names across repos (Plus Jakarta Sans ≈ PlusJakartaSans). */
export function clusterFamilyKey(family: string): string {
  let name = family.trim().toLowerCase();

  for (const suffix of CLUSTER_SUFFIXES) {
    if (name.endsWith(suffix)) {
      name = name.slice(0, -suffix.length).trim();
    }
  }

  name = name.replace(/\s+v\d+(\.\d+)*$/i, "").trim();
  return name.replace(/[^a-z0-9]/g, "");
}

function styleSort(a: FontStyle, b: FontStyle): number {
  if (a.weight !== b.weight) return a.weight - b.weight;
  if (a.style !== b.style) return a.style === "normal" ? -1 : 1;
  return a.path.localeCompare(b.path);
}

function mergeFamilyStyles(
  primary: DiscoveredFontFamily,
  secondary: DiscoveredFontFamily,
): DiscoveredFontFamily {
  const seen = new Set(primary.styles.map((s) => `${s.path}::${s.format}`));
  const styles = [...primary.styles];

  for (const style of secondary.styles) {
    const id = `${style.path}::${style.format}`;
    if (seen.has(id)) continue;
    seen.add(id);
    styles.push(style);
  }

  styles.sort(styleSort);

  return {
    ...primary,
    styles,
    license: primary.license ?? secondary.license,
  };
}

/** One card per clustered family; merges styles from duplicate repos. */
export function dedupeFamiliesByCluster(
  families: DiscoveredFontFamily[],
  preferLowStars: boolean,
): DiscoveredFontFamily[] {
  const byCluster = new Map<string, DiscoveredFontFamily>();

  for (const family of families) {
    const key = clusterFamilyKey(family.family);
    if (!key) continue;

    const existing = byCluster.get(key);
    if (!existing) {
      byCluster.set(key, family);
      continue;
    }

    const incomingWins = preferLowStars
      ? family.stars < existing.stars
      : family.stars > existing.stars;

    if (incomingWins) {
      byCluster.set(key, mergeFamilyStyles(family, existing));
    } else {
      byCluster.set(key, mergeFamilyStyles(existing, family));
    }
  }

  return [...byCluster.values()];
}