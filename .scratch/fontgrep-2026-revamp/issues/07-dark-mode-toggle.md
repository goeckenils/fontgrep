# 07 — Dark Mode Toggle

**Priority:** P1  
**Effort:** Small  
**Status:** Done

## Problem

`globals.css` defines a full `.dark` theme. `next-themes` is installed as a dependency. But there's no ThemeProvider in `layout.tsx`, no toggle button anywhere. Users on systems preferring dark get light theme.

## Solution

Wire up `next-themes` ThemeProvider + a sun/moon toggle in the header.

### Steps

1. Create `src/components/theme-provider.tsx` — thin client wrapper:
   ```tsx
   "use client";
   import { ThemeProvider as NextThemesProvider } from "next-themes";
   export function ThemeProvider({ children, ...props }) {
     return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
   }
   ```
2. In `layout.tsx`: wrap `<body>` children with `<ThemeProvider attribute="class" defaultTheme="system" enableSystem>`
3. Create `src/components/mode-toggle.tsx` — sun/moon button using `useTheme()` from next-themes
4. Add the toggle to the header in `page.tsx` (top-right corner)
5. Handle hydration mismatch: use `suppressHydrationWarning` on `<html>` tag
6. Use `mounted` state to avoid rendering toggle before hydration

### Files

- `src/components/theme-provider.tsx` (new)
- `src/components/mode-toggle.tsx` (new)
- `src/app/layout.tsx` — add ThemeProvider
- `src/app/page.tsx` — add toggle button in header

## Acceptance Criteria

- [ ] Toggle switches theme instantly (no page reload)
- [ ] Respects system preference by default (dark OS → dark UI)
- [ ] No FOUC (flash of unstyled content) on load
- [ ] Toggle is visible in the header (top-right)
- [ ] Choice persists across page reloads (next-themes localStorage)

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
