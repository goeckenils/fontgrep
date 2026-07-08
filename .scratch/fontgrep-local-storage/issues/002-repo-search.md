# ISSUE-002: Repository-Search statt Code-Search (echte Fonts)

**Goal:** `/api/fonts/discover` nutzt Repo-Search (topic:font) + Tree API, liefert echte
`.ttf/.woff2` statt README/LICENSE.

**Tasks:**
- [ ] `githubFontSearch.ts`: `buildRepoSearchQuery()` -> `/search/repositories?q=topic:font`
- [ ] Route `/api/fonts/discover` (GET): query + page
  - Repo-Search (topic:font, sort:stars)
  - pro Repo: `GET /repos/{o}/{r}` -> `default_branch`
  - Tree API `/repos/{o}/{r}/git/trees/{branch}?recursive=1`
  - filtere `.ttf/.otf/.woff/.woff2`
  - Response: `{ fonts: [{repository, path, branch, format, license}] }`
- [ ] Token-Auth + structured 401
- [ ] Verify: discover liefert echte Font-Files
