# 08 — URL State & Deep Linking

**Priority:** P1  
**Effort:** Medium  
**Status:** Done

## Problem

Tab, search query, search mode, and open font are all in React state. None reflected in URL. Can't bookmark a search, share a link to a font, or use browser back/forward.

## Solution

Use `useSearchParams` + `useRouter` from `next/navigation` to sync state to URL.

### Steps

1. URL format:
   - `/?tab=discover&topic=monospace&page=2`
   - `/?tab=search&mode=filename&q=inter`
   - `/?tab=library`
   - `/?font=raw:owner/repo/main/fonts/Inter.ttf` (opens discover/search font)
   - `/?font=saved:42` (opens library font by DB id)
2. On mount: restore state from URL params (`useSearchParams()`)
3. On state change: `router.replace()` with updated search params (shallow, no scroll)
4. Keep `activeViewer` in URL so opening/closing the viewer updates the URL
5. Browser back closes the viewer (ESC or back = same behavior)

### State → URL mapping

| State | URL param |
|-------|-----------|
| tab | `tab` (discover/search/library) |
| discover query | `topic` |
| discover page | `page` |
| search query | `q` |
| search mode | `mode` |
| open font | `font` (compact: `raw:repo/branch/path` or `saved:id`) |

### Files

- `src/app/page.tsx` — replace `useState` with URL-synced state using `useSearchParams()` + `useRouter()`

### Acceptance Criteria

- [ ] Refreshing the page preserves the current view (tab, query, mode)
- [ ] Sharing a URL opens the same view for another user
- [ ] Browser back/forward works naturally
- [ ] Closing the viewer (ESC or Back button) returns to the list and updates URL
- [ ] URL stays clean (no empty params like `?q=&mode=filename`)

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
