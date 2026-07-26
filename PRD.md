# Tally — Product Requirements Document

*Working title; rename freely. Version 1.0 · Written 2026-07-26 · Status: approved for build*

---

## 1. One-liner

A local, browser-based personal tracker that lets me define my own trackers — study time, habits, spending — log entries against them in seconds, and see what I've done today and how it adds up this week and month.

## 2. Problem

I want to know where my time and money actually go, but the things I'd track live in different places: study hours in my head, habits nowhere, spending in a banking app that doesn't tell me anything useful. Existing apps are either single-purpose (habit-only, budget-only) or bloated with accounts, subscriptions, and social features I don't want. I want one place, private to my machine, that takes five seconds to log into and immediately shows me a number I care about.

## 3. User

One user: me. No sharing, no collaboration, no accounts. Every design decision may assume a single trusted user on a single machine.

## 4. Core concept

The insight this whole app is built on: **the things I want to track are the same shape.**

| What I wanted | One record is | Unified as |
|---|---|---|
| Study time | Math, 45 minutes, today | amount `45`, unit `minutes` |
| Habits | Read, done, today | amount `1`, unit `count` |
| Spending | Groceries, $18.40, today | amount `18.40`, unit `dollars` |

So there is no "habit feature" and no "money feature". There are **two kinds of data**:

- **Tracker** — a thing I've decided to measure, and the unit it's measured in. *("Math study, in minutes")*
- **Entry** — one recorded amount, on one date, belonging to one tracker. *("45, on 2026-07-26")*

Every screen in the app is a different view of those two lists. Adding a new kind of tracking means creating a tracker, not writing code.

## 5. Data model

Stored as a single JSON object in browser `localStorage` under the key `tally.v1`.

```jsonc
{
  "version": 1,
  "trackers": [
    {
      "id": "t_k3x9",              // generated, never reused, never changes
      "name": "Math study",
      "unit": "minutes",           // "minutes" | "count" | "dollars"
      "color": "#3182ce",          // decorative accent dot, auto-assigned from a fixed palette
      "archived": false,           // hidden from Today, but its entries survive
      "createdAt": "2026-07-26T14:02:11.000Z"
    }
  ],
  "entries": [
    {
      "id": "e_p71q",
      "trackerId": "t_k3x9",       // points at a tracker
      "amount": 45,                // always a number, in the tracker's unit
      "date": "2026-07-26",        // local calendar date, YYYY-MM-DD
      "note": "past papers",       // optional, may be ""
      "createdAt": "2026-07-26T14:02:11.000Z"
    }
  ]
}
```

### Design decisions inside the model, and why

- **`date` is a plain `"YYYY-MM-DD"` string, not a `Date` or a timestamp.** This is deliberate and it prevents the single most common bug class in tracker apps. Timestamps carry timezones, so "11pm Saturday" can silently land in Sunday's bucket. A local calendar date has no timezone to get wrong, it sorts correctly as plain text, and grouping by month is `date.slice(0, 7)`.
- **`createdAt` is a full timestamp** and is separate from `date`. `date` is *when it happened*; `createdAt` is *when I typed it in*. They differ whenever I back-fill yesterday.
- **Entries reference a tracker by `id`, not by name.** This is why renaming "Math study" to "Maths" won't orphan three months of history. Stable IDs are the reason databases use them.
- **Deleting a tracker is a real decision.** Deleting it must either delete its entries too or be blocked — a dangling `trackerId` is a broken app. v1 archives by default and requires explicit confirmation to delete, stating how many entries will go with it.
- **Money is stored as a plain number rounded to 2 decimals.** Financial software stores integer cents to dodge floating-point rounding. For a personal tracker the error is invisible, so I'm accepting the simpler version knowingly — noted here so future-me knows it was a choice, not an oversight.
- **`version: 1` is future insurance.** When the shape changes later, code can detect old data and upgrade it instead of crashing on it.

## 6. v1 features (must have)

| ID | Feature | Detail |
|---|---|---|
| **F1** | Create a tracker | Name + unit (minutes / count / dollars). Name required, must be non-empty and unique. |
| **F2** | Rename a tracker | Entries keep pointing at it. |
| **F3** | Archive / delete a tracker | Archive hides it. Delete requires confirmation and states the entry count it will destroy. |
| **F4** | Log an entry | Pick tracker, enter amount, date defaults to today, optional note. |
| **F5** | Quick-log | One tap logs a sensible default from the Today screen (`1` for count units) without opening a form. |
| **F6** | Today screen | Every active tracker with today's total, plus the list of today's individual entries. |
| **F7** | Delete an entry | Mistakes must be fixable. Non-negotiable for any app that stores what you type. |
| **F8** | Weekly totals | Per-tracker totals for the current week, with navigation to previous weeks. |
| **F9** | Monthly totals | Same, per calendar month. |
| **F10** | Persistence | Everything survives closing the browser and reopening the file. |
| **F11** | Unit-aware display | `90` minutes reads as `1h 30m`; dollars read as `$18.40`; counts read as `3`. Raw numbers are stored; formatting is presentation. |
| **F12** | Empty states | A new app with no trackers must tell me what to do, not show a blank page. |

