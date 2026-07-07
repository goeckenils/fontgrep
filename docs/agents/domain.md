# Domain Docs — github-font-indexer

Where the project's **CONTEXT.md** (domain glossary) and **ADRs** (architectural decision records) live.

## Layout

Pick one:

- **Single-context** (default) — one `CONTEXT.md` at the repo root, one `docs/adr/` directory. Most projects are this.
- **Multi-context** — `CONTEXT-MAP.md` at the root points to per-context `CONTEXT.md` files. Only when the project is genuinely a monorepo with multiple domains.

This project: **single-context**.

## Files

- `CONTEXT.md` — domain glossary, ubiquitous language. Sharpened actively as work happens.
- `docs/adr/0001-<slug>.md` — one ADR per architectural decision, the "why" of choices made.

## Consumer rules (what skills expect)

When a skill reads the codebase and needs domain vocabulary, it must **read `CONTEXT.md` first** to learn the project's language. The glossary encodes what `cage device` means in this domain, what `enforce` vs `nudge` mean, etc.

When a skill is making a change that involves architecture (e.g. picking a queue, picking a cache, picking a state-machine shape), it must **read the relevant ADRs** in the area before suggesting changes. Past decisions constrain present options.

Maintenance rules:

- Adding a new term → add to `CONTEXT.md` and date the entry.
- Spotting a contradiction → open an ADR proposing the resolution.
- Sharpening during grilling → companion skill to `grill-with-docs` updates `CONTEXT.md` inline as the conversation crystallizes terms.

## See also

- Hermes skill `domain-modeling` — the active discipline that maintains these files
- Hermes skill `grill-with-docs` — pattern that uses these files as a side-effect
- Matt Pocock's upstream pattern: <https://github.com/mattpocock/skills/tree/main/skills/engineering/domain-modeling>
