# Fontgrep — Local Font Storage + Discovery Pipeline

Epic: Alle gefetchten Fonts lokal in `/public/fonts/` speichern (statt `data/`), mit DB-Ref
für Dup-Check. Discovery/Viewer zeigen die echte Font (nicht nur Repo-Link). Auto-fetch /
Infinite Scroll statt harter Limit-Grenze. Repository-Search + Tree API statt Code-Search,
damit echte `.ttf`/`.woff2` gefunden werden (Code-Search findet nur README/LICENSE).

## Issues

### ISSUE-001: public/fonts storage + DB schema migration
- [ ] `db.ts`: `fonts` Tabelle um Spalte `public_path TEXT` erweitern (statt nur `local_path`)
- [ ] Download-Route schreibt nach `public/fonts/<hash>.<ext>` (nicht `data/fonts/`)
- [ ] `public_path` = `/fonts/<hash>.<ext>` (direkt servierbar, kein API-Roundtrip)
- [ ] `source_url` bleibt Unique-Key für Dup-Check
- [ ] migrate.ts: Schema update (ADD COLUMN public_path)
- [ ] `.gitignore`: `public/fonts/` ausschließen (lokal, nicht im Repo)
- Verify: Font wird unter `/public/fonts/xxx.woff2` gespeichert, DB hat public_path

### ISSUE-002: Repository-Search statt Code-Search (echte Fonts)
- [ ] `githubFontSearch.ts`: neue Funktion `buildRepoSearchQuery` -> `/search/repositories?q=topic:font`
- [ ] neue Route `/api/fonts/discover` (GET, query + page):
  - ruft Repo-Search auf (topic:font, sort:stars)
  - pro Repo: Tree API `/repos/{o}/{r}/git/trees/{branch}?recursive=1`
  - filtert `.ttf/.otf/.woff/.woff2` Pfade raus
  - liefert Liste von `{ repository, path, branch, format, license }`
- [ ] Branch-Detection: `GET /repos/{o}/{r}` -> `default_branch`
- [ ] Token-Auth (GITHUB_TOKEN), structured 401 falls fehlt
- Verify: discover liefert echte Font-Dateien (nicht README)

### ISSUE-003: Auto-fetch / Infinite Scroll
- [ ] `/api/fonts/discover` paginiert via `page` param (GitHub Repo-Search `page`, Tree pro Repo)
- [ ] Cursor-basiert: letztes Repo als Start für nächste Charge
- [ ] UI: ScrollArea -> `onScroll`-Ende triggert `loadMore()`
- [ ] Lade-Indikator am Ende der Liste
- [ ] Verhindere Doppelladen (loading-flag, page-track)
- Verify: runterscrollen lädt automatisch weitere Fonts nach

### ISSUE-004: Discovery zeigt die Font selbst (nicht nur Repo)
- [ ] Viewer-Komponente nutzt `public_path` direkt als `@font-face src` (kein `/api/font-file`)
- [ ] Discover-Liste: Klick -> Viewer mit Preview der echten Font
- [ ] curated-fonts.ts: nur noch Fonts behalten, die wir auch wirklich laden können
  (oder Discover = reines Fetch-Ergebnis, curated nur als Fallback/Seed)
- [ ] Preview-Text-Input + Size/Weight-Slider im Viewer (schon vorhanden)
- Verify: Discovery rendert echte Schriftzüge, nicht nur Text-Links

### ISSUE-005: Download-Flow an public/ + Dup anpassen
- [ ] Button "Save font" in Viewer: POST `/api/fonts/download` mit repository/path/branch
- [ ] Route nutzt `public_path` in Response (nicht `/api/font-file/[id]`)
- [ ] FontViewer: `fontUrl` = `public_path` wenn vorhanden, sonst Download-Trigger
- [ ] Test: gleiche Font 2x -> `alreadyExists:true`, nur 1 Datei in public/fonts/
- Verify: Dedup funktioniert mit public storage

### ISSUE-006: Cleanup alter data/-Mechanismus
- [ ] `FONTS_DIR_PATH` / `data/fonts/` entfernen (nur noch public/fonts/)
- [ ] `/api/font-file/[id]` Route löschen (nicht mehr nötig)
- [ ] `getFontById` / `local_path` aus db.ts entfernen
- [ ] README/STACK dokumentieren: public/fonts + DB public_path
- Verify: kein toter Code, Build/lint/test grün
