# Tech Stack

> Zentral, **autoritativ**, und versioniert mit dem Repo. Bei jeder Stack-Änderung
> gilt: erst `STACK.md` aktualisieren, *dann* `package.json`. So bleibt der Agent
> in zukünftigen Sessions kalibriert.

## Frontend

| Tool | Version | Zweck |
|---|---|---|
| **Next.js** | **16.x** (App Router) | SSR, Server Actions, API routes |
| **TypeScript** | **5.x** strict | Type safety |
| **Tailwind CSS** | **v4.x** (`@tailwindcss/postcss`) | Object-syntax, `@theme` direct in CSS |
| **tailwindcss-animate / tw-animate-css** | latest | Animation utilities |
| **shadcn/ui** | latest (`pnpm dlx shadcn@latest`) | Copy-Paste-Komponenten, code-owned |
| **Lucide React** | latest | Icons (KEINE emojis in UI) |
| **Motion** | `motion` (framer-motion-Nachfolger) | Mittel-komplexe Animationen |
| **GSAP** | latest | Wenn komplexe Sequenzen / Scroll-Linked |
| **class-variance-authority** | latest | Variant helpers (kommt mit shadcn) |
| **clsx + tailwind-merge** | latest | `lib/cn.ts` Helfer |

> **Animation-Wahlhilfe** (idempotent, jeden Tag gültig):
> - *klein* (hover, fade, slide, accordion) → `tw-animate-css` `[animation: ...]`
> - *mittel* (Page-Transition, Layout-Animation, Drag) → `motion` (framer-motion-Nachfolger)
> - *komplex* (Multi-Stage, Scroll-Linked, GPU-Layer) → GSAP
> Niemals *alle drei* parallel in einem Projekt.

## Backend

**Variante A — klein/mittel**: SQLite (NextAuth + Prisma) oder direct Postgres.

**Variante B — Standard**: Postgres via **Supabase** mit:
- **Postgres** 15.x (managed by Supabase)
- **Supabase Auth** (RSC + middleware cookie refresh)
- **Supabase Storage** (Proof-Fotos, etc.)
- **Realtime** (subscriptions)
- **Row Level Security** (RLS, RLS-Policies pro Tabelle)
- **Materialized views** für Lieaderboards / Aggregates

**Variante C — heavy ML-ops**: Separate Python 3.11 FastAPI sidecar (uv oder poetry), pro Microservice-Pattern, kommuniziert über http/JSON.

## Type / State / Validation

| Tool | Zweck |
|---|---|
| **Zod** | Input-Validation, schema source of truth |
| **React Hook Form** | Forms, preferably mit `zodResolver` |
| **Tanstack Query** | Server state caching, optimistic updates |
| **Supabase `createClient()`** | Server- und Client-side DB access (dual pattern) |
| **`generate` patterns** | TS types via `supabase gen types typescript` |

## Infrastruktur

| | |
|---|---|
| **VPS OS** | Linux Ubuntu 22.04+, x86_64 |
| **Networking** | Tailscale (private) |
| **Process Manager** | systemd (`/etc/systemd/system/...`) bevorzugt, sonst PM2 |
| **Container** | nur, wenn mehrere Services; sonst direct systemd |
| **Ports** | Frei wählbar pro Projekt, dokumentiert in `DEVELOPMENT.md` |

> RSG2: *„systemd over PM2"* — die letzten 11 Projekte haben alle in systemd integriert.
> PM2 ist legacy, wenn ein neuer Service gelaunched wird.

## Test / Quality

| | |
|---|---|
| **Vitest** | Unit + Integration |
| **Playwright** | E2E (browser) |
| **tsc --noEmit** | Typecheck |
| **ESLint flat** | Lint |
| **Prettier** | Tailwind-class-sort (`prettier-plugin-tailwindcss`) |
| **Husky + lint-staged** (optional) | Pre-commit hooks |

## Versions-Policy

- Patch/minor (automatisch): pin via renombrate/regression, nicht direkt in `package.json`
- Major: expliziter Plan mit Rollout-Notes in `CHANGELOG.md`
- Tailwind: aktuell halten — v3 → v4 migration ist seit 2025 da; wenn v5 erscheint, plan-migrieren, kein Hot-Patch

## Performance-Targets

| Metrik | Ziel |
|---|---|
| Page Load (3G) | < 2s |
| API Response (p95) | < 200ms |
| FCP (Lighthouse) | < 1.5s |
| LCP (Lighthouse) | < 2.5s |
| Bundle Size | < 100KB gzipped |

## Security-Defaults

- Secrets in `.env` / `.env.local` — **nie** in TS code oder in repository
- HTTPS only in production
- RLS on für **alle** Postgres-Tabellen (nicht nur für sensitive)
- Server-side Auth-Check in jeder Server Action / Route Handler
- Rate limiting on public endpoints
- Input-Validation via **Zod**, nicht handgemacht

## shadcn-Themes (siehe `STACK-shadcn-themes.md`)

shadcn-Themes werden **per-Init interaktiv abgefragt** (siehe `scripts/init-project.sh`).
Defaults aus dem Verlauf:
- *sissyos-core* → `style: base-nova, baseColor: neutral`
- *honorable silhouettes* (Fashion Portfolio) → `style: new-york, baseColor: zinc`

Vollständige Empfehlungs-Tabelle in `STACK-shadcn-themes.md`.

## Related Docs

- `README.md`        — Projekt-one-pager
- `FOLDER_STRUCTURE.md` — Wo lebt was?
- `AGENTS.md`        — Agent workflow (Spec → Plan → Build → Verify → Ship)
- `DEVELOPMENT.md`   — Local setup
- `DEPLOYMENT.md`    — Production deploy
- `STACK-shadcn-themes.md` — Theme-Empfehlungen
