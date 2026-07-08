# 18 — Error Boundaries & Loading States

**Priority:** P3  
**Effort:** Small  
**Status:** Done

## Problem

No `error.tsx`, `loading.tsx`, or `not-found.tsx`. API failures show a toast and an empty list with no retry. No skeleton loading.

## Solution

### Steps

1. `src/app/error.tsx` — global error boundary:
   - Shows error message + retry button
   - Calls `reset()` from `next/error` to recover
2. `src/app/loading.tsx` — route loading state:
   - Reuses Skeleton component (already in `components/ui/skeleton.tsx`)
   - Shows skeleton cards matching the discover list layout
3. `src/app/not-found.tsx` — 404 page:
   - "Font not found" message + link back to home
4. Replace spinner text in DiscoverView:
   - Use `<Skeleton>` cards instead of `<Loader2 />` text
5. Add retry button when discover fetch fails (currently just toast + empty state)

### Files

- `src/app/error.tsx` (new)
- `src/app/loading.tsx` (new)
- `src/app/not-found.tsx` (new)
- `src/app/page.tsx` — use Skeleton, add retry button

## Acceptance Criteria

- [ ] API errors show a retry button, not just a toast
- [ ] Loading state shows skeleton cards (not spinner text)
- [ ] 404 renders a styled page with link home
- [ ] Error boundary catches unhandled client-side errors

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
