# 17 — GitHub Actions CI Pipeline

**Priority:** P3  
**Effort:** Small  
**Status:** Done

## Problem

No CI. Tests, lint, typecheck, and build are all manual.

## Solution

`.github/workflows/ci.yml` running on every PR and push to main.

### Steps

1. Create `.github/workflows/ci.yml`:
   ```yaml
   name: CI
     on:
       push:
         branches: [main]
       pull_request:
         branches: [main]
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
2. Add branch protection rule: require CI to pass before merge
3. Later (issue 21): integrate Playwright E2E into CI with a separate job

### Files

- `.github/workflows/ci.yml` (new)

## Acceptance Criteria

- [ ] CI runs on every PR and push to main
- [ ] Lint, typecheck, unit tests, and build all run
- [ ] All checks must pass to merge
- [ ] Build completes within 3 minutes

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
