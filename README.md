# github-font-indexer

Tool zum Ausnutzen von GitHubs Code-Index für Font-/Typeface-Recherche, Discovery und Kuration.

## Quick Start

```bash
# Setup
github-font-indexer install 2>&1 | tee /tmp/install.log

# Env-Vorbereitung
cp .env.example .env
# Editiere .env mit deinen Werten (GitHub Token optional, für höhere Rate-Limits)

# Dev-Server
<PKG> dev        # http://localhost:3000

# Tests
<PKG> test       # unit (Vitest)
<PKG> exec playwright test  # E2E

# Quality
<PKG> lint typecheck format
```

## Was es macht

GitHub Font Indexer ist ein kleines Such-Tool, das den **Code-Index von GitHub** ausnutzt, um Open-Source-Fonts, Typefaces und deren Lizenzen zu finden, zu sichten und zu kuratieren — ohne durch endlose Repository-Dateien klicken zu müssen.

Hinterlegt ist eine API-Route (`/api/font-search`), die die GitHub Code-Search mit vier Suchmodi anspricht:

- **Filename** — Font-Dateien anhand ihres Namens, gescoped auf `path:fonts`.
- **Extension** — alle Font-Binaries (`ttf`/`otf`/`woff`/`woff2`) über eine OR-Query.
- **CSS @font-face** — sucht `font-family`-Deklarationen in CSS-Dateien (ideal, um zu sehen, wie ein Font eingebunden wird).
- **License** — findet `LICENSE`/`OFL.txt`/`FONTLOG.txt` und zeigt die erkannte Lizenz (SPDX) pro Treffer an.

Die Ergebnisse werden normalisiert (Format-Erkennung, Repository, Pfad, Lizenz) und in einer schadcn/ui-Oberfläche mit Format-Badges, Lizenz-Hinweis und direktem GitHub-Link dargestellt. Optional kann ein `GITHUB_TOKEN` gesetzt werden, um die Rate-Limits der Search-API anzuheben.

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, shadcn/ui, Lucide
- **Animation:** tw-animate-css (klein) + motion (mittel) / GSAP (komplex, siehe STACK.md)
- **Backend:** SQLite (better-sqlite3, siehe STACK.md)
- **Tooling:** pnpm, Vitest, Playwright, Prettier + Tailwind-class-sort
- **Quality:** ESLint flat, tsc --noEmit, Prettier

> **Volltext-Stack-Doku:** siehe `STACK.md` und `STACK-shadcn-themes.md`.

## Struktur (siehe `FOLDER_STRUCTURE.md`)

```
.
├── src/app/                  # App Router pages, route handlers, server actions
├── src/components/           # UI components (lucide, shadcn/ui)
├── src/lib/                  # Utilities, helpers, cn merger, env validator
├── src/types/                # TypeScript types
├── tests/units/              # Unit & integration tests (vitest)
├── tests/e2e/                # End-to-end tests (playwright)
├── data/                     # SQLite DB file (gitignored)
├── scripts/                  # Build/migration/backup scripts (bash)
├── docs/decisions/           # Architecture Decision Records
├── AGENTS.md                 # Agent-Workflow (MANDATORY-Pfad zur Orientierung)
├── STACK.md                  # Tech-Stack
├── STACK-shadcn-themes.md    # Theme-Empfehlungen
├── FOLDER_STRUCTURE.md       # Was geht wohin?
├── DEVELOPMENT.md            # Local-Setup
├── DEPLOYMENT.md             # Production-Deploy
└── README.md                 # Dieses Dokument
```

## Lizenz & Status

- Lizenz: MIT
- Status: WIP / experimental

> Dieses Projekt ist via `bash ~/project-templates/scripts/init-project.sh github-font-indexer` initialisiert.

## Theme (initialisiert)

- shadcn-Lib:  base
- preset:     nova
- baseColor:  neutral
- menu:       subdued / subtle

> Falls Du das Theme später ändern möchtest:
>   `pnpm dlx shadcn apply nova`
