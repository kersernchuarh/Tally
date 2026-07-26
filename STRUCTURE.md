# Tally — Project Structure

*Recommended layout, with the reasoning behind each choice. Companion to [PRD.md](PRD.md) and [ROADMAP.md](ROADMAP.md).*

---

## The tree

```
my first app/
│
├── index.html          The single page. Structure only — no styling, no logic.
│
├── css/
│   └── styles.css      All visual design. The only file that decides how things look.
│
├── js/
│   ├── store.js        DATA    · the only file that touches localStorage
│   ├── dates.js        HELPER  · today, week ranges, month keys, date labels
│   ├── format.js       HELPER  · turns numbers into "1h 30m" / "$18.40" / "3"
│   ├── view-today.js   SCREEN  · renders the Today tab
│   ├── view-summary.js SCREEN  · renders the Summary tab
│   ├── view-trackers.js SCREEN · renders the Trackers tab
│   └── app.js          BOOT    · starts the app, handles tab switching
│
├── PRD.md              What we're building and why
├── ROADMAP.md          In what order
├── STRUCTURE.md        This file
├── CLAUDE.md           Notes for Claude in future sessions
└── README.md           How to open and use the app
```

Eleven files, seven of them code. Nothing is installed, nothing is generated, nothing is hidden.

---

## Why it's split this way

The organising principle is **one job per file** — and specifically, files grouped by *what kind of job* they do, not by which screen uses them.

### Three layers

```
        app.js              ← boot & navigation
           │
   ┌───────┴───────┐
   ▼               ▼
view-*.js  ←──  dates.js, format.js     ← screens, and helpers they share
   │
   ▼
store.js                                ← data
   │
   ▼
localStorage
```

Data flows **down** to storage and **up** to screens. Screens never touch storage directly; they ask `store.js`.

### The one rule that matters most

> **`store.js` is the only file that mentions `localStorage`.**

This looks like fussiness on an app this size. It isn't — it's the difference between a change that's cheap and a change that's a rewrite. If you later want cloud sync so your phone can see your data (PRD §8), you rewrite the inside of `store.js` and *nothing else changes*, because no other file ever knew where the data was kept. If instead every screen read `localStorage` directly, that same feature means hunting storage calls through six files and breaking three of them.

The general principle is called **separation of concerns**, and this is the clearest small example of it: put every decision that might change behind a single door.

### Why views are separate files

Each `view-*.js` owns one tab: it renders that screen from data, and handles clicks on that screen. Three tabs, three files. When the Summary totals are wrong you know exactly which file to open — and so do I, which makes me faster and more accurate too.

### Why `dates.js` and `format.js` exist at all

Both are small, and both would be tempting to inline. They're separate because:

- **They're shared.** Today and Summary both format minutes, and both need date logic. Duplicated code means fixing the same bug twice — and you'll only remember to fix it once.
- **They're the buggy parts.** Date math is where errors hide. Isolated in one small file, the logic can be reasoned about and checked on its own, instead of being tangled into rendering code.

---

## Naming conventions

- **Files:** lowercase with hyphens — `view-today.js`, never `ViewToday.js`. Consistency beats preference, and this is the common web convention.
- **Functions:** verbs — `addEntry()`, `renderToday()`, `formatAmount()`. A function name should say what it *does*.
- **The `App` namespace:** every file attaches to one global object, so nothing collides:
  ```js
  App.store  = { load, save, addTracker, addEntry, ... }
  App.dates  = { todayString, weekRange, monthKey, ... }
  App.format = { amount, unitLabel, ... }
  App.views  = { today, summary, trackers }
  ```
  One global, not twenty. When you read `App.store.addEntry(...)` you know instantly which file it lives in.

---

## The load order, and why it's not optional

In `index.html`, at the bottom of `<body>`:

```html
<script src="js/dates.js"></script>
<script src="js/format.js"></script>
<script src="js/store.js"></script>
<script src="js/view-today.js"></script>
<script src="js/view-summary.js"></script>
<script src="js/view-trackers.js"></script>
<script src="js/app.js"></script>
```

Classic `<script>` tags run **in order, top to bottom**, sharing one global scope. So helpers load before the files that use them, and `app.js` goes last because it starts everything and needs all the pieces present.

**Why not modern `import`/`export`?** Because you're opening the app as a local file (`file://`), and browsers block ES modules loaded that way — a security rule about local file access. You'd get a CORS error and a blank page. It's the classic trap for a first no-build project, and it's why the structure looks slightly old-fashioned. Real constraint, not a style choice. If you install Node later (Phase 6) and run a dev server, modules become available and the load-order problem disappears — which is precisely the problem modules were invented to solve.

Scripts go at the **bottom** of `<body>` so the HTML elements exist before any code tries to find them.

---

## What I'd change at 10× the size

Structure should fit the app, not a template. If Tally grew:

| At this point | Change |
|---|---|
| More than ~3 screens | `js/views/` subfolder |
| More than ~3 helpers | `js/lib/` subfolder |
| Real complexity in totals | `js/logic/` — calculations separate from rendering |
| Any automated tests | `tests/`, and pure helpers like `dates.js` become the first things tested |
| Node installed | ES modules, and `src/` for source vs. `dist/` for built output |

Deep folders on an eleven-file project cost you clicks and give you nothing. Flat now, nested when flatness starts to hurt — and you'll feel that when it happens.
