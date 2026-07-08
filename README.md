# github-font-indexer (fontgrep)

Tool zum Entdecken, Vorschauen und lokal Speichern von Open-Source-Fonts aus GitHub — ohne Google Fonts, ohne System-Fonts.

## Quick Start

```bash
# Deps
pnpm install

# Env-Vorbereitung (GitHub Token REQUIRED für Discovery/Suche)
cp .env.example .env
# Setze GITHUB_TOKEN=<dein token> in .env (fine-grained oder classic PAT)
# Ohne Token liefert die API github_auth_required (401)

# Dev-Server
pnpm dev        # http://localhost:3000

# Tests
pnpm test       # unit (Vitest)
pnpm exec playwright test  # E2E

# Quality
pnpm lint typecheck format
```

## Was es macht

fontgrep findet echte Open-Source-Font-Binaries (`.ttf`/`.otf`/`.woff`/`.woff2`) auf GitHub und zeigt sie **direkt als Vorschau** — nicht nur als Repo-Link.

- **Discover** — nutzt die GitHub **Repository-Search** (`topic:font`, sortiert nach Stars) + die **Git-Tree-API** pro Repo, um echte Font-Dateien zu finden (nicht nur README/LICENSE-Text wie bei der Code-Search). Lädt beim Runterscrollen automatisch weitere Fonts nach (**Infinite Scroll**).
- **Search** — GitHub Code-Search mit vier Modi (Filename / Extension / CSS @font-face / License), normalisiert zu Format + Repository + Pfad + SPDX-Lizenz.
- **FontViewer** — klick auf eine Font öffnet den Viewer als **Hauptansicht** (ersetzt die Liste). Preview-Text-Input, Size- & Weight-Slider. **Save font** lädt die Datei herunter.

### Lokale Speicherung + Dedup

- Fonts werden nach **`public/fonts/<uuid>.<ext>`** gespeichert → direkt per URL servierbar (`/fonts/...`), kein API-Roundtrip.
- SQLite (`data/fontgrep.db`) hält pro Font einen Record mit `public_path` + `source_url`.
- `source_url` ist **UNIQUE** → Doppelladen wird verhindert (Dedup), keine Clutter.
- `public/fonts/` und `data/` sind gitignored (lokal, nicht im Repo).

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, shadcn/ui (base-nova), Lucide
- **Backend:** Next.js Route Handlers + SQLite (better-sqlite3)
- **Tooling:** pnpm, Vitest, Playwright, Prettier + Tailwind-class-sort
- **Quality:** ESLint flat, tsc --noEmit, Prettier

## Projektstruktur

```
.
├── src/app/
│   ├── api/fonts/
│   │   ├── discover/route.ts   # Repo-Search + Tree API -> echte Fonts (paginiert)
│   │   ├── download/route.ts   # Font -> public/fonts/ + DB (dedup via source_url)
│   │   └── font-search/route.ts # GitHub Code-Search (4 Modi)
│   └── page.tsx                # Discover | Search Tabs + FontViewer (main view)
├── src/components/
│   ├── FontViewer.tsx          # @font-face preview, slider, save
│   └── ui/                     # shadcn/ui components
├── src/lib/
│   ├── db.ts                   # better-sqlite3 singleton + migrations
│   └── githubFontSearch.ts     # Query-Builder + Tree-Parsing
├── public/fonts/               # heruntergeladene Fonts (gitignored)
├── data/                       # SQLite DB (gitignored)
└── .scratch/                   # Issue-Tracker (local)
```

## Bekannte Limitationen

- Discovery nutzt `topic:font` als Default-Query. Eine freie Topic-Eingabe ist noch nicht im UI (hardcoded "font").
- Viewer rendert die Font erst nach **Save font** (Download in `public/fonts/`). Ein sofortiger Preview-Modus (vor dem Speichern) ist noch nicht implementiert.
- GitHub Rate-Limits: ohne Token sehr restriktiv. `GITHUB_TOKEN` setzen.

## Lizenz & Status

- Lizenz: MIT
- Status: WIP / experimental

> Initialisiert via `bash ~/project-templates/scripts/init-project.sh github-font-indexer`.
