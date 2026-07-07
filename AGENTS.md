# Agent Workflow — github-font-indexer

> Tool zum Ausnutzen von GitHubs Code-Index für Font-/Typeface-Recherche, Discovery und Kuration.

## Tech Stack Summary

- **Frontend:** Next.js 16 (App Router), TypeScript strict, Tailwind v4, shadcn/ui
- **Type/Validation:** Zod, RHF, TanStack Query
- **Styling/Anims:** tw-animate-css (klein), motion (mittel), GSAP (komplex) — nie alle drei parallel
- **Icons:** Lucide React (KEINE emojis)
- **Backend:** je nach Projekt (Supabase Postgres + RLS, SQLite, FastAPI sidecar — siehe `STACK.md`)
- **Tests:** Vitest (unit + integration), Playwright (E2E)
- **Linting:** ESLint flat, Prettier mit prettier-plugin-tailwindcss

## Folder Structure (siehe `FOLDER_STRUCTURE.md`)

- `src/app/`        — App-Router-Pages, Route-Handler, Server-Actions
- `src/components/` — UI-Components (shadcn/ui unter `src/components/ui/`)
- `src/lib/`        — Pure functions, `cn.ts` merger, `env.ts` validator, supabase clients
- `src/types/`      — TS-Types (oder inline)
- `tests/units/`    — Vitest-Suite
- `tests/e2e/`      — Playwright-Suite
- `supabase/`       — migrations / seed / tests (nur bei Supabase-Backend)
- `scripts/`        — bash: migrations, backup, deploy hooks

## Agent Rules (MANDATORY)

### 1. Check Skills First

```
skill_view(name='project-conventions')
skill_view(name='spec-driven-development')
skill_view(name='planning-and-task-breakdown')
skill_view(name='incremental-implementation')
```

Skills enthalten bewährte Workflows und Pitfalls.

### 2. Spec vor Code

NEVER ohne Spec starten. Nutze `spec-driven-development`.

Process:
1. PRD mit objectives, user stories, technical spec
2. User-Approval
3. Erst dann planen

### 3. Plan vor Code

`planning-and-task-breakdown`:
- atomic tasks (1–4h)
- Akzeptanzkriterien
- Dependency map
- Sort: deps → risk → user value

### 4. Test after every change

```bash
<PKG> typecheck       # tsc strict; keine .js-Edits in .ts-Projekten
<PKG> lint
<PKG> test
```

### 5. Inline Env-Vars

**Falsch:** `export PORT=8889` (persistiert in der shell session → kann Konflikte mit anderen Projekten auslösen)

**Richtig:** `PORT=8889 <PKG> dev`

### 6. Commit pro Milestone

```bash
git add . && git commit -m "feat: <imperativ>"
git push origin main
```

- nach jedem vertical slice
- nach jedem getesteten Feature
- vor Context-Switch

### 7. TypeScript-Only

```bash
ls tsconfig.json && echo "TS-Projekt: edit `.ts`/`.tsx` only"
```

### 8. No Emojis in UI

```tsx
import { Check } from 'lucide-react';
<div><Check className="w-4 h-4" /> Done</div>
```

### 9. Issue tracker = `.scratch/`

This project uses the local-markdown issue tracker (`.scratch/`) by default. Specs live at `.scratch/<feature-slug>/PRD.md`, slices live at `.scratch/<feature-slug>/issues/NN-<slug>.md`. See `docs/agents/issue-tracker.md` and the Hermes skills `local-issues-folder`, `to-prd`, `to-issues`, `triage`, `implement`.

## Agent skills

### Issue tracker

