# Tally — Development Roadmap

*Companion to [PRD.md](PRD.md). Feature IDs (F1–F12) refer to PRD §6.*

---

## How to read this

Each phase ends with something **you can look at and judge**. That's the whole principle. If a phase ends with "the storage layer is written," you have no way to know whether it's right — you're trusting me. If it ends with "type a tracker name, press refresh, and it's still there," you can verify it in five seconds without reading a line of code.

Every phase has:

- **Goal** — the one sentence describing what changes
- **Build** — what gets written
- **Done when** — the check *you* perform, by hand, in the browser
- **You'll learn** — the concept this phase is actually teaching
- **Commit** — the git commit message, so each phase is a save point you can return to

Order matters and isn't arbitrary. Storage comes before screens because screens with nowhere to save are a demo. Trackers come before entries because an entry needs a tracker to point at. Totals come after entries because you can't sum data that doesn't exist.

---

## Phase 0 — Skeleton

**Goal:** an empty but real app that opens in your browser and switches between three tabs.

**Build**
- `git init` and a first commit, so you have an undo button from the very start
- Full folder structure per [STRUCTURE.md](STRUCTURE.md)
- `index.html` with a header and three nav tabs: **Today · Summary · Trackers**
- `css/styles.css` with the complete visual design — colours, spacing, buttons, cards
- `js/app.js` doing nothing but tab switching; each tab shows a placeholder
- `CLAUDE.md` — project notes for *me* in future sessions (conventions, constraints, where things live)

**Done when:** you double-click `index.html`, it opens, it looks like an app rather than a 1996 webpage, and clicking the tabs switches the visible panel with no errors in the DevTools console (`F12`).

**You'll learn:** how a browser assembles HTML + CSS + JS; why script load order matters without modules; how to open DevTools and read the console — the single most important debugging skill in web development.

**Commit:** `Phase 0: app skeleton, styles, and tab navigation`

---

## Phase 1 — Storage and trackers *(F1, F2, F3, F10)*

**Goal:** you can create your real trackers and they survive a refresh.

**Build**
- `js/store.js` — the *only* file in the entire app allowed to touch `localStorage`. Load, save, and the create/rename/archive/delete operations for trackers.
- Data shape and `version: 1` exactly as PRD §5
- The **Trackers** tab: add a tracker (name + unit), list existing ones, rename, archive, delete-with-confirmation showing the entry count at risk

**Done when:** you create *your actual trackers* — the real ones you'll use — then press `F5`. They're all still there. Open DevTools → Application → Local Storage and you can see your own JSON sitting there.

**You'll learn:** persistence, and *separation of concerns* — why funneling all storage through one file means a future switch to a real database touches exactly one file instead of twelve. Also `JSON.stringify`/`parse`, and why IDs beat names.

**Commit:** `Phase 1: storage layer and tracker management`

---

## Phase 2 — Logging and Today *(F4, F5, F6, F7, F11, F12)*

**Goal:** the app becomes usable. This is the phase where it stops being a project and starts being a tool.

**Build**
- Entry create/delete in `store.js`
- The **Today** tab: each active tracker as a card showing today's total, with a quick-log button (F5)
- A log form: tracker, amount, date (defaulting to today), optional note
- Today's entries listed underneath, each deletable (F7)
- `js/format.js` — unit-aware display: `90` → `1h 30m`, `18.4` → `$18.40` (F11)
- Empty states: no trackers yet → "Create your first tracker"; nothing logged today → an encouraging nudge, not a blank void (F12)

**Done when:** you log a real study session and a real habit check, both appear immediately with correct formatting, deleting one removes it, and everything survives a refresh. **Then start actually using it** — don't wait for the remaining phases.

**You'll learn:** rendering a list from data, the render-on-change loop (change data → redraw from data, never edit the screen directly), form handling, and input validation.

**Commit:** `Phase 2: entry logging and Today view`

---

## Phase 3 — Summary *(F8, F9)*

