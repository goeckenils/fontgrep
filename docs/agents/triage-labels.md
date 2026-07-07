# Triage Labels — github-font-indexer

The state machine that `triage` walks an issue through.

## Categories (one per issue)

- `bug` — something is broken
- `enhancement` — new feature or improvement

## States (one per issue)

| Status | Meaning |
|---|---|
| `needs-triage` | Maintainer needs to evaluate |
| `needs-info` | Waiting on reporter / specifier |
| `ready-for-agent` | Fully specified, AFK agent can pick it up with no human context |
| `ready-for-human` | Needs human implementation / judgement |
| `wontfix` | Will not be actioned |

The labels on each issue file appear as the `Status:` line in YAML frontmatter. The `Category:` frontmatter line carries the category.

Every triaged issue should carry exactly one category and one state.

## State machine

```
                 needs-triage
                 /    |     \
                ↓     ↓      ↓
        needs-info   ready-for-agent   ready-for-human   wontfix
             ↓
        needs-triage (after reporter reply)
```

Default starting state for every new issue: `needs-triage`.

## Overrides

By default we use the canonical role names. If this repo has legacy git-labels that should be mapped instead, list them here:

```yaml
needs-triage:
  - "status: needs-review"   # legacy GitHub label
  - "triage: pending"
needs-info:
  - "status: blocked"
ready-for-agent: []
ready-for-human: []
wontfix:
  - "status: rejected"
```

If the repo has zero existing labels, leave the override list empty — the defaults are correct.

## See also

- Hermes skill `local-issues-folder` — the reusable convention definition
- `.scratch/README.md` — runtime vocabulary
