# 12 — CSS @font-face Export

**Priority:** P2  
**Effort:** Small  
**Status:** Done

## Problem

No way to get the CSS code to use a discovered/saved font in your own project.

## Solution

One-click "Copy CSS" button that generates a ready-to-paste `@font-face` rule.

### Steps

1. In FontViewer, add a "Copy CSS" button next to "Save font"
2. Generate CSS based on state:
   - For saved fonts (have `publicPath`):
     ```css
     @font-face {
       font-family: 'Inter';
       src: url('/fonts/<uuid>.woff2') format('woff2');
       font-weight: 400;
       font-style: normal;
       font-display: swap;
     }
     ```
   - For unsaved fonts (raw URL):
     ```css
     @font-face {
       font-family: 'Inter';
       src: url('https://raw.githubusercontent.com/owner/repo/main/fonts/Inter.woff2') format('woff2');
       font-weight: 400;
       font-style: normal;
       font-display: swap;
     }
     ```
   - For variable fonts:
     ```css
     @font-face {
       font-family: 'Inter Variable';
       src: url('...') format('woff2-variations');
       font-weight: 100 900;
       font-display: swap;
     }
     ```
3. Use `navigator.clipboard.writeText()` + toast confirmation
4. If issue 11 (variable axes) is done, include `font-variation-settings` in the CSS if non-default values are set

### Files

- `src/components/FontViewer.tsx`
- `src/lib/cssExport.ts` (new — CSS generation logic)
- `tests/unit/cssExport.test.ts` (new)

## Acceptance Criteria

- [ ] Copy CSS button works for both saved and unsaved fonts
- [ ] Generated CSS is valid and pasteable into a project
- [ ] Variable fonts get correct format string + weight range
- [ ] Toast confirms copy
- [ ] Uses actual family name + weight + style (from issue 10 if available, otherwise inferred from filename)

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
