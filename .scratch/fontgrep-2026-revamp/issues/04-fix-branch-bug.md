# 04 — Fix Download Route Branch Bug

**Priority:** P0  
**Effort:** Tiny  
**Status:** Done

## Problem

`download/route.ts` builds `sourceUrl` as `https://github.com/${repo}/blob/main/${path}` — hardcoded to `main`. But `fetchFont()` probes both `main` and `master`. If the actual branch is `master`, the font downloads successfully but the dedup `source_url` uses `main`, so the same font could be saved twice under different URLs.

## Solution

Use the actual branch returned by `fetchFont()` to build `sourceUrl`.

### Steps

1. In `download/route.ts`, after `fetchFont()` returns `{ res, url, branch }`:
   ```ts
   const sourceUrl = `https://github.com/${body.repository}/blob/${fetched.branch}/${body.path}`;
   ```
2. Use this `sourceUrl` for both dedup check and DB insert

### Files

- `src/app/api/fonts/download/route.ts`

## Acceptance Criteria

- [ ] Same font from a `master`-branch repo dedupes correctly
- [ ] No duplicate DB entries for the same font file across branches
- [ ] Existing `main`-branch fonts still dedup correctly

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
