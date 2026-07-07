# github-font-indexer — Folder Structure

> Generiert von `bash ~/project-templates/scripts/init-project.sh github-font-indexer`.

## High-Level

```
./
├── src/                            # ALL Code (TS + lib)
│   ├── app/                        # Next.js App Router
│   │   ├── (public)/               # Public route group
│   │   ├── (auth)/                 # Auth-protected routes (login, signup)
│   │   ├── (dashboard)/            # Authed workspace
│   │   ├── api/                    # Route handlers (API endpoints)
│   │   │   └── health/             # Lightweight health check (>=DEPLOYMENT.md dep)
│   │   ├── layout.tsx              # Root layout
│   │   ├── page.tsx                # Home page
│   │   ├── globals.css             # Tailwind v4 + shadcn/ui CSS-variables
│   │   └── favicon.ico
│   ├── components/                 # UI components
│   │   ├── ui/                     # shadcn/ui generated (button, dialog, etc.)
│   │   └── features/               # feature-specific composites
│   │       └── <feature>/          # one subfolder per feature
│   ├── lib/                        # Pure functions / utilities
│   │   ├── cn.ts                   # shadcn/ui className merger (twMerge + clsx)
│   │   ├── env.ts                  # Zod-validierte process.env-Wrappers
│   │   ├── db.ts                   # better-sqlite3 connection (server-side)
│   │   └── <helpers>
│   └── types/                      # Globale TS-Types (oder per-file)
├── tests/
│   ├── unit/                       # Vitest-Suite
│   │   ├── cn.test.ts              # smoke test
│   │   └── <feature>.test.ts
│   └── e2e/                        # Playwright-Suite
│       ├── smoke.spec.ts           # first E2E (home page loads)
│       └── playwright.config.ts
├── data/                           # only wenn Backend = SQLite
│   └── fontgrep.db                 # gitignored SQLite file
├── scripts/                        # bash scripts (IDEMPOTENT)
│   ├── init.sh                     # one-shot env setup (npm, env vars)
│   ├── migrate.sh                  # db migration runner
│   ├── seed.sh                     # db seed runner
│   ├── backup.sh                   # db backup
│   └── deploy.sh                   # production deploy stub
├── docs/decisions/                 # ADRs (Architecture Decision Records)
│   └── 0001-record-name.md
├── public/                         # Static assets (LOGO, FAVICON, og-image)
├── .env.example                    # Template für .env / .env.local
├── .gitignore                      # Standard + dein Stack
├── package.json                    # alle deps (siehe STACK.md)
├── pnpm-lock.yaml                  # bevorzugt
├── tsconfig.json                   # strict
├── tailwind.config.ts              # nur wenn Tailwind v3, sonst v4 ohne
├── next.config.ts                  # Turbopack default, keine spezielle config nötig
├── components.json                 # shadcn-Konfiguration (theme, base-color, registries)
├── vitest.config.ts                # unit test config
├── playwright.config.ts            # E2E config
├── postcss.config.mjs              # Tailwind v4: @tailwindcss/postcss
├── eslint.config.mjs               # eslint flat config
├── .prettierrc                     # Prettier + plugin-tailwindcss
├── AGENTS.md                       # MANDATORY: Agent-Workflow
├── STACK.md                        # Tooling, Versionen, Decision-Rationale
├── STACK-shadcn-themes.md          # shadcn-Theme-Empfehlungen
├── FOLDER_STRUCTURE.md             # Dieses Dokument
├── DEVELOPMENT.md                  # Lokales Setup
├── DEPLOYMENT.md                   # Production-Deploy
├── CHANGELOG.md                    # ggf. release notes
└── README.md                       # one-pager
```

## Rules — wo lebt was?

| File | Ort |
|---|---|
| Pages, Route-Handler, Server-Actions | `src/app/...` |
| UI-Bausteine (general-purpose) | `src/components/ui/...` |
| Feature-Komposites | `src/components/features/<feature>/` |
| Lucide-Icons | `import from "lucide-react"` |
| Pure helpers | `src/lib/` (no React imports) |
| SQLite access | `src/lib/db.ts` (server-side only) |
| Env-validation | `src/lib/env.ts` (`z.object({...}).parse(process.env)`) |
| TypeScript types | inline OR `src/types/` für globals |
| Migrations | `supabase/migrations/*.sql` |
| ADR | `docs/decisions/NNNN-*.md` |
| Bash scripts | `scripts/...sh` (idempotent, set -eo pipefail) |
| Health endpoint | `src/app/api/health/route.ts` returns `{status, ts, env}` |

## Was **NIEMALS** ins Repo

```
.env / .env.local
node_modules/
.next/
dist/ build/
*.log
.DS_Store Thumbs.db
.vscode/ .idea/
uploads/    # user media
*.sqlite    # dev temp DB
```

## Was **NIE** duplizierst

- `package.json` deps ein 2. Mal inline definieren (`pnpm add` only)
- `.gitignore` von Hand aufsetzen (siehe Template — `init-project.sh` legt's richtig)
- `tsconfig.json` an mehreren Stellen (monorepo-Sub-Workspace, aber nicht pro folder)
- shadcn/ui-Komponenten selber schreiben (`shadcn add` only — code muss copyable bleiben)

## Hinzufügen / Ändern

| Bedarf | Aktion |
|---|---|
| Neue shadcn-Komponente | `<PKG> dlx shadcn@latest add <name>` |
| Neuer Backend-Service | `scripts/<service>.sh` + ADR in `docs/decisions/` |
| Neue Route-Page | `src/app/<route>/page.tsx` (App Router default) |
| Neue SQLite-Table | `scripts/migrations/NNN-<name>.sql` + `scripts/migrate.sh` |
| Neue Umgebungsvariable | `src/lib/env.ts` schema updaten + `.env.example` ergänzen |
| Theme-Wechsel | `<PKG> dlx shadcn@latest apply <preset>` (NOVEMBER 2025+) |
