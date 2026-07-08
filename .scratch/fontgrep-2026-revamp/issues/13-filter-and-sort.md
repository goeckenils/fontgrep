# 13 — Filter & Sort in Discover

**Priority:** P2  
**Effort:** Small  
**Status:** Done

## Problem

No way to filter discovered fonts by format, license, or sort the list.

## Solution

Filter bar above the discover list with dropdowns/toggles.

### Steps

1. Add `stargazers_count` to the discover response (from repo search API — already available in `GitHubRepoSearchItem` but not passed through)
2. Filter options (client-side filtering on the current loaded set):
   - Format: checkboxes for ttf, otf, woff2, variable, svg (multi-select)
   - License: checkboxes for OFL, MIT, Apache-2.0, GPL, unknown (multi-select, derived from `spdx_id`)
3. Sort dropdown:
   - Relevance (default — GitHub order)
   - Name A–Z
   - Stars (descending — needs star count in response)
4. State preserved when loading more (infinite scroll appends, filters apply to full set)
5. "Clear filters" button

### Files

- `src/types/fontDiscovery.ts` — add `stars?: number` to DiscoveredFont family type
- `src/app/api/fonts/discover/route.ts` — include `stargazers_count` in response
- `src/app/page.tsx` — filter/sort state + UI

## Acceptance Criteria

- [ ] Selecting "woff2 only" hides non-woff2 fonts
- [ ] License filter works (multi-select)
- [ ] Sorting by name reorders the list alphabetically
- [ ] Sorting by stars shows most-starred repos first
- [ ] Filters apply across all loaded pages (not just current page)
- [ ] Clear filters button resets all filters
- [ ] Filter state resets on new topic search

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
