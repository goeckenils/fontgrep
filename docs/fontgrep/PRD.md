# PRD: fontgrep — Next-Phase Feature Roadmap & Improvements

**Status:** Draft  
**Date:** July 2026  
**Author:** Hermes Agent (automated analysis)  
**Repo:** `github.com/goeckenils/fontgrep` (public)

---

## 1. Current State Summary

fontgrep is a Next.js 16 app that discovers open-source font binaries on GitHub via two mechanisms:

| Mode | API Used | What It Does |
|------|----------|-------------|
| **Discover** | GitHub Repository Search (`topic:font`, sorted by stars) + Git Tree API per repo | Finds actual `.ttf`/`.otf`/`.woff2` files by scanning repo trees |
| **Search** | GitHub Code Search (4 sub-modes: filename, extension, CSS @font-face, license) | Raw code-index search, normalized to format + repo + path + SPDX license |

A **FontViewer** replaces the list as the main view, offering a preview-text input and size/weight sliders. "Save font" downloads the binary to `public/fonts/<uuid>.<ext>` and records it in SQLite (`data/fontgrep.db`) with `source_url` UNIQUE dedup.

**Tech stack:** Next.js 16 (App Router), React 19, TypeScript strict, Tailwind v4, shadcn/ui (base-nova), better-sqlite3, Vitest + Playwright, pnpm.

---

## 2. Problem Analysis

### 2.1 Critical UX Gap: No Preview Before Save

The single biggest UX problem. The FontViewer can only render a font after it's been downloaded to `public/fonts/` via the "Save font" button. A user clicking "View" on a discover/search result sees the viewer UI (input, sliders) but **no font renders** — just the fallback sans-serif — until they click "Save font." This defeats the purpose of a font preview tool.

**Root cause:** `FontViewer` initializes `fontUrl` from `font.publicPath`, which is `undefined` for unsaved fonts. The `@font-face` rule is never injected until download completes.

### 2.2 No "My Library" View

`db.ts` exports `getAllFonts()` and `getFontById()` — neither is called anywhere in the app. Users who save fonts have no way to browse their saved collection. The data layer exists; the UI doesn't.

### 2.3 Discover Is Hardcoded to "font" Topic

`loadDiscover` always passes `"font"` as the query. The README acknowledges this. Users can't type a topic like "monospace", "display", "handwriting", or "jetbrains".

### 2.4 "Surprise Me" Doesn't Actually Open Anything

The `surpriseMe()` function picks a random font from the current list and shows a toast — but doesn't open the viewer. The user sees a notification with a name and has to manually find it in the list.

### 2.5 Download Route Branch Bug

`download/route.ts` builds `sourceUrl` as `https://github.com/${repo}/blob/main/${path}` — hardcoded to `main`. But `fetchFont()` probes both `main` and `master`. If the actual branch is `master`, the font downloads successfully but the dedup `source_url` uses `main`, so the same font could be saved twice under different URLs.

### 2.6 Dark Mode CSS Exists but Is Unreachable

`globals.css` defines a full `.dark` theme. `next-themes` is installed as a dependency. But there's no `ThemeProvider` in `layout.tsx`, no toggle button anywhere. Users on systems preferring dark get the light theme.

### 2.7 No URL State / Deep Linking

The active tab, search query, search mode, and open font are all in React state. None of it is reflected in the URL. You can't bookmark a search, share a link to a font, or use the browser back button meaningfully.

### 2.8 No Error Boundaries or Loading States

No `error.tsx`, `loading.tsx`, or `not-found.tsx`. If the discover API fails, the user sees a toast and an empty list with no retry option.

### 2.9 Font Metadata Is Just the Filename

`family` is derived from `path.split("/").pop()` — the raw filename like `Inter-Variable.ttf`. No actual font name table parsing. This means:
- `Inter-Regular.ttf` shows as "Inter-Regular" not "Inter"
- Weight/style aren't extracted
- Variable font axes aren't detected
- No designer/foundry metadata

