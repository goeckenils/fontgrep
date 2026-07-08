# 15 — Font Comparison View

**Priority:** P2  
**Effort:** Medium  
**Status:** Done

## Problem

No way to compare two fonts side-by-side with the same preview text.

## Solution

"Compare" button in FontViewer opens a split view with two font panels.

### Steps

1. Create `src/components/FontCompare.tsx`:
   - Split layout (two panels side-by-side, or stacked on mobile)
   - Each panel has its own FontViewer-lite (font, preview text, size)
   - Toggle: "Sync text" — typing in one updates both
   - Toggle: "Sync size" — size slider sync between panels
   - Toggle: "Sync weight" (for families with multiple styles)
2. Add "Compare" button to FontViewer (opens compare view with current font in left panel)
3. In compare view, right panel has a "Select font" dropdown showing:
   - All loaded discover/search fonts
   - All saved library fonts
4. Close compare → returns to single FontViewer
5. Add `compareMode` state to `page.tsx`

### Files

- `src/components/FontCompare.tsx` (new)
- `src/app/page.tsx` — add compare state

## Acceptance Criteria

- [ ] Two fonts render side-by-side
- [ ] Sync text toggle: editing one panel's text updates both
- [ ] Sync size toggle: size slider affects both panels
- [ ] Each panel can independently switch font family/style
- [ ] Works with both saved and unsaved fonts
- [ ] Responsive: stacks vertically on mobile width
- [ ] Closing compare returns to the previous single-font viewer

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
