# 16 — Self-Host UI Fonts (Remove Google Fonts)

**Priority:** P3  
**Effort:** Small  
**Status:** Done

## Problem

`layout.tsx` loads Geist and Geist Mono from Google Fonts (`next/font/google`). A font discovery tool that doesn't use its own discovered fonts. Also a privacy/performance concern (external request on every load).

## Solution

Replace `next/font/google` with `next/font/local` using self-hosted Geist files.

### Steps

1. Download Geist Sans woff2 + Geist Mono woff2 from the official Geist repo (or from fontgrep's own DB if already saved)
2. Place in `public/fonts/ui/` (separate subfolder for UI fonts)
3. In `layout.tsx`:
   ```tsx
   import localFont from "next/font/local";
   const geistSans = localFont({
     src: "../public/fonts/ui/Geist.woff2",
     variable: "--font-geist-sans",
   });
   ```
4. Remove `from "next/font/google"` imports entirely
5. Alternative: dogfood fontgrep by having the app download Geist on first run

### Files

- `src/app/layout.tsx` — switch to localFont
- `public/fonts/ui/` (new directory)

## Acceptance Criteria

- [ ] No external font requests (check Network tab)
- [ ] UI looks identical
- [ ] No FOUC
- [ ] Privacy-friendly (no Google Fonts tracking)

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
