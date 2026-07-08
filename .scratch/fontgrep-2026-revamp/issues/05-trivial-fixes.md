# 05 — Fix "Surprise Me" + Package Name

**Priority:** P0  
**Effort:** Tiny  
**Status:** Done

## Two trivial fixes bundled together.

## 5a: Surprise Me Doesn't Open Anything

### Problem

`surpriseMe()` picks a random font from the current list and shows a toast — but doesn't open the viewer. User sees a notification with a name and has to manually find it in the list.

### Solution

Change `surpriseMe()` to call `setActiveViewer()` with the random pick (same transform as the list click handler).

### Files

- `src/app/page.tsx` — `surpriseMe()`

### Acceptance Criteria

- [ ] Clicking "Surprise me" opens the FontViewer with a random font
- [ ] Toast still shows the font name
- [ ] Works even if only 1 page has loaded

---

## 5b: Package Name Mismatch

### Problem

`package.json` says `"name": "github-font-indexer"` but the repo is `fontgrep`.

### Solution

Change to `"fontgrep"`.

### Files

- `package.json`

### Acceptance Criteria

- [ ] `package.json` name is `fontgrep`
- [ ] `pnpm dev` still works

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
