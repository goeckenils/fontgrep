# 20 — Keyboard Shortcuts

**Priority:** P3  
**Effort:** Small  
**Status:** Done

## Problem

No keyboard navigation. Power users can't operate the tool without mouse.

## Solution

### Shortcuts

| Shortcut | Action |
|----------|--------|
| `Cmd/Ctrl + K` | Focus search/topic input (context-aware: search input on search tab, topic on discover) |
| `Escape` | Close FontViewer |
| `Enter` | Open FontViewer (when a list item is focused) |
| `Arrow Down/Up` | Navigate list items |
| `S` | Save current font (when viewer open) |
| `C` | Copy CSS (when viewer open) |
| `C` | Open comparison view (when viewer open, if C not used for copy) |
| `R` | "Surprise me" (random font, when on discover tab) |
| `1` | Switch to Discover tab |
| `2` | Switch to Search tab |
| `3` | Switch to Library tab |
| `?` | Show keyboard shortcut help overlay |

### Steps

1. Add a global `useEffect` keydown listener in `page.tsx`
2. Track focused list item index (for arrow navigation)
3. When viewer open, shortcuts operate on viewer (S=save, C=copy CSS, ESC=close)
4. `?` opens a help overlay listing all shortcuts
5. Ignore shortcuts when typing in an input (check `e.target.tagName`)
6. Show shortcut hints in button tooltips (e.g., "Save font (S)")

### Files

- `src/app/page.tsx` — keyboard listener + focused item state
- `src/components/FontViewer.tsx` — escape handler
- `src/components/ShortcutsHelp.tsx` (new — overlay showing all shortcuts)

## Acceptance Criteria

- [ ] All shortcuts work without conflicting with text input
- [ ] `?` shows help overlay with all shortcuts listed
- [ ] Shortcuts are context-aware (viewer open vs. list view)
- [ ] Arrow keys move selection through list with visual highlight
- [ ] Enter opens the viewer for the focused item

### Done
Completed + committed in fontgrep 2026-revamp final pass (lint 0 errors, 41 unit tests green, build clean).