## 7. Out of scope for v1 — explicitly

Naming what we are *not* building is as important as naming what we are. These are not oversights:

- No user accounts, login, or passwords
- No server, API, or database
- No syncing between devices; no phone version
- No internet connection required, ever
- No notifications or reminders
- No sharing, export to social, or multi-user anything
- No charts (parked — see below)
- No streaks (parked)
- No books/media tracking (parked — different data shape)

## 8. Parked, not rejected

Wanted, deliberately deferred so v1 can finish:

- **Streaks** — "12 days in a row". Needs careful consecutive-date logic.
- **Charts** — a bar chart per tracker over time.
- **Books / media** — a *collection*: items with changing status and progress, not dated log entries. This is a genuinely different data shape and deserves its own model rather than being forced into `trackers`/`entries`.
- **Editing an existing entry** (v1 only deletes and re-adds).
- **Cloud sync**, if I ever actually want my phone.
- **Budgets** — a monthly spending cap per dollar-unit tracker with a progress bar. The one thing typical money-manager apps have that a plain log doesn't; dollar-unit trackers already double as expense categories, so this is a small addition on top rather than a new concept.

## 9. Technical decisions

| Decision | Choice | Why | Revisit when |
|---|---|---|---|
| Platform | Web page, opened locally | No install, no server, works offline | I want it on my phone |
| Stack | Plain HTML + CSS + JavaScript | Zero dependencies; every line is readable; nothing between me and the browser | I outgrow manual DOM updates |
| Framework | None | React solves problems I don't have yet at this size | Phase 6, as a deliberate learning exercise |
| Storage | `localStorage`, single key | Built into every browser; no setup; trivially inspectable in DevTools | Data outgrows ~5MB (thousands of entries away) |
| Script loading | Classic `<script>` tags, one global `App` namespace | ES modules are **blocked by browser CORS rules on `file://`** — a real constraint, not a preference | I install Node and run a local dev server |
| Build step | None | Nothing to break, nothing to install, nothing to learn twice | Never, for this app |
| Version control | Git, one commit per roadmap phase | Git is already installed; commits give me a working state to return to | Now |

## 10. Constraints

- Windows 11. Git installed. **No Node.js, no npm, no working Python** — the app must run with nothing installed.
- Runs from `file://`, which means: no ES modules, no `fetch` of local files, and `localStorage` on `file://` may be shared across other local pages in some browsers — hence the namespaced `tally.v1` key.
- Target browser: Edge or Chrome (both preinstalled on Windows 11).

## 11. Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Clearing browser data wipes `localStorage` | All history lost | **Export/import JSON backup, built in Phase 4.** This is the main structural weakness of local storage and it must not be skipped. |
| Scope creep back toward charts/streaks/books | v1 never ships | They're written down in §8. Nothing from §8 starts until §6 is done and used. |
| App gets built but not used | No feedback, no motivation | Success is measured by real use (§12), not by "it works" |
| Timezone / week-boundary date bugs | Wrong totals, quietly | Date-string design (§5) plus explicit week-boundary checks in Phase 3 |

## 12. Success criteria

v1 is done when all of the following are true:

1. Every feature F1–F12 works.
2. I can create a tracker, log against it, close the browser, reopen the file, and my data is there.
3. Weekly and monthly totals are verifiably correct — checked by hand against entries I deliberately placed on either side of a week boundary.
4. **I have used it for 7 consecutive days without asking for a code change to keep using it.**

Criterion 4 is the real one. The first three prove the app runs; the fourth proves it's a tool.

## 13. Post-v1 additions (2026-07-27)

A design-and-features pass done after v1 shipped, requested as "make the design better in general" plus a set of specific features. Kept here as a dated addendum rather than rewritten into §6–9, so those sections stay an accurate record of what v1 actually was.

| Addition | What it does | Notes |
|---|---|---|
| **Dark mode** | Follows the OS/browser color-scheme preference automatically | No in-app toggle — every color was already a CSS variable, so this is a `prefers-color-scheme: dark` override block |
| **Per-tracker color** | A small colored dot next to a tracker's name, everywhere it appears | Auto-assigned from a fixed palette in creation order; existing trackers from before this feature get one deterministically backfilled on next load (§5's `color` field) |
| **Unit emoji** | ⏱️/✅/💰 shown next to unit labels and in tracker pickers | Pure presentation, lives in `format.js` alongside `amount()` |
| **Repeat last entry** | One-tap button on Today that re-logs your most recent entry (among active trackers) with today's date | Extends F5's "quick log" idea beyond count-unit trackers |
| **CSV export** | A second export option alongside the JSON backup, for opening in a spreadsheet | One-way — only the JSON backup round-trips through Import |
| **Year / All-time summary** | Two more modes alongside F8/F9's Week/Month | "All time" has no prev/next — there's only one such period |
| General visual polish | Hover states, transitions, and consistent focus outlines across buttons/cards/rows | No new concepts, just consistency |

None of this changes v1's success criteria in §12 — it's additive polish and small features on top of a spec that was already complete and in daily use.