**Goal:** the payoff. "6.5 hours of Math this week."

**Build**
- `js/dates.js` — `todayString()`, week start/end, month keys, and a *readable* week label like "Mon 20 – Sun 26 Jul"
- The **Summary** tab: Week / Month toggle, per-tracker totals, back/forward navigation through periods
- Empty period handling — an empty week must say "nothing logged" rather than showing zeros or nothing at all

**Done when:** you deliberately create test entries **on both sides of a week boundary** (e.g. Sunday and the following Monday) and confirm each lands in the correct week. Then check one total by hand with a calculator. This is the phase most likely to contain a silent bug, so verify it properly rather than trusting that it looks plausible.

**You'll learn:** grouping and aggregating data — the pattern behind every report, dashboard, and analytics screen you'll ever build. Plus date handling, which is genuinely one of the hardest things in software and where the PRD's date-string decision pays off.

**Commit:** `Phase 3: weekly and monthly summary view`

---

## Phase 4 — Safety and polish

**Goal:** v1 complete, and your data protected.

**Build**
- **Export to JSON file** and **import from JSON file** — the mitigation for the biggest risk in PRD §11. Local storage can be wiped by clearing browser data; without export, that's your whole history gone.
- Edit an existing entry (promoted from PRD §8 if it's proving annoying in daily use)
- Keyboard support: `Enter` submits, `Esc` closes
- Mobile-friendly layout, so it's usable if you ever open it on your phone
- Guard against corrupt or missing stored data instead of showing a white screen

**Done when:** you export a backup file, delete a tracker on purpose, re-import the backup, and everything comes back. You've now proved your data is recoverable, which is what turns an app into something you can trust with months of history.

**You'll learn:** file download/upload in the browser, defensive coding, and why "what happens when the data is broken?" is a question professionals ask early.

**Commit:** `Phase 4: JSON export/import, entry editing, and polish`

> ### 🎯 v1 is done here.
> Now satisfy PRD §12 criterion 4: **use it for seven days.** Real use will tell you which of the phases below you actually want — and that information is worth more than any guess we could make today.

---

## Phase 5 — Stretch *(optional, pick by desire)*

Each is independent. Do one, all, or none.

- **5a · Streaks** — "12 days in a row." Consecutive-date logic; a genuinely good exercise, and a classic source of off-by-one bugs worth meeting on purpose.
- **5b · Chart** — a bar chart per tracker over time, hand-drawn in SVG. No library needed, and you'll understand charts properly afterwards.
- **5c · Books / media** — a *collection*: items with status and progress rather than dated entries. New data shape, new screen, reuses the storage layer. This is where you'd learn to extend an existing design rather than restart.

---

## Phase 6 — Rebuild in React *(optional, the real learning payoff)*

Once the app works and you use it, rebuild the same app in React with Node and Vite installed.

Why this order is much better than starting with React: you'll already know exactly what the app does, so every single thing React changes stands out clearly against something you understand. Learning a framework and a problem domain simultaneously is how people end up cargo-culting code they can't debug. This way, React becomes "oh, *that's* what components solve" instead of magic.

**Commit:** on a branch, so your working vanilla version stays untouched.

---

## The loop we'll repeat every phase

This is the actual Claude Code workflow — the thing you said you wanted to learn:

```
1. You say "start Phase N"
2. I re-read the PRD + roadmap so I'm building the agreed thing, not an improvisation
3. I build only that phase
4. YOU open the browser and run the "Done when" check yourself
5. Broken? Tell me what you saw — the wrong number, the console error, the blank screen
6. Working? Commit. That's a save point you can always return to.
7. Next phase
```

Step 4 is the one people skip, and it's the one that matters. I can tell you code works; only you can confirm the app does what you wanted. Step 6 is your safety net — a committed working phase means no future change can lose you anything.

One more habit: if we decide something mid-build that contradicts the PRD, we **update the PRD**. A plan you've silently diverged from is worse than no plan, because next session I'll read it and confidently build the wrong thing.
