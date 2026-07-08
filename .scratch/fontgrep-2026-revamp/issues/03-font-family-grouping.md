# 03 — Font Family Grouping (Multi-Weight repos)

**Priority:** P0  
**Effort:** Medium-High  
**Status:** Done

## Problem

Currently each font file in a repo is listed as a separate entry. A repo with `Inter-Regular.ttf`, `Inter-Bold.ttf`, `Inter-Italic.ttf` shows 3 separate items. Users want to see "Inter" as one family with weight/style options.

## Solution

Group discovered fonts by family name. A repo that has multiple weights/styles of the same family collapses into a single "Inter" entry. FontViewer shows a weight/style selector.

### Steps

1. **Family name inference** — Improve the `family` derivation in `discover/route.ts`:
   - Currently: `f.path.split("/").pop()` → `Inter-Regular.ttf`
   - New: strip suffix (`.ttf`, `.otf`, `.woff2`) and common weight/style tokens:
     - `-Regular`, `-Bold`, `-Light`, `-Medium`, `-SemiBold`, `-Thin`, `-ExtraBold`, `-Black`
     - `-Italic`, `-Oblique`, `-BoldItalic`, `-LightItalic`, etc.
     - `_Regular`, `_Bold`, etc. (underscore variants)
     - `Regular`, `Bold` without separator
   - Result: `Inter-Regular.ttf` → family `Inter`, weight `400`, style `normal`
     `Inter-BoldItalic.ttf` → family `Inter`, weight `700`, style `italic`
2. **Group in discover response** — instead of flat font list, return grouped:
   ```ts
   interface DiscoveredFontFamily {
     family: string;
     repository: string;
     branch: string;
     license: string | null;
     styles: { path: string; format: string; weight: number; style: string; fileName: string }[];
   }
   ```
3. **UI: family list** — Discover list shows family entries (one row per family), with badge showing number of styles
4. **UI: weight/style selector in FontViewer** — when a family has multiple styles:
   - Dropdown or toggle buttons: "Regular", "Bold", "Italic", "Bold Italic", etc.
   - Selecting a style swaps the raw URL / loads that specific font file
   - Size slider stays as-is, but weight slider is replaced by the actual available weights
5. **Search results** — same grouping applies when search results contain multiple files from the same repo + family

### Weight Mapping

| Token | Weight |
|-------|--------|
| Thin / Hairline | 100 |
| ExtraLight / UltraLight | 200 |
| Light | 300 |
| Regular / Normal / Book | 400 |
| Medium | 500 |
| SemiBold / DemiBold | 600 |
| Bold | 700 |
| ExtraBold / UltraBold | 800 |
| Black / Heavy | 900 |

### Style Mapping

| Token | Style |
|-------|-------|
| Italic | italic |
| Oblique | oblique |
| (none) | normal |

### Files

- `src/lib/fontFamily.ts` (new — family/weight/style inference logic)
- `src/app/api/fonts/discover/route.ts` — group fonts by family before returning
- `src/types/fontDiscovery.ts` — add `DiscoveredFontFamily` type
- `src/app/page.tsx` — render grouped families in DiscoverView
- `src/components/FontViewer.tsx` — add style/weight selector when family has multiple styles
- `src/components/StyleSelector.tsx` (new)
- `tests/unit/fontFamily.test.ts` (new — test the inference logic)

## Acceptance Criteria

- [ ] Repo with `Inter-Regular.ttf` + `Inter-Bold.ttf` shows as single "Inter" entry with badge "2 styles"
- [ ] Opening "Inter" in FontViewer shows a style selector with Regular and Bold options
- [ ] Selecting Bold loads the bold font file and re-renders preview
- [ ] Size slider still works independently
- [ ] Variable fonts (single file with axes) show as 1 style with "Variable" badge
- [ ] Family inference handles common naming conventions (dash, underscore, space)
- [ ] Edge case: single file with no weight token → family = filename minus extension, weight = 400
- [ ] Edge case: `Inter.ttf` → family "Inter", weight 400, style normal
- [ ] Unit tests pass for all weight/style token mappings

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
