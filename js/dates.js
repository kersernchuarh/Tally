/* =========================================================================
   dates.js — date helpers (today, week ranges, month keys, labels)

   Every function here takes/returns the plain "YYYY-MM-DD" date strings
   described in PRD.md §5 — never a JS Date passed across files — so
   timezone bugs have nowhere to creep in.

   todayString() is built now (Phase 2 needs it for the Today view).
   weekRange() / monthKey() / label() are built in Phase 3 (Summary).
   ========================================================================= */

window.App = window.App || {};

(function () {
  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  /** Today's local calendar date as "YYYY-MM-DD". */
  function todayString() {
    var d = new Date();
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  App.dates = {
    todayString: todayString
    // weekRange(dateStr) -> { start, end } as "YYYY-MM-DD"
    // monthKey(dateStr)  -> "2026-07"
    // label(range)       -> "Mon 20 – Sun 26 Jul"
    // Filled in during Phase 3.
  };
})();