### 2.10 No API Rate Limit Handling

Every discover request hits GitHub API (repo search + N tree fetches). With `PER_PAGE=5` repos and `MAX_FONTS=30`, that's up to 6 API calls per page load. No caching, no rate-limit header parsing, no 429 retry, no backoff. On a free token (60 req/hr for search, 5000/hr for general API), this burns through quickly.

### 2.11 No Font File Validation

The download route fetches a binary and writes it to disk with no validation. A malicious or misidentified file could be served from `public/fonts/`. No content-type check, no magic-byte validation, no size limit.

### 2.12 Ironic Google Fonts Dependency

`layout.tsx` loads Geist and Geist Mono from Google Fonts (`next/font/google`). A font discovery tool that doesn't use its own discovered fonts for its own UI. Also a privacy/performance concern (external request on every load).

### 2.13 No CI/CD

No GitHub Actions workflow. Tests, lint, typecheck, and build are all manual.

### 2.14 Package Name Mismatch

`package.json` says `"name": "github-font-indexer"` but the repo is `fontgrep`. Confusing for anyone cloning.

### 2.15 E2E Test Is a Placeholder

`smoke.spec.ts` just checks `await expect(page).toHaveTitle(/Create Next App|.*/)` — the `.*/` makes it match literally anything. It's a no-op test.

---

## 3. Proposed Features & Improvements

### 3.1 Instant Preview (No Save Required) — P0

**Goal:** FontViewer renders the font immediately from the GitHub raw URL, before any download.

