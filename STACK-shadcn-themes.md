# shadcn/ui Theme Recommendations

> *Hintergrund*: ui.shadcn bietet heute ≥17 Style-Varianten × ≥5 Base-Colors × Menu-Toggle × Font-Toggle.
> Du wählst **pro Projekt interaktiv** via `scripts/init-project.sh` (nicht hartcodiert), weil
> der Look vom Produkt abhängt (editorial / consumer / dashboard / brand-driven).
>
> Dieses Dokument dient als **Schnellwahl-Tabelle** beim Prompt-Gewitter. *Marketing-Sprache ist
> hier ausdrücklich overkill: es geht um Con.**

---

## Empfehlungs-Tabelle

| Projekttyp | `style` | `baseColor` | `menuColor` | `menuAccent` | Anmerkung |
|---|---|---|---|---|---|
| **Dashboard / Admin Tool** | `new-york` | `neutral` | `subdued` | `subtle` | Tight, professional, hypoxic-ridig |
| **Consumer / Public-facing App** | `base-mira` | `zinc` | `default` | `vibrant` | Etwas Pop, etwas friendly |
| **Editorial / Brand-driven** | `base-nova` | `neutral` | `subdued` | `subtle` | *Strokes + Glow — du nutzt das* |
| **Marketplace / B2B** | `default` | `gray` | `default` | `subtle` | Standardshadcn, neutral-nirwana |
| **Hochästhetisch (Kundenpräsi)** | `base-vega` | `stone` | `subdued` | `vibrant` | Wenn viel Spacing + Glow gefragt |
| **Data-Heavy / Tabelle erstes UI** | `radix` | `slate` | `default` | `subtle` | Tabular numbers, ehrlich clean |
| **Mobile-First / iOS-ähnlich** | `base-mira` | `zinc` | `default` | `vibrant` | Rounded, soft haptics |

> **Farbpalette frisch prüfen**: shadcn fügt ca. alle 8 Wochen neue Styles hinzu. Diese Tabelle
> ist deine Vorliebe/Momentaufnahme, nicht der heilige Gral.

---

## Was du tunlichst **nicht**

- **Nicht `default` Style mit `baseColor: neutral` und hardcoded `#000000`-Headings**: führt
  oft zu ungewünschter Typographie mit negativem spacing-trap (eng wie Tailwind v3, ohne v4-spacing). Wenn unsure, `style: new-york`.
- **Nicht `radix` Style mit `menuAccent: vibrant`**: sehr crowded; wird als „billig" wahrgenommen wenn du kein anderes UI-disciplin hast.
- **Nicht zwischen Styles innerhalb desselben Projekts Mixen**: shadcn-registration behält das zuletzt gewählte Theme; mischen = inconsistenter Build.
- **Nicht `tailwindcss-animate` zusätzlich zu `tw-animate-css`**: doppelte `keyframes`-Kollision mit Tailwind v4. Wähle EINS.

---

## Defaults für deine Projekte (Stand 2026-06)

| Projekt | URL | Style | BaseColor | Notiz |
|---|---|---|---|---|
| **sissyos-core** | github.com/goeckenils/sissyos-core | `base-nova` | `neutral` | Adult App, dunkles Theme, Stripe-artig |
| **portfoliov2** | github.com/goeckenils/portfoliov2 | tbd | tbd | noch zu bestimmen |
| **hypno-training-app** | github.com/goeckenils/hypno-training-app | tbd | tbd | noch zu bestimmen |
| **fortunetellerui** | github.com/goeckenils/fortunetellerui | tbd | tbd | noch zu bestimmen |
| **needmore** | github.com/goeckenils/needmore | n/a | n/a | anderes Stack (Music) |

> **Lückentabelle**: 5 von deinen 11 aktiven Repos haben keinen shadcn-init dokumentiert. Das ist ein Indiz
> dass sie entweder ein älteres Stack haben, oder das `project-templates/`-Setup nie greift.

---

## Workflow

1. Erstelle ein neues Projekt: `bash ~/project-templates/scripts/init-project.sh <name>`
2. Skript läuft mit `pnpm` und ruft `pnpm dlx shadcn@latest init` ***interaktiv*** auf
3. Wenn non-tty: Skript nutzt `SHADCN_STYLE=base-nova SHADCN_BASE_COLOR=neutral 1 bash init-project.sh`
   oder du übergibst Env-Flags. Die Defaults sind:
   ```bash
   SHADCN_STYLE=base-nova
   SHADCN_BASE_COLOR=neutral
   SHADCN_MENU_COLOR=default
   SHADCN_MENU_ACCENT=subtle
   SHADCN_RTL=false
   ```
4. Erste Aktion danach: `pnpm dlx shadcn@latest add button input dialog card tabs ...`
5. Theme-Wechsel später: `pnpm dlx shadcn@latest init` (es fragt dich erneut)

## Siehe auch

- shadcn create-page: <https://ui.shadcn.com/create>
- Theme generator: <https://tweakcn.com/> (für punktuell-eigene Anpassungen)
- Deine `STACK.md` (zentrale Stack-Doku, andere Versionen hier aufgegriffen)
