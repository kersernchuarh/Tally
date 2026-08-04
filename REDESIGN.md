# Tally — Habit-Tracker-Inspired Redesign

*Phase 1 analysis + Phase 2 roadmap. Written 2026-07-27, before any code changed. Companion to [PRD.md](PRD.md) and [ROADMAP.md](ROADMAP.md) — this document doesn't replace either, it's a separate initiative layered on top of an already-complete, already-hosted v1.*

---

## 0. What this document is

A structured before/after comparison between the current app and a set of habit-tracker design patterns (Loop, Habitica, Streaks, Habitify, Productive, plus a generic "next-gen habit tracker" concept mockup — all from one inspiration collage), followed by a milestone-by-milestone plan to bring the *patterns* into Tally without discarding what already works.

**One important scoping note, upfront:** the inspiration image's mockup — coincidentally also called "Tally" — is a different, unrelated habit-only concept from a design template, not a spec for *this* app. It's being read for patterns (dashboards, progress rings, habit detail, calendars), not copied.

**A second scoping note that shapes everything below:** the real Tally isn't a habit tracker — it's a *unified logging tool* across three unit types (minutes, count, dollars). Every habit-tracker pattern that assumes "did I do the binary daily thing" (checkbox grids, pure streak-counting) has to be generalized to also make sense for "how many dollars did I spend" or "how many minutes did I study," or it doesn't fit the app's actual data model (PRD.md §4).

---

## 1. Phase 1 — Analysis

### 1.1 Current Tally, factually

