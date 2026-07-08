# ISSUE-003: Auto-fetch / Infinite Scroll

**Goal:** Discovery lädt beim Runterscrollen automatisch weitere Fonts nach.

**Tasks:**
- [ ] `/api/fonts/discover`: `page` param (GitHub Repo-Search page)
- [ ] Cursor: letztes Repo als Anchor für nächste Charge
- [ ] UI: ScrollArea `onScroll` -> Ende erkennen -> `loadMore()`
- [ ] Lade-Indikator
- [ ] `loading`-Flag + page-Tracking gegen Doppelladen
- [ ] Verify: Scroll lädt weitere Fonts ohne Button
