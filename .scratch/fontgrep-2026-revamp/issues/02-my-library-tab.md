# 02 — My Library Tab (Saved Fonts Gallery)

**Priority:** P0  
**Effort:** Medium  
**Status:** Done

## Problem

`db.ts` exports `getAllFonts()` and `getFontById()` — neither is called anywhere. Users who save fonts have no way to browse their saved collection.

## Solution

Add a third tab "Library" showing all saved fonts from the DB with the same FontViewer interaction.

### Steps

1. New API route: `GET /api/fonts/library` → returns `getAllFonts()` mapped to JSON with `publicPath` populated
2. New API route: `DELETE /api/fonts/[id]` → deletes DB row + deletes file from `public/fonts/`
3. Add `deleteFont(id: number)` to `db.ts` — removes DB row, returns `local_path` so caller can delete the file
4. Add "Library" tab to the Tabs component in `page.tsx`
5. Library view: list of saved fonts with family name, format badge, license badge, download date
6. Click opens FontViewer with `publicPath` pre-set (instant render — already on disk)
7. "Delete font" button per font (trash icon) — confirms, calls DELETE, removes from list
8. Empty state: "No saved fonts yet. Browse Discover to find some."

### Files

- `src/app/api/fonts/library/route.ts` (new)
- `src/app/api/fonts/[id]/route.ts` (new — DELETE handler)
- `src/lib/db.ts` — add `deleteFont(id)`
- `src/app/page.tsx` — add Library tab + state + view component
- `src/components/FontViewer.tsx` — ensure it works when `publicPath` is pre-set

## Acceptance Criteria

- [ ] Library tab shows all previously saved fonts
- [ ] Fonts render instantly (served from `/fonts/<uuid>.<ext>`)
- [ ] Delete removes the font from DB and deletes the file from disk
- [ ] Empty state message when no fonts saved
- [ ] Library auto-refreshes when switching to the tab (fetches from API)

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
