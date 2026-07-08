# 14 — Font File Validation & Size Limit

**Priority:** P2  
**Effort:** Small  
**Status:** Done

## Problem

The download route fetches a binary and writes it to disk with no validation. A malicious or misidentified file could be served from `public/fonts/`. No content-type check, no magic-byte validation, no size limit.

## Solution

Validate downloaded files are actual fonts and enforce a size cap before writing to disk.

### Steps

1. Create `src/lib/fontValidate.ts`:
   ```ts
   // Magic bytes for font formats
   const FONT_MAGIC_BYTES: Record<string, number[]> = {
     ttf:  [0x00, 0x01, 0x00, 0x00],          // TrueType
     otf:  [0x4F, 0x54, 0x54, 0x4F],          // "OTTO" (CFF-based OpenType)
     woff: [0x77, 0x4F, 0x46, 0x46],          // "wOFF"
     woff2:[0x77, 0x4F, 0x46, 0x32],          // "wOF2"
   };

   export function validateFontFile(buffer: Buffer, format: string): {
     valid: boolean;
     detectedFormat?: string;
     error?: string;
   }
   ```
2. Check first 4 bytes against known magic bytes
3. Max file size: 50MB (configurable via `MAX_FONT_SIZE_MB` env)
4. In `download/route.ts`:
   - After `res.arrayBuffer()`, check buffer size
   - Validate magic bytes
   - If invalid: return 415 with error message
   - If oversized: return 413 with error message

### Files

- `src/lib/fontValidate.ts` (new)
- `src/app/api/fonts/download/route.ts` — add validation
- `tests/unit/fontValidate.test.ts` (new — test magic byte detection)

## Acceptance Criteria

- [ ] Invalid files (non-font binaries) are rejected with clear error
- [ ] Oversized files (>50MB) are rejected with clear error
- [ ] Valid TTF/OTF/WOFF/WOFF2 files pass validation
- [ ] Detected format from magic bytes is compared to declared format
- [ ] Unit tests cover all 4 format magic bytes + invalid cases

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
