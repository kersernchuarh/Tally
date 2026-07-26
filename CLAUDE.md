# CLAUDE.md — project notes for Claude Code

Read this at the start of any session on this project, alongside [PRD.md](PRD.md), [ROADMAP.md](ROADMAP.md), and [STRUCTURE.md](STRUCTURE.md).

## What this project is

**Tally** — a personal tracker (study time, habits, spending, unified into one `tracker` + `entry` model). Full spec in PRD.md. Build order in ROADMAP.md. File layout and reasoning in STRUCTURE.md.

## Working agreements

- **User is new to coding and to Claude Code.** This is their first app. Goal is learning the *workflow* of building with Claude Code, not hand-writing code themselves.
- **Build style: I write the code, they verify.** Do not make them type code or hand-hold through syntax unless they ask. Explain reasoning and tradeoffs freely when relevant — they want that — but don't narrate line-by-line unless asked.
- **Build one roadmap phase at a time.** Don't jump ahead into later phases even if it'd be quick. Each phase ends with something the user checks by hand in the browser ("Done when" in ROADMAP.md) before moving on.
- **If a mid-build decision contradicts the PRD, update the PRD.** Don't silently diverge from it — future sessions read it as ground truth.

## Hard technical constraints

- **No Node.js, no npm, no working Python installed.** Nothing in this project may require an install or a build step. Plain HTML/CSS/JS only, opened via `file://`.
- **No ES modules.** Browsers block `import`/`export` on `file://` URLs. Use classic `<script>` tags in the fixed load order below — never change this order without updating `index.html`'s script list to match.
- **`localStorage` is the only persistence**, under the key `tally.v1`, shaped exactly as in PRD.md §5. **Only `js/store.js` may reference `localStorage`.** Every other file goes through `App.store`.
- **Dates are stored as plain `"YYYY-MM-DD"` strings**, never JS `Date` objects, to avoid timezone bugs. See PRD.md §5 for why.

## File map (see STRUCTURE.md for full reasoning)

```
index.html            structure only
css/styles.css         all visual design
js/dates.js            date helpers            (built Phase 3)
js/format.js           number -> display text  (built Phase 2)
js/store.js            localStorage boundary   (built Phase 1, extended Phase 2)
js/view-today.js       Today tab                (built Phase 2)
js/view-summary.js     Summary tab              (built Phase 3)
js/view-trackers.js    Trackers tab             (built Phase 1)
js/app.js              boot + tab switching     (built Phase 0)
```

Load order in `index.html` is: dates → format → store → view-today → view-summary → view-trackers → app. Helpers before the files that use them; `app.js` last.

Everything attaches to one global `App` namespace (`App.store`, `App.dates`, `App.format`, `App.views.today`, etc.) — see STRUCTURE.md for why.

## Status

- [x] Phase 0 — skeleton, styles, tab navigation
- [x] Phase 1 — storage + tracker management
- [x] Phase 2 — logging + Today view
- [x] Phase 3 — weekly/monthly summary
- [ ] Phase 4 — export/import + polish

Update this checklist as phases complete.

## How to run it

Double-click `index.html`, or open it from a browser's File > Open. No server, no build, no install. `F12` opens DevTools for console errors and to inspect `localStorage` under Application → Local Storage.
