# 01 — Instant Preview (No Save Required)

**Priority:** P0  
**Effort:** Medium  
**Status:** Done

## Problem

FontViewer can only render a font AFTER it's been downloaded to `public/fonts/` via "Save font". A user clicking "View" sees the viewer UI but the preview renders in fallback sans-serif — useless until they click Save.

## Root Cause

`FontViewer` initializes `fontUrl` from `font.publicPath`, which is `undefined` for unsaved fonts. The `@font-face` rule is never injected until download completes.

## Solution

Pass the raw GitHub URL (`https://raw.githubusercontent.com/{repo}/{branch}/{path}`) as the initial `fontUrl` so `@font-face` loads directly from GitHub.

### Steps

1. Add `rawUrl?: string` to `ViewerFont` interface in `types/fontDiscovery.ts`
2. In `page.tsx`, when opening a font from Discover: construct raw URL using `repository`, `branch`, and `path` → pass as `rawUrl`
3. In `page.tsx`, when opening from Search: Search doesn't return branch, so probe `main`/`master` — either client-side or via a lightweight API endpoint `GET /api/fonts/resolve-raw?repo=...&path=...` that returns the working raw URL
4. In `FontViewer.tsx`: initialize `fontUrl` state from `font.rawUrl ?? font.publicPath ?? null`
5. If CORS blocks `@font-face` loading from `raw.githubusercontent.com`, add a proxy endpoint `GET /api/fonts/proxy?repo=...&path=...&branch=...` that streams the font binary with `Access-Control-Allow-Origin: *`

### Files

- `src/types/fontDiscovery.ts` — add `rawUrl` to ViewerFont
- `src/components/FontViewer.tsx` — use rawUrl as initial fontUrl
- `src/app/page.tsx` — construct + pass rawUrl
- `src/app/api/fonts/proxy/route.ts` (new — only if CORS is an issue)
- `src/app/api/fonts/resolve-raw/route.ts` (new — for search results without branch info)

## Acceptance Criteria

- [ ] Clicking "View" on any discover font renders the font immediately (no Save required)
- [ ] Same works for search results
- [ ] "Save font" still available but optional (persists to disk + DB)
- [ ] Preview text input + sliders work on the remote font
- [ ] If proxy is needed, it passes through CORS headers correctly

## CORS Note

Need to test whether `raw.githubusercontent.com` sends `Access-Control-Allow-Origin: *` for font files. GitHub raw URLs typically DO allow cross-origin access, so `@font-face` should work. If not, the proxy endpoint becomes part of this issue.

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
