/* =========================================================================
   dates.js — date helpers (today, week ranges, month keys, labels)

   Nothing lives here yet — this file is built out in Phase 3 (Summary).
   It exists now so index.html's script list and load order are correct
   from the start, and so later phases only ever ADD to files instead of
   restructuring them.

   Every function here will take/return the plain "YYYY-MM-DD" date
   strings described in PRD.md §5 — never a JS Date passed across files —
   so timezone bugs have nowhere to creep in.
   ========================================================================= */

window.App = window.App || {};

App.dates = {
  // todayString()      -> "2026-07-26"
  // weekRange(dateStr)  -> { start, end } as "YYYY-MM-DD"
  // monthKey(dateStr)   -> "2026-07"
  // label(range)        -> "Mon 20 – Sun 26 Jul"
  // Filled in during Phase 3.
};
