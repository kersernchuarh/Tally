/* =========================================================================
   store.js — the ONLY file allowed to touch localStorage

   Every other file asks THIS file to read or change data. Nothing outside
   store.js should ever call localStorage.getItem/setItem directly — see
   STRUCTURE.md for why that boundary is the single most load-bearing rule
   in this codebase.

   Data shape (PRD.md §5), storage key "tally.v1":
     { version: 1, trackers: [...], entries: [...] }

   Phase 1 built trackers; Phase 2 added entries.
   ========================================================================= */

window.App = window.App || {};

(function () {
  var STORAGE_KEY = 'tally.v1';
  var VALID_UNITS = ['minutes', 'count', 'dollars'];

  function defaultData() {
    return { version: 1, trackers: [], entries: [] };
  }

  /**
   * Reads and parses the stored data. Falls back to an empty-but-valid
   * shape if nothing is stored yet, or if what's stored is corrupt —
   * a blank app should never crash on load (PRD.md F12).
   */
  function load() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();

    try {
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object') return defaultData();
      if (!Array.isArray(data.trackers)) data.trackers = [];
      if (!Array.isArray(data.entries)) data.entries = [];
      data.version = data.version || 1;
      return data;
    } catch (err) {
      return defaultData();
    }
  }

  function save(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }

  /** Short, collision-safe-enough IDs for a single-user local app. */
  function generateId(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 10);
  }

  function findTracker(data, id) {
    return data.trackers.filter(function (t) { return t.id === id; })[0];
  }

  function nameTaken(data, name, excludeId) {
    var lower = name.trim().toLowerCase();
    return data.trackers.some(function (t) {
      return t.id !== excludeId && t.name.trim().toLowerCase() === lower;
    });
  }

  function addTracker(name, unit) {
    name = (name || '').trim();
    if (!name) throw new Error('Tracker name cannot be empty.');
    if (VALID_UNITS.indexOf(unit) === -1) throw new Error('Unknown unit: ' + unit);

    var data = load();
    if (nameTaken(data, name)) {
      throw new Error('A tracker named "' + name + '" already exists.');
    }

    var tracker = {
      id: generateId('t'),
      name: name,
      unit: unit,
      archived: false,
      createdAt: new Date().toISOString()
    };

    data.trackers.push(tracker);
    save(data);
    return tracker;
  }

  function renameTracker(id, newName) {
    newName = (newName || '').trim();
    if (!newName) throw new Error('Tracker name cannot be empty.');

    var data = load();
    var tracker = findTracker(data, id);
    if (!tracker) throw new Error('Tracker not found.');
    if (nameTaken(data, newName, id)) {
      throw new Error('A tracker named "' + newName + '" already exists.');
    }

    tracker.name = newName;
    save(data);
    return tracker;
  }

  function archiveTracker(id) {
    var data = load();
    var tracker = findTracker(data, id);
    if (!tracker) throw new Error('Tracker not found.');
    tracker.archived = true;
    save(data);
    return tracker;
  }

  function restoreTracker(id) {
    var data = load();
    var tracker = findTracker(data, id);
    if (!tracker) throw new Error('Tracker not found.');
    tracker.archived = false;
    save(data);
    return tracker;
  }

  /** Deletes a tracker and every entry that points at it — see PRD.md §5. */
  function deleteTracker(id) {
    var data = load();
    data.trackers = data.trackers.filter(function (t) { return t.id !== id; });
    data.entries = data.entries.filter(function (e) { return e.trackerId !== id; });
    save(data);
  }

  function addEntry(trackerId, amount, date, note) {
    var data = load();
    var tracker = findTracker(data, trackerId);
    if (!tracker) throw new Error('Tracker not found.');

    amount = Number(amount);
    if (!isFinite(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number.');
    }
    if (!date) throw new Error('Date is required.');

    var entry = {
      id: generateId('e'),
      trackerId: trackerId,
      amount: amount,
      date: date,
      note: (note || '').trim(),
      createdAt: new Date().toISOString()
    };

    data.entries.push(entry);
    save(data);
    return entry;
  }

  function deleteEntry(id) {
    var data = load();
    data.entries = data.entries.filter(function (e) { return e.id !== id; });
    save(data);
  }

  App.store = {
    load: load,
    save: save,
    addTracker: addTracker,
    renameTracker: renameTracker,
    archiveTracker: archiveTracker,
    restoreTracker: restoreTracker,
    deleteTracker: deleteTracker,
    addEntry: addEntry,
    deleteEntry: deleteEntry
  };
})();
