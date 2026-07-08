# 10 — Font Metadata Extraction

**Priority:** P2  
**Effort:** Medium  
**Status:** Done

## Problem

`family` is derived from the filename (`path.split("/").pop()`). No actual font name table parsing. `Inter-Regular.ttf` shows as "Inter-Regular" not "Inter". Weight/style/variable axes/designer aren't extracted.

## Solution

Use `fontkit` to parse the OpenType name table, OS/2 weight class, and fvar (variable axes).

### Steps

1. Install `fontkit` as a dependency
2. New API endpoint: `POST /api/fonts/inspect` — takes `{ rawUrl }` or `{ repo, path, branch }`:
   - Fetch the font binary (or read from `public/fonts/` if already saved)
   - Parse with fontkit:
     - Full font name (`nameID 1`)
     - Family name (`nameID 1` or `nameID 16`)
     - Subfamily (weight/style) (`nameID 2`)
     - PostScript name (`nameID 6`)
     - Copyright (`nameID 0`)
     - Designer (`nameID 9` if available)
     - OS/2 weight class → numeric weight
     - fvar table → variable axes (tag, min, max, default)
   - Return JSON metadata
3. FontViewer calls inspect on open (loading state while fetching)
4. Display metadata in FontViewer:
   - Real family name (larger, replaces filename)
   - Weight + style below the name
   - Designer/foundry if available
   - "Variable" badge if variable font
5. On save: persist metadata to DB
6. DB schema migration: add columns `real_family`, `weight`, `style`, `is_variable`, `designer`

### Files

- `src/app/api/fonts/inspect/route.ts` (new)
- `src/lib/fontMeta.ts` (new — fontkit wrapper)
- `src/lib/db.ts` — add migration for new columns
- `src/components/FontViewer.tsx` — display metadata
- `package.json` — add `fontkit` dependency

## Acceptance Criteria

- [ ] Opening a font shows its real family name (not just filename)
- [ ] Variable fonts show available axes
- [ ] Designer info displayed when available in the font file
- [ ] Metadata persisted to DB on save
- [ ] Library tab shows real family names (not filenames)
- [ ] Graceful fallback if font parsing fails (show filename as before)

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