Local-markdown under `.scratch/`. External PRs: not a request surface. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical: `needs-triage` · `needs-info` · `ready-for-agent` · `ready-for-human` · `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context. `CONTEXT.md` at root + `docs/decisions/NNN-*.md` ADRs. See `docs/agents/domain.md`.

## Workflow-Phasen

| Phase | Skill | Output |
|---|---|---|
| 0. Orientation | — | `AGENTS.md` + `STACK.md` + `FOLDER_STRUCTURE.md` gelesen, skills geladen |
| 1. DEFINE | `spec-driven-development` | PRD mit User-Approval |
| 2. PLAN | `planning-and-task-breakdown` | Atomic tasks, dependency map |
| 3. BUILD | `incremental-implementation` + `test-driven-development` | V-Slice, getestet, committed |
| 4. VERIFY | `systematic-debugging` | Tests grün, performance in range, manual verification |
| 5. REVIEW | `requesting-code-review` (groessere Changes) | security scan, lint, manual review |
| 6. SHIP | `DEPLOYMENT.md` | production deploy + smoke test |

## Conventions

### File-Naming
- Components: `PascalCase.tsx` (z.B. `UserProfile.tsx`)
- Utilities: `camelCase.ts`
- Tests: `*.test.tsx` (vitest), `*.spec.ts` (playwright)

### Inline env-Vars (NICHT exportieren)

```bash
# falsch
export PORT=8889; <PKG> dev

# richtig
PORT=8889 <PKG> dev
```

### Component-Struktur

```tsx
import { useState } from "react";
import { Crop } from "lucide-react";
import { cn } from "@/lib/cn";

export function Component({ url }: { url: string }) {
  const [loading, setLoading] = useState(false);
  return <div className={cn("p-4", loading && "opacity-50")}>{url}</div>;
}
```

### API-Routes (App Router)

```ts
import { NextResponse } from "next/server";
import { env } from "@/lib/env";

export async function GET() {
  try {
    // logic
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("[API GET] failed", e);
    return NextResponse.json({ error: "internal" }, { status: 500 });
  }
}
```

### Error-Handling

```ts
try {
  await upload(file);
} catch (err) {
  console.error(err);
  toast.error("Upload failed");
  return { ok: false };
}
```

### Logging

```ts
console.log("...")   // dev only
console.info("...")  // user-action
console.warn("...")  // warning
console.error("...") // error
```

## Verification Checklist (after ANY change)

Code:
- [ ] `<PKG> typecheck` clean
- [ ] `<PKG> lint` clean
- [ ] `<PKG> format` clean

Tests:
- [ ] `<PKG> test` (= vitest) grün
- [ ] Manual browser verification
- [ ] Edge cases (empty state, loading, errors)

Git:
- [ ] `git add .` gestaged
- [ ] `git commit -m "..."` clean message
- [ ] `git push` ausgeführt

Docs:
- [ ] `README.md` upgedated wenn feature geändert
- [ ] `DEVELOPMENT.md` upgedated wenn setup geändert
- [ ] `docs/decisions/000X-*.md` neu falls architekturelle Entscheidung

## Common Pitfalls

1. **Skipping Orientation** — falsch: sofort coden. Richtig: AGENTS.md/STACK.md/FOLDER_STRUCTURE.md lesen
2. **Editieren von `src/main.js` in TS-Projekten** — niemals; nur `.ts`/`.tsx`
3. **Env-Var-Export** — inline, sonst Persistenz zwischen Sessions
4. **500-line PRs** — V-Slices 50-200 lines ideal
5. **"Ich teste manuell"** — Tests first, dann Implementation
6. **Specs skippen** — PRD + User-Approval vor Code
7. **Emojis ins UI** — Lucide-Icons only

## Emergency Procedures

### Build failed
```bash
rm -rf node_modules/.cache .next
<PKG> install
<PKG> build
```

### Tests fail after change
```bash
git diff                  # inspect
git stash                 # move changes safe
<PKG> test                # baseline
git stash pop
```

### Runtime-Error
```bash
<PKG> dev                    # foreground error logs
journalctl -u <SERVICE>.service -n 100                                # if service
tail -100 .next/logs/stdout.log 2>/dev/null || tail -100 /var/log/<SERVICE>.log  # usually
```
