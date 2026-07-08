# 11 — Variable Font Axis Controls

**Priority:** P2  
**Effort:** Medium  
**Status:** Done  
**Depends on:** 10 (Font Metadata Extraction)

## Problem

For variable fonts, the FontViewer has a generic weight slider (100–900 in steps of 100). But variable fonts have continuous axes (wght, wdth, slnt, ital, opsz, etc.) with custom min/max/default ranges.

## Solution

After metadata extraction (issue 10), if `is_variable` is true, parse the `fvar` table and render a slider per axis.

### Steps

1. In `fontMeta.ts`: extract `fvar` axes:
   ```ts
   interface VariableAxis {
     tag: string;     // 'wght', 'wdth', 'slnt', 'ital', 'opsz'
     name: string;   // 'Weight', 'Width', 'Slant', 'Italic', 'Optical Size'
     min: number;
     max: number;
     default: number;
   }
   ```
2. Create `src/components/FontAxisSlider.tsx`:
   - One slider per axis
   - Label: axis name + current value
   - Min/max/default from fvar
   - "Reset" button per axis → resets to default
3. In FontViewer:
   - If variable font: hide generic weight slider, show FontAxisSlider components
   - If non-variable: keep existing weight slider
   - Apply via inline style: `font-variation-settings: 'wght' 450, 'wdth' 80;`
   - Update in real-time on slider change
4. Preset buttons for common combinations:
   - "Regular" (all axes at default)
   - "Bold" (wght=700, others at default)
   - "Condensed" (wdth=min, wght=default)
   - Presets auto-generated from axis ranges (only show relevant ones)

### Files

- `src/components/FontAxisSlider.tsx` (new)
- `src/components/FontViewer.tsx` — conditional axis vs. weight slider
- `src/lib/fontMeta.ts` — fvar axis extraction (extended from issue 10)

## Acceptance Criteria

- [ ] Variable fonts show axis sliders (not the generic weight slider)
- [ ] Each slider has correct min/max/default from the font file
- [ ] `font-variation-settings` updates in real-time
- [ ] Non-variable fonts keep the existing weight slider
- [ ] Reset button restores axis to default value
- [ ] Preset buttons appear for common axis combinations

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
