/* =========================================================================
   format.js — unit-aware display formatting

   Turns raw stored numbers into what you actually read on screen:
     90     minutes -> "1h 30m"
     18.4   dollars  -> "$18.40"
     3      count    -> "3"

   Storage always keeps the plain number (PRD.md §5) — formatting is a
   presentation concern only, which is why it's isolated here rather than
   scattered through the view files. Built out in Phase 2.
   ========================================================================= */

window.App = window.App || {};

App.format = {
  // amount(value, unit) -> display string, per the rules above.
  // Filled in during Phase 2.
};
