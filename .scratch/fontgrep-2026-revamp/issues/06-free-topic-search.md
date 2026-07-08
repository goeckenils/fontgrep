# 06 — Free Topic Search in Discover

**Priority:** P1  
**Effort:** Small  
**Status:** Done

## Problem

`loadDiscover` always passes `"font"` as the query. Users can't search for "monospace", "display", "handwriting", "variable-font", etc.

## Solution

Add an input + search button above the discover list. Quick-chips for common topics.

### Steps

1. Add `discoverQuery` state in `page.tsx`
2. Add an Input + Search button to DiscoverView (above the list, below "Surprise me")
3. Pass `discoverQuery` to `loadDiscover(page, discoverQuery || "font", append)`
4. Quick-chip buttons for common topics:
   - `font` (default), `monospace`, `display`, `handwriting`, `variable-font`, `icon-font`, `nerd-font`, `serif`, `sans-serif`, `pixel-font`
5. On topic change: clear the list, reset to page 1, fetch fresh
6. Persist current topic in URL (dependency on issue 08 URL state)

### Files

- `src/app/page.tsx` — topic input, quick-chips, state wiring

### Acceptance Criteria

- [ ] Typing "monospace" and hitting enter loads repos with `topic:monospace`
- [ ] Quick-chip buttons populate the input and trigger search
- [ ] Infinite scroll works with custom topic
- [ ] Empty query falls back to "font"
- [ ] Switching topics clears the previous list before loading new results

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
