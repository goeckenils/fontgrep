# ISSUE-006: Cleanup alter data/-Mechanismus

**Goal:** Toter Code vom `data/fonts/` + `/api/font-file` Zeug entfernen.

**Tasks:**
- [ ] `FONTS_DIR_PATH` / `data/fonts/` entfernen
- [ ] `/api/font-file/[id]` Route löschen
- [ ] `getFontById` / `local_path` aus db.ts
- [ ] README/STACK: public/fonts + DB public_path dokumentieren
- [ ] Verify: Build/lint/test grün, kein toter Code
