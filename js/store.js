/* =========================================================================
   store.js — the ONLY file allowed to touch localStorage

   Every other file asks THIS file to read or change data. Nothing outside
   store.js should ever call localStorage.getItem/setItem directly — see
   STRUCTURE.md for why that boundary is the single most load-bearing rule
   in this codebase.

   Data shape (PRD.md §5), storage key "tally.v1":
     { version: 1, trackers: [...], entries: [...] }

   Built out in Phase 1 (trackers) and extended in Phase 2 (entries).
   ========================================================================= */

window.App = window.App || {};

App.store = {
  // load()                          -> the whole data object
  // save(data)                      -> persists it
  // addTracker(name, unit)          -> Phase 1
  // renameTracker(id, name)         -> Phase 1
  // archiveTracker(id)              -> Phase 1
  // deleteTracker(id)               -> Phase 1
  // addEntry(trackerId, amount, date, note) -> Phase 2
  // deleteEntry(id)                 -> Phase 2
};
