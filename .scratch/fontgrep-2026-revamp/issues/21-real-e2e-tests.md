# 21 — Real E2E Tests

**Priority:** P3  
**Effort:** Medium  
**Status:** Done

## Problem

`smoke.spec.ts` is a no-op — `toHaveTitle(/.*/)` matches literally anything. No real E2E coverage exists.

## Solution

Replace with real E2E tests covering core user flows. All tests run without a real GITHUB_TOKEN (mocked API).

### Test Cases

1. **Page loads** — home renders, discover tab active, heading visible
2. **Discover shows fonts** — (mock GitHub repo search + tree API) list shows font entries with family names
3. **Search flow** — switch to search tab, type "Inter" in filename mode, (mock code search) results appear, clicking a result opens viewer
4. **FontViewer opens** — click a font in discover list, viewer appears with preview text input, size slider, "Save font" button
5. **Save font** — (mock download) click "Save font", switch to Library tab, font appears in list
6. **Delete from library** — click delete on a saved font, font disappears from list
7. **Dark mode toggle** — click toggle, verify dark CSS variables applied (check `html` class)
8. **Topic search** — type "monospace" in discover topic input, (mock) new results load
9. **Surprise me** — click button, FontViewer opens with a random font
10. **Responsive** — run select tests at 375px viewport width

### Steps

1. Create `tests/e2e/mocks.ts` — GitHub API response fixtures (repo search, tree API, code search, raw font file)
2. Create `tests/e2e/fixtures/` — sample font files for mock responses
3. Update playwright config to use `webServer` config (auto-start dev server with `GITHUB_TOKEN=test-mock` env)
4. Replace `tests/e2e/smoke.spec.ts` with `tests/e2e/discover.spec.ts`, `tests/e2e/search.spec.ts`, `tests/e2e/library.spec.ts`, `tests/e2e/viewer.spec.ts`
5. Mock GitHub API using `page.route()` to intercept external requests

### Files

- `tests/e2e/mocks.ts` (new)
- `tests/e2e/discover.spec.ts` (new)
- `tests/e2e/search.spec.ts` (new)
- `tests/e2e/library.spec.ts` (new)
- `tests/e2e/viewer.spec.ts` (new)
- `tests/e2e/smoke.spec.ts` (remove)
- `playwright.config.ts` (update if exists, or create in root)

## Acceptance Criteria

- [ ] All 10 test cases pass
- [ ] Tests run without a real GITHUB_TOKEN
- [ ] GitHub API fully mocked via `page.route()`
- [ ] CI can run E2E tests (dependency on issue 17)
- [ ] Total E2E runtime < 60 seconds

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
