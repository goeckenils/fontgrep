# Development Setup — github-font-indexer

> Tool zum Ausnutzen von GitHubs Code-Index für Font-/Typeface-Recherche, Discovery und Kuration.

## Prerequisites

### Required

| Tool | Version | Install |
|---|---|---|
| **Node.js** | 20.x or higher (recommend **22.x**) | nvm or apt via nodesource |
| **pnpm** | latest | `npm install -g pnpm` or `corepack enable pnpm` |
| **git** | 2.x | apt |

### Optional (depending on stack)

| Tool | Use |
|---|---|
| **Supabase CLI** | For local DB & migrations on Supabase projects |
| **Docker / podman** | If you run Postgres locally |
| **Playwright** | `npx playwright install --with-deps chromium` |
| **Tailscale** | VPS-/Mobile-Access via private network |

### Disk + RAM

- 5GB disk minimum (Node modules)
- 4GB RAM minimum (recommended 8GB if ML orbs involved)

## First-Time Setup

```bash
# 1. Project (after init-project.sh)
cd ~/projects/github-font-indexer

# 2. (already ran during init) install deps
pnpm install

# 3. Env-Vorlage kopieren
cp .env.example .env.local

# 4. Env lokales Set-up
# Editiere .env.local:
# - NEXT_PUBLIC_SUPABASE_URL
# - NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
# - NEXT_PUBLIC_SITE_URL (default http://localhost:3000)

# 5. DB-Migrationen anwenden (falls Supabase-Backend)
pnpm exec supabase db push   # oder scripts/migrate.sh

# 6. (optional) seed
pnpm exec ts-node supabase/seed_users.ts
# oder pnpm run seed

# 7. Dev-Server starten
PORT=3000 pnpm dev   # http://localhost:3000
```

## Common Commands

### Dev
```bash
PORT=3000 pnpm dev                        # Next.js dev als vordergrund
PORT=8889 pnpm dev                        # anderer port (für parallele Projekte)
pnpm build                                # production build
pnpm start                                # start prod server (ohne build, wenn schon built)
pnpm preview                              # build + start
```

### Quality
```bash
pnpm lint                                 # ESLint flat
pnpm lint -- --fix                        # auto-fix
pnpm typecheck                            # tsc --noEmit
pnpm format                               # Prettier write
pnpm format:check                         # read mode
```

### Tests
```bash
pnpm test                                 # Vitest
pnpm test:watch                           # Vitest mit reload
pnpm test:ui                              # Vitest UI
pnpm e2e                                  # Playwright E2E
pnpm e2e -- <test name>                   # spezifischer test
pnpm e2e:debug                            # UI debug inspiziert
```

### Database (Supabase)
```bash
pnpm exec supabase start                  # lokales supabase
pnpm exec supabase status                 # container-status
pnpm exec supabase migration new <name>   # neue migration
pnpm exec supabase db push                # migrationen -> remote
pnpm exec supabase db reset               # reset local (⚠ löscht data)
pnpm exec supabase gen types typescript   # regenerated types
```

### Process / Service
```bash
# Production via systemd:
sudo systemctl status github-font-indexer.service
sudo systemctl restart github-font-indexer.service
journalctl -u github-font-indexer.service -f
```

### Misc
```bash
pnpm dlx shadcn@latest add button         # ⭐ shadcn add
pnpm dlx shadcn@latest apply nova         # theme-wechsel (kein re-init needed)
pnpm dlx ts-node scripts/foo.ts           # one-off TS scripts
```

## Known Issues / Pitfalls

### `pnpm` nicht installiert?

```bash
# COREpack (built into Node 22):
corepack enable pnpm
# oder direct:
npm install -g pnpm
```

### Verschluckte node_modules

```bash
rm -rf node_modules .next
pnpm install
```

### Build-Cache-Probleme nach dependency-updates

```bash
rm -rf .next/cache
pnpm build
```

### shadcn-Component-Drift zwischen Projekten

- shadcn/ui: kopie geht on each `add` lokal ins repo (customized variant)
- Bei größeren Updates: `pnpm dlx shadcn@latest add <x> --overwrite` (vorsichtig)

### Supabase Auth Callback läuft nicht

`NEXT_PUBLIC_SITE_URL` muss die richtige Origin sein (z.B. `https://app.<domain>.de`). Für Dev: `http://localhost:3000`.

### Tailwind v4-class kollidiert mit v3-Doku

Tailwind v4 nutzt `@theme` und `var(--color-...)` statt `tailwind.config.ts`. Halten Sei sich an die shadcn-Generated `globals.css`-Vorlage.

## Worktree Setup (optional)

Multi-Branch-Development ohne context-switching-Overhead:

```bash
git worktree add ../github-font-indexer-feat-X feature/X
cd ../github-font-indexer-feat-X
PORT=8889 pnpm dev
```

## Credentials

KEINE hardcoded credentials in Commits. `.gitignore` enthält `.env`, `.env.local`.

Für CI: GitHub-/GitLab-/Vercei-Env-Vars manuell setzen. Niemals `.env*` committen.
