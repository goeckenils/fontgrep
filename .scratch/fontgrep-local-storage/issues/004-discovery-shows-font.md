# ISSUE-004: Discovery zeigt die Font selbst

**Goal:** Discovery/Viewer rendern die echte Schrift via `@font-face`, nicht nur Repo-Link.

**Tasks:**
- [ ] Viewer nutzt `public_path` direkt als `@font-face src`
- [ ] Discover-Liste: Klick -> Viewer mit echter Font-Vorschau
- [ ] curated-fonts.ts: nur Fonts behalten die wir laden können (oder Discover = Fetch-only)
- [ ] Preview-Text + Size/Weight-Slider (schon da)
- [ ] Verify: echte Schriftzüge sichtbar, nicht nur Text-Links
