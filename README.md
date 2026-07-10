# fontgrep

GitHub-native font discovery — no Google Fonts, no Adobe catalog, no license gatekeeping.

People commit font binaries to public repos whether or not they're properly licensed. fontgrep walks repo trees, groups families, and lets you **wander** until you stumble on something worth grabbing.

**For:** indie devs, designers, and font nerds who hunt GitHub instead of scrolling catalog homepages.

## Quick Start

```bash
pnpm install

cp .env.example .env
# GITHUB_TOKEN=<your token> — required for Discover/Search (401 without it)

pnpm dev        # http://localhost:3000

pnpm test       # unit (Vitest)
pnpm exec playwright test  # E2E

pnpm lint typecheck format
```

## What it does

fontgrep finds real font binaries (`.ttf` / `.otf` / `.woff` / `.woff2`) committed to GitHub and previews them inline — not just repo links.

### Discover (the product)

The core loop. Not "GitHub search with a skin."

- **Tree-walking** — scans repo trees via the Git Tree API to find binaries buried in `assets/`, `dist/`, and random folders that code search misses
- **Family intelligence** — groups files into families, dedupes across repos, surfaces variable fonts
- **Serendipity** — infinite scroll + topic chips + Treasure mode (indie repos, hidden gems, no mega-mirrors) so you wander into fonts you weren't querying for
- **Surprise** — opens a random font from the current board

Default mode is **Treasure**: hide Google Fonts mirrors, dedupe families, sort by lowest stars first.

### Search

GitHub Code Search with four modes (Filename / Extension / CSS @font-face / License). Useful when you know what you're looking for; Discover is for when you don't.

### FontViewer

Click a font → preview with custom text, size/weight sliders. Save to disk for local serving + CSS export.

### Library

Saved fonts from SQLite. Secondary to Discover — procurement, not the main draw.

## Local storage

- Fonts saved to `public/fonts/<uuid>.<ext>` → served at `/fonts/...`
- SQLite (`data/fontgrep.db`) tracks `public_path` + `source_url` (UNIQUE dedup)
- `public/fonts/` and `data/` are gitignored

## Tech stack

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, shadcn/ui, Lucide
- **Backend:** Next.js Route Handlers + SQLite (better-sqlite3)
- **Tooling:** pnpm, Vitest, Playwright

## Project structure

```
src/app/api/fonts/
  discover/     # Repo search + tree walk → families (paginated, treasure mode)
  preview/      # Proxy/preview unsaved fonts
  download/     # Save to public/fonts + DB
  library/      # Saved fonts gallery
  font-search/  # GitHub code search (4 modes)
src/components/
  AppSidebar.tsx    # Discover controls, topic chips, treasure toggle
  FontViewer.tsx    # @font-face preview, save, CSS export
  FontCompare.tsx   # Side-by-side comparison
src/lib/
  fontFilters.ts    # Treasure mode, family dedup, indie filters
  fontFamily.ts     # Filename → family grouping
  githubFontSearch.ts
```

## Philosophy

- **No license line** — if it's committed and public, it's in. License badges are context for you, not gatekeeping.
- **Anti-catalog** — Google Fonts and Adobe curate; GitHub doesn't. That's the loophole.
- **Discover > Library** — browsing and stumbling beat shopping and hoarding.

## Limitations

- Requires `GITHUB_TOKEN` for GitHub API access
- GitHub rate limits apply; responses are cached server-side
- Status: WIP / experimental

## License

MIT