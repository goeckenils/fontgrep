# 09 — GitHub API Caching & Rate Limit Resilience

**Priority:** P1  
**Effort:** Medium  
**Status:** Done

## Problem

Every discover request hits GitHub API (repo search + N tree fetches). With `PER_PAGE=5` repos and `MAX_FONTS=30`, that's up to 6 API calls per page load. No caching, no rate-limit header parsing, no 429 retry, no backoff. Free token burns through quickly.

## Solution

### Steps

1. **Server-side cache** — SQLite table `api_cache`:
   ```sql
   CREATE TABLE api_cache (
     cache_key TEXT PRIMARY KEY,
     response_json TEXT NOT NULL,
     expires_at TEXT NOT NULL,
     created_at TEXT NOT NULL DEFAULT (datetime('now'))
   );
   ```
   - Key: `sha256(query + "|" + page + "|" + endpoint)` 
   - TTL: 1 hour (configurable via `CACHE_TTL_HOURS` env)
   - On cache hit: return cached JSON, skip GitHub API entirely
   - On cache miss: fetch from GitHub, store response
   - Lazy cleanup: delete expired entries on read

2. **Rate-limit awareness** — parse `X-RateLimit-Remaining` and `X-RateLimit-Reset` headers:
   - If remaining < 5: return 429 with `retry-after` + human-readable message
   - Include `x-ratelimit-remaining` in API response headers for client visibility

3. **Client-side cache** — cache discover results in `sessionStorage`:
   - Key: `discover:${topic}:${page}`
   - TTL: session lifetime
   - Tab switches don't re-fetch if cached

4. **429 handling in UI** — when API returns 429:
   - Show a prominent message: "GitHub rate limit reached. Try again in X minutes."
   - Disable load-more button until retry time
   - Countdown timer to retry

### Files

- `src/lib/githubCache.ts` (new — cache get/set + rate-limit parsing)
- `src/lib/db.ts` — add `api_cache` table + get/set functions
- `src/app/api/fonts/discover/route.ts` — use cache, parse rate-limit headers
- `src/app/api/font-search/route.ts` — same
- `src/app/page.tsx` — sessionStorage cache for discover results

## Acceptance Criteria

- [ ] Repeated discover calls with same params don't hit GitHub API within TTL
- [ ] Rate limit errors show human-readable message with retry time
- [ ] Client-side: switching tabs and back doesn't re-fetch if cached
- [ ] Cache entry auto-expires after TTL
- [ ] No change to response format (transparent to frontend)

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
