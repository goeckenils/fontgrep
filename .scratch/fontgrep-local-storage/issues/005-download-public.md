# ISSUE-005: Download-Flow an public/ + Dup anpassen

**Goal:** "Save font" speichert nach public/fonts/ + Dup-Check via source_url.

**Tasks:**
- [ ] Viewer "Save font": POST `/api/fonts/download` (repository/path/branch)
- [ ] Route Response nutzt `public_path` (nicht `/api/font-file/[id]`)
- [ ] FontViewer: `fontUrl` = `public_path` wenn da, sonst Download
- [ ] Test: 2x gleiche Font -> `alreadyExists:true`, 1 Datei in public/fonts/
- [ ] Verify: Dedup mit public storage
