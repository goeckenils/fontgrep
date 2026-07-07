# Deployment — github-font-indexer

> Tool zum Ausnutzen von GitHubs Code-Index für Font-/Typeface-Recherche, Discovery und Kuration.

## Pre-Deployment Checklist

Voraussetzungen vor jedem Deploy:

- [ ] **Tests grün** (`pnpm test && pnpm e2e`)
- [ ] **Typecheck** clean (`pnpm typecheck`)
- [ ] **Lint** clean (`pnpm lint`)
- [ ] **Format** clean (`pnpm format:check`)
- [ ] **Build** succeed (`pnpm build`)
- [ ] **Env vars** gesetzt (in Ziel-System)
- [ ] **Health-Check** antwortet (`/api/health`)
- [ ] **DB-Migrationen** gelaufen (Supabase / Postgres)
- [ ] **Smoke-Test** manuell durch User

## Hosting-Strategie

Drei realistische Varianten — auswählen nach Projekt:

### Variante A — Self-Hosted VPS (Ubuntu 22.04, Tailscale, systemd)

```bash
# 1. Repo clonen
ssh <VPS> "git clone git@github.com:goeckenils/github-font-indexer.git /srv/github-font-indexer"

# 2. Env schreiben
ssh <VPS> "cd /srv/github-font-indexer && cp .env.example .env"
# edit .env INLINE mit deinem Editor deiner Wahl

# 3. Install + Build
ssh <VPS> "cd /srv/github-font-indexer && pnpm install --frozen-lockfile && pnpm build"

# 4. systemd service
# Datei: /etc/systemd/system/github-font-indexer.service (siehe scripts/systemd-github-font-indexer.service)
ssh <VPS> "sudo install -m 644 scripts/systemd-github-font-indexer.service /etc/systemd/system/"
ssh <VPS> "sudo systemctl daemon-reload && sudo systemctl enable --now github-font-indexer"

# 5. Health
ssh <VPS> "curl -fsS https://<DOMAIN>/api/health | jq"
```

### Variante B — Vercel (oder Netlify)

```bash
# 1. In Vercel-Dashboard:
#    - neue Projekt aus goeckenils/github-font-indexer
#    - Env-Vars: NEXT_PUBLIC_*, SUPABASE_*

# 2. Production build settings:
#    - Build cmd:    pnpm build
#    - Output:       .next
#    - Install cmd:  pnpm install --frozen-lockfile

# 3. Auto-deploy von main branch via git push

# 4. Supabase env vars: aus Dashboard, sicherheits-relevante check
```

### Variante C — Docker (Multi-Service / ML-pipeline)

```bash
# Dockerfile + docker-compose.yml im project root
docker compose up -d --build
docker compose logs -f
```

## Rollback

**Immer möglich via:**

- **git rollback**: Vor-Deployment-Commit neu auschecken, `pnpm build && systemctl restart`
- **Vercel**: Dashboard → Deployments → Promote previous
- **DB-rollback**: separate Aufzeichnung welche migration-Version produktiv ist;
  bei Bedarf genaue `down` migration neu schreiben

## Monitoring

- **Health endpoint**: `GET /api/health` antwortet `{status, ts, env}` in <5ms
- **Logs**: `journalctl -u github-font-indexer.service -f` (systemd) | `vercel logs` (vercel)
- **Crash detection**: systemd restart policy in `.service` definiert (`Restart=always`)

## CI / GitHub Actions (optional)

```yaml
# .github/workflows/github-font-indexer.yml
name: ci
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-22.04
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
        with: { version: latest }
      - uses: actions/node@v4
        with: { node-version: 22, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm lint typecheck format:check
      - run: pnpm test
      - run: pnpm build
      - run: pnpm e2e --project=chromium
```

## Smoke-Test nach Deploy

```bash
# 1. Health-Check
curl -fsS https://<DOMAIN>/api/health

# 2. Auth-Flow
# Melde dich in einem Browser live an, prüfe:
#   - redirect-on-login funktioniert
#   - dashboard lädt
#   - DB-Queries klappen

# 3. Critical paths durch dein Feature
```

## Common Pitfalls

- **Static export**: `next.config.ts: output: 'export'` deaktivier SSR — vergiss nicht es zurückzunehmen für dynamic routes.
- **Supabase Service Role Key** niemals in client-side code oder public env vars
- **Vertragsbrüche**: Neue ENV-Vars müssen in `.env.example` UND auf host aufgeführt sein
- **Build cache zwischen deploys**: bei großen Frontend-Migrationen `rm -rf .next` bevor build
