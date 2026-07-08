# ISSUE-001: public/fonts storage + DB schema migration

**Goal:** Fonts werden nach `public/fonts/<hash>.<ext>` gespeichert (direkt servierbar),
DB hält `public_path` für Dup-Check. `data/fonts/` wird abgelöst.

**Tasks:**
- [ ] `src/lib/db.ts`: `fonts` Tabelle um `public_path TEXT` erweitern
- [ ] Download-Route schreibt nach `public/fonts/<hash>.<ext>` statt `data/fonts/`
- [ ] `public_path` = `/fonts/<hash>.<ext>`
- [ ] `source_url` bleibt Unique-Key
- [ ] `scripts/migrate.ts`: `ALTER TABLE fonts ADD COLUMN public_path TEXT`
- [ ] `.gitignore`: `public/fonts/` ausschließen
- [ ] Verify: Datei landet in `public/fonts/`, DB-Query liefert `public_path`