**Approach:**
- When a font is opened from Discover or Search, pass the raw GitHub URL (`https://raw.githubusercontent.com/{repo}/{branch}/{path}`) as the initial `fontUrl`.
- The `@font-face` rule in FontViewer already handles any URL — just feed it the raw URL.
- "Save font" becomes optional (persists to disk + DB for offline/library use).
- For the branch-probing problem: the discover route already returns `branch` from the repo search. Pass it through to the viewer. For search results (which don't include branch), probe `main` then `master` client-side, or add a lightweight API endpoint that resolves the branch.

**Files affected:**
- `src/components/FontViewer.tsx` — initialize `fontUrl` from raw URL
- `src/app/page.tsx` — pass raw URL or branch info to `ViewerFont`
- `src/types/fontDiscovery.ts` — add `rawUrl?: string` to `ViewerFont`

**Acceptance criteria:**
- Clicking "View" on any font immediately renders it in the viewer (within font-load time)
- "Save font" is still available but no longer required for preview
- Works for both Discover and Search results

---

### 3.2 My Library (Saved Fonts Gallery) — P0

**Goal:** A third tab "Library" showing all saved fonts from the DB, with the same viewer interaction.

**Approach:**
- New API route: `GET /api/fonts/library` → returns `getAllFonts()` with `public_path` populated
- New "Library" tab in the Tabs component
- Grid or list layout showing saved fonts with family name, format, license, download date
- Click opens FontViewer with `publicPath` pre-set (instant render, already on disk)
- "Delete font" action (removes from DB + deletes file from `public/fonts/`)
- "Export CSS" button per font (see 3.8)

**Files affected:**
- `src/app/api/fonts/library/route.ts` (new)
- `src/app/api/fonts/[id]/route.ts` (new — DELETE handler)
- `src/app/page.tsx` — add Library tab + state
- `src/lib/db.ts` — add `deleteFont(id)` function

**Acceptance criteria:**
- Library tab shows all previously saved fonts
- Fonts render instantly (served from `public/fonts/`)
- Delete removes the font from DB and disk
- Empty state: "No saved fonts yet. Browse Discover to find some."

---

### 3.3 Free Topic Search in Discover — P1

**Goal:** User can type a topic/keyword in the Discover tab to search for font repos by topic, not just hardcoded "font".

**Approach:**
- Add an Input + search button above the discover list
- Query gets passed to `loadDiscover(page, query, append)` instead of hardcoded `"font"`
- The `githubRepoSearchUrl` already accepts a custom query — just wire the UI
- Suggested topics as quick-chips: "font", "monospace", "display", "handwriting", "variable-font", "icon-font", "nerd-font"
- Persist last query in URL search params (see 3.6)

**Files affected:**
- `src/app/page.tsx` — add topic input to DiscoverView, pass to `loadDiscover`

**Acceptance criteria:**
- Typing "monospace" and hitting enter loads repos with `topic:monospace`
- Quick-chip buttons populate the input and trigger search
- Infinite scroll works with the custom topic
- Empty query falls back to "font"

---

### 3.4 Dark Mode Toggle — P1

**Goal:** Users can switch between light/dark/system themes.

**Approach:**
- Wrap app in `next-themes` `ThemeProvider` (attribute="class", defaultTheme="system")
- Add a sun/moon toggle button in the header
- Use existing `.dark` CSS variables (already defined in `globals.css`)

**Files affected:**
- `src/app/layout.tsx` — add ThemeProvider
- `src/app/page.tsx` — add toggle button in header
- `src/components/theme-provider.tsx` (new — thin wrapper)

**Acceptance criteria:**
- Toggle switches theme instantly
- Respects system preference by default
- No FOUC (flash of unstyled content) on load

---

### 3.5 Fix "Surprise Me" to Actually Open the Viewer — P1

**Goal:** "Surprise me" picks a random font and opens it in the viewer.

**Approach:**
- Change `surpriseMe()` to call `setActiveViewer(...)` with the randomly picked font (same transform as the list click handler)
- Optionally: pick from the full discovered set, not just the current page

**Files affected:**
- `src/app/page.tsx` — `surpriseMe()`

**Acceptance criteria:**
- Clicking "Surprise me" opens the FontViewer with a random font
- Toast still shows the font name
- Works even if only 1 page has loaded

---

### 3.6 URL State & Deep Linking — P1

**Goal:** Tab, search query, search mode, and open font are reflected in the URL. Bookmarkable, shareable.

**Approach:**
- Use `useSearchParams` + `useRouter` from `next/navigation`
- URL format:
  - `/?tab=discover&topic=monospace&page=2`
  - `/?tab=search&mode=filename&q=inter`
  - `/?font=123` (opens library font by ID) or `/?font=raw:repo/path` (opens discover font)
- On mount: restore state from URL params
- On state change: update URL (shallow, no scroll)

**Files affected:**
- `src/app/page.tsx` — replace `useState` with URL-synced state

**Acceptance criteria:**
- Refreshing the page preserves the current view
- Sharing a URL opens the same view for another user
- Browser back/forward works naturally

---

### 3.7 GitHub API Caching & Rate Limit Resilience — P1

**Goal:** Reduce API calls, handle rate limits gracefully.

**Approach:**
- **Server-side cache:** Cache repo-search responses and tree responses in SQLite (or in-memory Map with TTL). Key by query+page. TTL: 1 hour.
- **Rate-limit awareness:** Parse `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers. If remaining < 5, return a 429 with `retry-after` to the client. Show a user-facing "rate limited, try again in X minutes" message.
- **Retry with backoff:** On 429/503, retry once after `retry-after` seconds (with a max wait of 10s).
- **Client-side cache:** Cache discover results in `sessionStorage` so tab switches don't re-fetch.

**Files affected:**
- `src/lib/githubCache.ts` (new)
- `src/app/api/fonts/discover/route.ts` — use cache, parse rate-limit headers
- `src/app/api/font-search/route.ts` — same
- `src/lib/db.ts` — add cache table (optional, or in-memory)

**Acceptance criteria:**
- Repeated discover calls with same params don't hit GitHub API within TTL
- Rate limit errors show a human-readable message with retry time
- Client-side: switching tabs and back doesn't re-fetch

---

### 3.8 CSS @font-face Export — P2

**Goal:** One-click "Copy CSS" button that generates a ready-to-paste `@font-face` rule for a saved font.

**Approach:**
- In FontViewer, add a "Copy CSS" button (next to "Save font")
- Generates:
  ```css
  @font-face {
    font-family: 'Inter';
    src: url('/fonts/<uuid>.woff2') format('woff2');
    font-weight: 400;
    font-style: normal;
    font-display: swap;
  }
  ```
- For unsaved fonts, generate with the raw GitHub URL
- Use `navigator.clipboard.writeText()` + toast confirmation

**Files affected:**
- `src/components/FontViewer.tsx`

**Acceptance criteria:**
- Copy CSS button works for both saved and unsaved fonts
- Generated CSS is valid and pasteable
- Toast confirms copy

---

### 3.9 Font Metadata Extraction — P2

**Goal:** Extract real font family name, weight, style, and variable axes from the binary itself.

**Approach:**
- Use `fontkit` (pure JS, no native deps) or `opentype.js` on the server
- New API endpoint: `POST /api/fonts/inspect` — takes a raw URL or local path, returns metadata
- Call it when opening the FontViewer (or batch-inspect on save)
- Display: real family name, subfamily (weight/style), copyright, designer (if available), variable font axes (if applicable)

**Files affected:**
- `src/app/api/fonts/inspect/route.ts` (new)
- `src/lib/fontMeta.ts` (new — fontkit/opentype wrapper)
- `src/components/FontViewer.tsx` — display metadata
- `src/lib/db.ts` — add columns: `real_family`, `weight`, `style`, `is_variable`

**Acceptance criteria:**
- Opening a font shows its real family name (not just filename)
- Variable fonts show available axes
- Metadata is persisted on save

---

### 3.10 Variable Font Axis Controls — P2

**Goal:** For variable fonts, show sliders for each axis (weight, width, slant, etc.) instead of just a generic weight slider.

**Approach:**
- After metadata extraction (3.9), if `is_variable` is true, parse the `fvar` table for axes
- Render a slider per axis with min/max/default values
- Apply via `font-variation-settings: 'wght' 450, 'wdth' 80;`
- Preset buttons for common combinations (e.g., "Condensed Bold", "Regular")

**Files affected:**
- `src/components/FontViewer.tsx`
- `src/components/FontAxisSlider.tsx` (new)

**Acceptance criteria:**
- Variable fonts show axis sliders
- Non-variable fonts show the existing weight slider
- `font-variation-settings` updates in real-time

---

### 3.11 Font Comparison View — P2

**Goal:** Side-by-side comparison of two fonts with the same preview text.

**Approach:**
- "Compare" button in FontViewer opens a split view
- Each panel has its own font + preview text (synced or independent)
- Toggle: sync preview text between panels
- Toggle: sync size between panels

**Files affected:**
- `src/components/FontCompare.tsx` (new)
- `src/app/page.tsx` — add compare state

**Acceptance criteria:**
- Two fonts render side-by-side
- Preview text can be synced or independent
- Works with both saved and unsaved fonts

---

### 3.12 Filtering & Sorting in Discover — P2

**Goal:** Filter discovered fonts by format, license, and sort by name/stars/date.

**Approach:**
- Filter bar above the discover list with dropdowns/toggles:
  - Format: ttf, otf, woff2, variable (multi-select)
  - License: OFL, MIT, Apache, GPL, unknown (multi-select)
  - Sort: relevance (default), name A-Z, stars (if available)
- Client-side filtering on the current result set
- Star count: add to DiscoveredFont type (from repo search response)

**Files affected:**
- `src/app/page.tsx` — filter state + UI
- `src/types/fontDiscovery.ts` — add `stars?: number` to DiscoveredFont
- `src/app/api/fonts/discover/route.ts` — include `stargazers_count` in response

**Acceptance criteria:**
- Selecting "woff2 only" hides non-woff2 fonts
- Sorting by name reorders the list
- Filters reset on new topic search

---

### 3.13 Font File Validation & Size Limit — P2

**Goal:** Validate downloaded files are actual fonts and enforce a size cap.

**Approach:**
- Check `Content-Type` header (should be `application/octet-stream` or `font/*`)
- Magic-byte check: TTF/OTF start with `0x00010000` or `OTTO`, WOFF with `wOFF`, WOFF2 with `wOF2`
- Max file size: 50MB (configurable via env)
- Reject and return 415 if validation fails

**Files affected:**
- `src/app/api/fonts/download/route.ts`
- `src/lib/fontValidate.ts` (new)

**Acceptance criteria:**
- Invalid files are rejected with a clear error
- Oversized files are rejected
- Error message explains what went wrong

---

### 3.14 Fix Download Route Branch Bug — P2

**Goal:** `source_url` for dedup uses the actual branch, not hardcoded "main".

**Approach:**
- `fetchFont()` already returns the successful `branch`. Use it to build `sourceUrl`:
  ```ts
  const sourceUrl = `https://github.com/${body.repository}/blob/${fetched.branch}/${body.path}`;
  ```

**Files affected:**
- `src/app/api/fonts/download/route.ts`

**Acceptance criteria:**
- Same font from a `master`-branch repo dedupes correctly
- No duplicate DB entries for the same font file

---

### 3.15 Self-Host UI Fonts — P3

**Goal:** Remove Google Fonts dependency. Use self-hosted Geist (or a discovered font).

**Approach:**
- Download Geist + Geist Mono `.woff2` files into `public/fonts/`
- Replace `next/font/google` with `next/font/local` pointing to the files
- Or: use a font discovered by fontgrep itself (dogfooding)

**Files affected:**
- `src/app/layout.tsx` — switch to `localFont`
- `public/fonts/` — add Geist files

**Acceptance criteria:**
- No external font requests
- UI looks identical
- Privacy-friendly (no Google Fonts tracking)

---

### 3.16 GitHub Actions CI — P3

**Goal:** Automated lint, typecheck, test, and build on every PR.

**Approach:**
- `.github/workflows/ci.yml`:
  ```yaml
  jobs:
    quality:
      runs-on: ubuntu-latest
      steps:
        - uses: actions/checkout@v4
        - uses: pnpm/action-setup@v4
        - uses: actions/setup-node@v4
          with:
            node-version: 22
            cache: pnpm
        - run: pnpm install --frozen-lockfile
        - run: pnpm lint
        - run: pnpm typecheck
        - run: pnpm test
        - run: pnpm build
  ```

**Files affected:**
- `.github/workflows/ci.yml` (new)

**Acceptance criteria:**
- CI runs on every PR and push to main
- All checks must pass to merge

---

### 3.17 Error Boundaries & Loading States — P3

**Goal:** Graceful error and loading UI.

**Approach:**
- `src/app/error.tsx` — global error boundary with retry button
- `src/app/loading.tsx` — skeleton loading state
- `src/app/not-found.tsx` — 404 page
- Replace spinner text in DiscoverView with Skeleton components (already available)

**Files affected:**
- `src/app/error.tsx` (new)
- `src/app/loading.tsx` (new)
- `src/app/not-found.tsx` (new)
- `src/app/page.tsx` — use Skeleton

**Acceptance criteria:**
- API errors show a retry button, not just a toast
- Loading state shows skeleton cards
- 404 renders a styled page

---

### 3.18 Keyboard Shortcuts — P3

**Goal:** Power-user keyboard navigation.

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search input |
| `Escape` | Close FontViewer |
| `Enter` (in list) | Open FontViewer |
| `Arrow Down/Up` | Navigate list items |
| `S` | Save current font |
| `C` | Copy CSS |

**Files affected:**
- `src/app/page.tsx` — `useEffect` keyboard listener
- `src/components/FontViewer.tsx` — escape handler

**Acceptance criteria:**
- All shortcuts work without conflicting with text input
- Shortcuts are discoverable (tooltip or help overlay)

---

### 3.19 Responsive / Mobile Layout — P3

**Goal:** Usable on mobile devices.

**Approach:**
- FontViewer: stack controls vertically on small screens
- Discover list: full-width cards
- Search: input + button wrap on narrow screens
- Tabs: scrollable on mobile
- Slider controls: larger touch targets

**Files affected:**
- `src/app/page.tsx` — responsive classes
- `src/components/FontViewer.tsx` — responsive layout

**Acceptance criteria:**
- All features usable on 375px width
- Touch targets ≥ 44px
- No horizontal scroll

---

### 3.20 Package Name Alignment — P3

**Goal:** `package.json` name matches repo name.

**Files affected:**
- `package.json` — `"name": "fontgrep"`

---

### 3.21 Real E2E Tests — P3

**Goal:** Replace placeholder smoke test with actual E2E coverage.

**Test cases:**
1. Page loads, discover tab active, fonts appear (mocked API)
2. Switch to search tab, type query, see results
3. Click a font, viewer opens, preview text editable
4. Save font, switch to library tab, font appears
5. Delete font from library, it disappears
6. Dark mode toggle works
7. Topic search updates results

**Files affected:**
- `tests/e2e/smoke.spec.ts` — replace with real tests
- `tests/e2e/mocks.ts` (new — GitHub API mocks)

**Acceptance criteria:**
- All 7 test cases pass
- Tests run without a real GITHUB_TOKEN (mocked)

---

## 4. Priority Matrix

| Priority | Feature | Effort | Impact |
|----------|---------|--------|--------|
| **P0** | 3.1 Instant Preview | Medium | Critical — core UX |
| **P0** | 3.2 My Library | Medium | High — completes the save loop |
| **P1** | 3.3 Free Topic Search | Small | High — unlocks discover |
| **P1** | 3.4 Dark Mode Toggle | Small | Medium — polish |
| **P1** | 3.5 Fix Surprise Me | Tiny | Small — delight |
| **P1** | 3.6 URL State | Medium | High — shareability |
| **P1** | 3.7 API Caching | Medium | High — reliability |
| **P2** | 3.8 CSS Export | Small | Medium — utility |
| **P2** | 3.9 Font Metadata | Medium | High — correctness |
| **P2** | 3.10 Variable Axes | Medium | Medium — power users |
| **P2** | 3.11 Comparison View | Medium | Medium — decision making |
| **P2** | 3.12 Filter & Sort | Small | Medium — browse UX |
| **P2** | 3.13 File Validation | Small | High — security |
| **P2** | 3.14 Branch Bug Fix | Tiny | Medium — correctness |
| **P3** | 3.15 Self-Host Fonts | Small | Low — principle |
| **P3** | 3.16 CI Pipeline | Small | Medium — maintainability |
| **P3** | 3.17 Error Boundaries | Small | Medium — robustness |
| **P3** | 3.18 Keyboard Shortcuts | Small | Low — power users |
| **P3** | 3.19 Responsive | Medium | Medium — reach |
| **P3** | 3.20 Package Name | Tiny | Trivial |
| **P3** | 3.21 Real E2E Tests | Medium | Medium — confidence |

---

## 5. Suggested Implementation Order

### Phase 1: Core UX Fixes (P0)
1. 3.1 Instant Preview
2. 3.2 My Library
3. 3.14 Branch Bug Fix (quick win, do alongside 3.1)
4. 3.20 Package Name (trivial, do immediately)
5. 3.5 Fix Surprise Me (trivial, do immediately)

### Phase 2: Discoverability & Polish (P1)
6. 3.3 Free Topic Search
7. 3.4 Dark Mode Toggle
8. 3.7 API Caching
9. 3.6 URL State

### Phase 3: Power Features (P2)
10. 3.9 Font Metadata
11. 3.10 Variable Axes
12. 3.8 CSS Export
13. 3.12 Filter & Sort
14. 3.13 File Validation
15. 3.11 Comparison View

### Phase 4: Infrastructure (P3)
16. 3.16 CI Pipeline
17. 3.17 Error Boundaries
18. 3.21 Real E2E Tests
19. 3.19 Responsive
20. 3.18 Keyboard Shortcuts
21. 3.15 Self-Host Fonts

---

## 6. Technical Decisions

### 6.1 Font Parsing Library

**Recommendation:** `fontkit` (npm)
- Pure JavaScript, no native dependencies
- Reads name table, fvar (variable axes), OS/2 (weight class)
- Well-maintained, 2M+ weekly downloads
- Alternative: `opentype.js` (lighter but less complete)

### 6.2 Caching Strategy

**Recommendation:** SQLite table `api_cache` with TTL
- Consistent with existing stack (no new dependencies)
- Survives server restarts
- Key: `hash(query + page)` → value: JSON blob + expires_at
- Cleanup: lazy (delete on read if expired) + scheduled purge

### 6.3 URL State Management

**Recommendation:** Native `useSearchParams` + `useRouter` (no extra deps)
- Next.js 16 App Router native
- No additional state management library needed
- Works with `next/headers` for SSR if needed later

### 6.4 Font Preview CORS

**Concern:** Loading fonts from `raw.githubusercontent.com` via `@font-face` may hit CORS restrictions.

**Mitigation:** If CORS blocks raw URL loading, proxy through a local API endpoint:
- `GET /api/fonts/proxy?repo=...&path=...&branch=...` → streams the font binary with proper CORS headers
- Cache the response in `public/fonts/` after first fetch (effectively auto-saving on preview)

---

## 7. Non-Goals (Explicitly Out of Scope)

- **User accounts / authentication** — fontgrep is a local/single-user tool
- **Font editing** — not a font editor, just discovery and preview
- **Font conversion** — no ttf→woff2 conversion (could be a future feature)
- **Font hosting as a service** — fonts are served locally, not as a CDN
- **Google Fonts integration** — explicitly excluded (project ethos: GitHub-only fonts)
- **System font browser** — out of scope

---

## 8. Open Questions

1. **CORS on raw.githubusercontent.com** — Need to verify whether `@font-face` can load directly from raw URLs. If not, the proxy endpoint (6.4) becomes P0 alongside 3.1.
2. **Deployment target** — Vercel? Self-hosted? This affects SQLite viability (Vercel = ephemeral filesystem, SQLite won't persist). If Vercel: switch to Turso/libSQL or Postgres. If self-hosted: SQLite is fine.
3. **GITHUB_TOKEN scope** — Does the token need `repo` scope for private repos? Or just `public_repo` for public font repos? Affects README instructions.
4. **Font license display** — Should we parse the actual license file content, or trust the GitHub API's license detection? (GitHub's detection is often wrong for font repos.)

---

## 9. Success Metrics

| Metric | Current | Target |
|--------|---------|--------|
| Time from "View" to seeing font render | ∞ (requires Save) | < 2s (instant preview) |
| API calls per discover session | 6+ per page | 1 per page (cached) |
| Features usable without GITHUB_TOKEN | 0 | 0 (fundamental constraint, but cached results could serve stale data) |
| Saved fonts browsable in UI | No | Yes |
| Shareable URLs | No | Yes |
| Mobile usable | Unknown | Yes |
| Test coverage | 1 placeholder E2E + 6 unit tests | 7+ real E2E + expanded unit tests |

---

*End of PRD*
