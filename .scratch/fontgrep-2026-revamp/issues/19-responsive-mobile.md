# 19 — Responsive / Mobile Layout

**Priority:** P3  
**Effort:** Medium  
**Status:** Done

## Problem

Current layout is desktop-focused. No responsive testing done. Sliders and text inputs may be unusable on mobile.

## Solution

### Steps

1. FontViewer:
   - Stack controls vertically on small screens (< 768px)
   - Preview area becomes full-width
   - Size/weight sliders: increase touch target height to ≥44px
   - Back + Save buttons: full-width on mobile
2. Discover/Search list:
   - Full-width cards on mobile
   - Badge layout wraps nicely
3. Search input + button:
   - `flex-col sm:flex-row` — stack on mobile, row on desktop
4. Tabs:
   - Ensure scrollable horizontally on narrow screens if needed
   - `overflow-x-auto` on TabsList
5. Header:
   - Center-aligned on mobile, left on desktop
   - Dark mode toggle accessible with thumb
6. Topic quick-chips:
   - Wrap with `flex-wrap` (already done, verify)
   - Touch-friendly chip size

### Files

- `src/app/page.tsx` — responsive Tailwind classes
- `src/components/FontViewer.tsx` — responsive layout
- `src/components/ui/tabs.tsx` — ensure horizontal scroll on mobile

## Acceptance Criteria

- [ ] All features usable at 375px width (iPhone SE)
- [ ] Touch targets ≥ 44px for all interactive elements
- [ ] No horizontal scroll on any viewport
- [ ] FontViewer preview is readable on mobile
- [ ] Sliders are usable with touch

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
