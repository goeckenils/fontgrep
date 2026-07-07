# Issue Tracker: github-font-indexer

This project uses a **local-markdown issue tracker** under `.scratch/` at the repo root.

## Conventions

- One feature per directory: `.scratch/<feature-slug>/`
- The PRD is `.scratch/<feature-slug>/PRD.md`
- Implementation issues are `.scratch/<feature-slug>/issues/<NN>-<slug>.md`, numbered from `01`
- Triage state is a `Status:` line at the top of each issue file (see `triage-labels.md`)
- Comments and conversation history append to the bottom of each issue file under a `## Comments` heading

## When a skill says "publish to the issue tracker"

Create a new file under `.scratch/<feature-slug>/` (creating the directory if needed). Use the templates in the `local-issues-folder` skill:

- PRD template — light markdown, no frontmatter
- Issue template — YAML frontmatter + body sections

## When a skill says "fetch the relevant ticket"

Read the file at the referenced path. The user (or another skill) will normally pass either the issue number (`03`) or the full relative path.

## External PRs as a request surface

`<no|yes>` — one-line declaration. We default to **no** (treat PRs as not-a-request-surface). Flip to yes only if the project gets feature requests as PRs from external contributors.

## Switching trackers

If a future maintainer wants to migrate to GitHub Issues, Linear, or another tracker, the convention stays the same — only this file changes. The companion skills (`to-prd`, `to-issues`, `triage`, `implement`) all read this file as the source-of-truth declaration.

## See also

- `.scratch/README.md` — runtime convention
- Hermes skill `local-issues-folder` — the reusable convention definition
- Hermes skill `setup` — bootstraps `.scratch/` on a fresh project