- **Shell:** header (gradient logo mark + gradient wordmark + today's date) → a segmented-pill tab bar (Today / Summary / Trackers, text-only, no icons) → one `<main>` containing all three views (only one visible at a time via a CSS class) → a one-line footer. Single column, `max-width: 640px`, centered — desktop and mobile share the same layout, just narrower.
- **Navigation:** three top tabs. No bottom nav, no icons, no floating action button, no drill-down screens — every tracker's data (today's total, historical totals, management) is a *row in a list*, never its own page.
- **Information hierarchy:** flat. Today shows a log form, then a grid of tracker summary cards, then a flat list of today's entries. Summary shows a mode toggle, a totals list, then a search box + result list. There's no "hero" stat, no single most-important number per screen — everything is roughly equal visual weight.
- **Typography:** one system font stack, sizes from 0.75rem–1.4375rem, weight 600–800 for emphasis. No display/heading font pairing, no oversized numerals for stats.
- **Colour:** an indigo (#6366f1) + pink (#ec4899) palette on a lavender-tinted neutral scale, a soft gradient page background, full dark-mode via `prefers-color-scheme`. Applied *tastefully but uniformly* — every card looks like every other card; colour doesn't yet encode meaning beyond the per-tracker accent dot.
- **Icons:** emoji only (⏱️✅💰 for units, 📭✨ for empty states). No consistent icon system, no per-tracker custom icon (only a colour), nothing at the size/weight of a real icon set.
- **Spacing:** a real 6-step token scale (4px–32px), used consistently. Reasonably disciplined already.
- **Cards:** white/dark surface, 14px radius, two-layer shadow, hover-lift (translateY + shadow growth). One visual "weight" of card throughout — no hero cards, no varying elevation to signal importance.
- **Components:** forms, list-rows, a `summary-cards` grid, pill toggles, a search bar. No progress rings, no bar charts, no calendar/heatmap, no badges, no floating action button, no bottom sheet/modal (deletion confirms via native `confirm()`).
- **Animations:** CSS `transition` only — hover lift/shadow, colour fades. No page-transition animation between tabs (instant swap), no entrance animation for new list items, no celebratory motion, no skeleton/loading states (everything renders synchronously from `localStorage`, so there's nothing to wait for).
- **User flow:** log (Today) → review (Summary) → manage (Trackers). No onboarding beyond one empty-state card ("Create your first tracker"). No guided setup, no sample data.
- **Accessibility:** real `<button>`/`<form>`/`<label>` elements throughout (good baseline keyboard support for free), `aria-label`s on the prev/next period arrows, visible `:focus-visible` outlines. No skip link, no `aria-live` region announcing new totals after an action, contrast not formally audited (though the palette was chosen with dark-mode contrast in mind — see `styles.css`'s dark-mode fix-up comment).
- **Mobile responsiveness:** one breakpoint (480px) tweaking tab/pill padding; the `summary-cards` grid reflows via `auto-fill` without extra media queries. Functional, not mobile-*first* — nothing was designed for thumb reach, bottom-of-screen actions, or a phone's aspect ratio specifically.
- **Overall UX today:** clean, coherent, and honestly already good-looking after the last redesign pass — but it reads as a well-made *form-and-list* utility, not a "dashboard" app. Numbers are correct and easy to find; they aren't yet easy to *feel* at a glance.

### 1.2 The inspiration image, factually

Patterns present across the five real apps shown (Loop, Habitica, Streaks, Habitify, Productive) and the generic concept mockup:

- Dark-mode-first dashboards with a **greeting header** ("Good morning, Jude!") and a **hero stat** (a completion ring or percentage) above everything else.
- **Colour-coded icon chips** per habit (a small rounded-square badge, one solid colour, one glyph) used as the primary way to tell habits apart at a glance — colour + icon, not just colour.
- **Progress bars/rings with fractions** ("8/8 cups", "80% completed") on almost every card — the number is never shown alone, it's always paired with a visual fill.
- A **habit detail screen** per habit: big icon, a week-at-a-glance checkbox strip (M T W T F S S), current/longest streak numbers, a monthly progress bar, an "Edit Habit" CTA.
- A dedicated **Insights** screen: one big trend number with a sparkline, a ranked "Top Habits" list.
- A dedicated **Calendar** screen: month grid with coloured dots marking activity, a "today" strip at the bottom.
- **Icon-only bottom navigation** + a **floating circular quick-add button** overlapping the tab bar — the dominant mobile-app navigation pattern, and notably *not* what Tally does (top text tabs).
- Side-panel callouts (not app screens, just design advice) naming: visual consistency, progress visualization, quick-add, gamification (streaks/badges/levels), insights & reflection, personalization, mobile-first design — plus a features list including AI suggestions, push notifications, and theme customization.

### 1.3 Dimension-by-dimension comparison

| Dimension | Current Tally | Inspiration pattern | Gap |
|---|---|---|---|
| Layout | Single column, flat list-of-cards | Dashboard with a hero stat + secondary cards below | **Large** — no visual hierarchy of "most important number first" |
| Navigation | Top text tabs, 3 screens, no drill-down | Bottom icon nav + FAB + per-item detail screens | **Large** — this is the single biggest structural gap |
| Info hierarchy | Flat, everything equal weight | Greeting → hero stat → supporting cards | **Large** |
| Typography | One weight/size system, no oversized numerals | Big bold numerals for stats, calmer type for labels | **Medium** |
| Colour | Tasteful, uniform per-card | Colour is *load-bearing* — chips, rings, bars all colour-coded | **Medium** — Tally already has per-tracker colour (the dot); it's just underused |
| Icons | Emoji, unit-only, small | Custom per-item icon chip, prominent | **Medium** |
| Spacing | Consistent token scale already | Similar discipline | **Small** — already close |
| Cards | One elevation/weight throughout | Varying size/weight (hero vs. list row) | **Medium** |
| Components | Forms + list rows only | Rings, bars, heatmap/calendar, sparkline, badges | **Large** — this is where most net-new UI is |
| Animations | Hover-only, instant tab switches | Entrance motion, streak celebrations, ring fill animation | **Medium** |
| User flow | 3 flat tabs | Dashboard-first, detail screens, calendar as its own destination | **Medium-Large** |
| Accessibility | Solid semantic baseline, a few gaps | Not visible/assessable from static mockups | **Unknown for inspiration** — Tally's actual gaps (no live-region, no skip link) stand regardless |
| Mobile responsiveness | One breakpoint, "shrinks to fit" | Designed mobile-first from the start | **Medium** |
| Overall UX | Correct, clean, utilitarian | Motivating, glanceable, "app-like" | **Medium-Large** |

### 1.4 Constraint conflicts — things the image suggests that Tally's own rules block

These aren't gaps to close — they're places where the inspiration wants something [CLAUDE.md](CLAUDE.md) or [PRD.md](PRD.md) has *deliberately* ruled out. Flagging before Phase 2 so the roadmap doesn't silently smuggle them in:

| Image suggests | Current rule | Verdict |
|---|---|---|
| AI-powered habit suggestions / AI insights | PRD §7: no server, works fully offline; no API calls anywhere in the codebase | **Out of scope** unless you explicitly want to lift the offline-only constraint |
| Push notifications / reminders | PRD §7 explicitly: "No notifications or reminders" | **Out of scope** as stated |
| Theme customization (beyond dark mode) | CLAUDE.md explicitly: "No in-app dark-mode toggle... don't add a manual switch unless asked" | **Not in this roadmap** unless you ask for it directly — it's a real, deliberate rule from an earlier session, not an oversight |
| Habit-specific weekly checkbox grid (binary done/not-done) | Tally's trackers can be minutes/count/**dollars** — a checkbox doesn't mean anything for "$40 spent" | **Generalize, don't copy** — replaced with an intensity heatmap cell (works for any unit) in the roadmap below |
| Gamification (badges, levels, XP) | Not ruled out anywhere, but PRD's whole tone (§2, §3) is "a private tool for me," not a game | **Judgment call, ranked low** — I'd rather ask than assume you want badges |

### 1.5 Ranked improvement opportunities

Highest → lowest impact, each scored for impact **and** how much it fights the existing architecture (higher friction = more rework of `view-*.js`/`store.js`):

| # | Opportunity | Impact | Friction |
|---|---|---|---|
| 1 | Mobile-first nav: icon bottom bar + floating quick-add (desktop keeps a top bar) | High | Medium — `app.js`'s `showView` logic is reusable; mostly new markup/CSS + one responsive split |
| 2 | Today → real dashboard: greeting + one hero stat + progress bars/rings on tracker cards (not bare numbers) | High | Low-Medium — `view-today.js` already computes the right numbers, this is presentation |
| 3 | Per-tracker detail screen (tap a tracker → its own view: recent entries, activity strip, edit) | High | Medium-High — genuinely new screen/route concept, though it reuses `store.js` entirely |
| 4 | Generalized activity heatmap/calendar (any unit, not just checkboxes) | High | Medium — new date-bucketing logic in `dates.js`, new small component |
| 5 | Custom per-tracker icon (glyph, not just colour) | Medium | Low — one more field on the tracker object, same backfill pattern already used for `color` |
| 6 | Micro-motion: tab-switch transition, "entry added" feedback, streak-milestone celebration | Medium | Low — CSS-only for the most part |
| 7 | Insights screen upgrade: trend sparkline, ranked list (builds on what Summary already has) | Medium | Low — extends existing `view-summary.js` insights line |
| 8 | Accessibility pass: `aria-live` on totals, skip link, contrast audit | Medium (real, easy to under-rate) | Low |
| 9 | Drag-and-drop tracker reordering | Low-Medium | Medium — new interaction, new persisted `order` field |
| 10 | Badges/gamification | Low | Medium — new concept, and see §1.4's judgment-call flag |
| 11 | Theme customization beyond dark mode | Low (per existing rule) | — not scoped unless requested |
| 12 | AI suggestions / push notifications | Not scoped | Explicit constraint conflict (§1.4) |

---

## 2. Phase 2 — Master roadmap

Seven milestones, ordered by the impact ranking above, each independently testable and shippable on its own (matching the app's existing "one phase, verify by hand, commit" rhythm from ROADMAP.md).

### Milestone 1 — Navigation & shell
Add an icon-based bottom nav for narrow screens (Today/Summary/Trackers, same three destinations, just relocated + iconified) with a floating quick-add button that opens Today's log form. Desktop keeps the current top segmented bar — genuinely two layouts, not one hidden by CSS.
**Test:** resize narrow vs. wide; both nav styles work; quick-add opens the log form pre-focused.

### Milestone 2 — Today, as a dashboard
A time-of-day greeting, one hero stat (e.g. "3 of 5 trackers logged today"), and tracker cards that show a filled progress bar/ring instead of a bare number (need a sensible per-tracker "goal" concept — probably today's total against yesterday's, or against a user-set daily target if we add one).
**Test:** log entries across trackers, watch bars/rings and the hero stat update correctly for each unit type.

### Milestone 3 — Tracker detail screen
Tapping a tracker (from Today or Trackers) opens its own screen: a generalized weekly activity strip, recent entries, current/longest streak-of-logging-days, rename/archive/delete moved here from the flat list.
**Test:** open a tracker, confirm every number matches what Summary already reports for the same tracker.

### Milestone 4 — Calendar / heatmap view
A month-grid view (color intensity per day, not per-habit checkboxes) either as a new Summary mode or inside tracker detail.
**Test:** navigate months, confirm shaded days match logged dates exactly.

### Milestone 5 — Micro-motion
Smooth tab/screen transitions, an "entry logged" confirmation animation, a subtle streak-milestone celebration. No new data, purely feel.
**Test:** perform the core actions, confirm nothing feels janky, confirm nothing breaks with animations disabled (prefers-reduced-motion).

### Milestone 6 — Accessibility & responsiveness audit
`aria-live` on numbers that change after an action, a skip link, a real contrast pass, and more than one responsive breakpoint if the new dashboard/detail screens need it.
**Test:** keyboard-only pass through every screen; resize through several widths, not just one.

### Milestone 7 — Optional polish
Custom tracker icons, drag-and-drop reordering, and (only if you want them after seeing everything else) badges. Each proposed and approved individually — not bundled.
**Test:** per-feature, decided at the time.

---

**Waiting for your go-ahead before touching any code** — confirm the roadmap (or tell me what to reorder/cut/add), and say which milestone to start with. Per your instructions, I'll implement one at a time and stop for your review after each.
