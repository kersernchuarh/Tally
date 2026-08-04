/* =========================================================================
   store.js — the ONLY file allowed to touch localStorage

   Every other file asks THIS file to read or change data. Nothing outside
   store.js should ever call localStorage.getItem/setItem directly — see
   STRUCTURE.md for why that boundary is the single most load-bearing rule
   in this codebase.

   Data shape (PRD.md §5), storage key "tally.v1":
     { version: 1, trackers: [...], entries: [...] }

   Phase 1 built trackers; Phase 2 added entries; Phase 3 read-only via
   dates.js; Phase 4 added editing an entry and JSON import/export; the
   2026-07-27 design pass added a per-tracker accent `color`; Redesign
   Milestone 2 added an optional per-tracker `dailyGoal`, which is what
   turns a tracker's Today card from a bare number into a progress bar.
   ========================================================================= */

window.App = window.App || {};

(function () {
  var STORAGE_KEY = 'tally.v1';
  var VALID_UNITS = ['minutes', 'count', 'dollars'];

  // Categorical accent colors, cycled through in creation order so each
  // tracker gets a distinct-ish color for free — purely decorative (used
  // as a small dot next to the tracker's name), never as text-on-color,
  // so contrast isn't a concern.
  var COLOR_PALETTE = [
    '#e53e3e', '#dd6b20', '#d69e2e', '#38a169',
    '#319795', '#3182ce', '#5a67d8', '#805ad5', '#d53f8c'
  ];

  function isNonEmptyString(v) {
    return typeof v === 'string' && v.trim().length > 0;
  }

  function isHexColor(v) {
    return typeof v === 'string' && /^#[0-9a-fA-F]{6}$/.test(v);
  }

  /** null means "no goal set" — the Today card falls back to a plain
   *  number in that case rather than a bar with a fabricated target. */
  function normalizeDailyGoal(v) {
    if (v === '' || v === null || v === undefined) return null;
    var n = Number(v);
    return isFinite(n) && n > 0 ? n : null;
  }

  function defaultData() {
    return { version: 1, trackers: [], entries: [] };
  }

  /**
   * index is this tracker's position in the trackers array, used only as
   * a fallback so trackers saved before the color field existed get one
   * deterministically assigned on next load, instead of losing history.
   */
  function sanitizeTracker(t, index) {
    if (!t || typeof t !== 'object') return null;
    if (!isNonEmptyString(t.id) || !isNonEmptyString(t.name)) return null;

    return {
      id: t.id,
      name: t.name,
      unit: VALID_UNITS.indexOf(t.unit) !== -1 ? t.unit : 'count',
      color: isHexColor(t.color) ? t.color : COLOR_PALETTE[index % COLOR_PALETTE.length],
      dailyGoal: normalizeDailyGoal(t.dailyGoal),
      archived: !!t.archived,
      createdAt: isNonEmptyString(t.createdAt) ? t.createdAt : new Date().toISOString()
    };
  }

  function sanitizeEntry(e) {
    if (!e || typeof e !== 'object') return null;
    if (!isNonEmptyString(e.id) || !isNonEmptyString(e.trackerId)) return null;

    var amount = Number(e.amount);
    if (!isFinite(amount)) return null;
    if (!isNonEmptyString(e.date)) return null;

    return {
      id: e.id,
      trackerId: e.trackerId,
      amount: amount,
      date: e.date,
      note: typeof e.note === 'string' ? e.note : '',
      createdAt: isNonEmptyString(e.createdAt) ? e.createdAt : new Date().toISOString()
    };
  }

  /**
   * Turns "whatever came out of JSON.parse" into a data object we can
   * trust, dropping anything malformed instead of crashing on it. Used
   * both for normal load() and for importing a backup file — a hand-
   * edited or corrupted JSON file should never be able to break the app.
   */
  function sanitize(raw) {
    if (!raw || typeof raw !== 'object') return defaultData();

    var trackers = Array.isArray(raw.trackers)
      ? raw.trackers.map(function (t, i) { return sanitizeTracker(t, i); }).filter(Boolean)
      : [];

    var entries = Array.isArray(raw.entries)
      ? raw.entries.map(sanitizeEntry).filter(Boolean)
      : [];

    return { version: 1, trackers: trackers, entries: entries };
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
      return sanitize(JSON.parse(raw));
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

  function addTracker(name, unit, dailyGoal) {
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
      color: COLOR_PALETTE[data.trackers.length % COLOR_PALETTE.length],
      dailyGoal: normalizeDailyGoal(dailyGoal),
      archived: false,
      createdAt: new Date().toISOString()
    };

    data.trackers.push(tracker);
    save(data);
    return tracker;
  }

  /** Renamed from renameTracker() in Redesign Milestone 2 now that the
   *  same inline-edit form also sets a daily goal, not just the name. */
  function updateTracker(id, newName, dailyGoal) {
    newName = (newName || '').trim();
    if (!newName) throw new Error('Tracker name cannot be empty.');

    var data = load();
    var tracker = findTracker(data, id);
    if (!tracker) throw new Error('Tracker not found.');
    if (nameTaken(data, newName, id)) {
      throw new Error('A tracker named "' + newName + '" already exists.');
    }

    tracker.name = newName;
    tracker.dailyGoal = normalizeDailyGoal(dailyGoal);
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

  function updateEntry(id, amount, date, note) {
    var data = load();
    var entry = data.entries.filter(function (e) { return e.id === id; })[0];
    if (!entry) throw new Error('Entry not found.');

    amount = Number(amount);
    if (!isFinite(amount) || amount <= 0) {
      throw new Error('Amount must be a positive number.');
    }
    if (!date) throw new Error('Date is required.');

    entry.amount = amount;
    entry.date = date;
    entry.note = (note || '').trim();
    save(data);
    return entry;
  }

  /**
   * Replaces ALL current data with a backup file's contents. Deliberately
   * a full replace, not a merge — matches the export/import round trip
   * described in ROADMAP.md Phase 4 ("delete a tracker, re-import, and
   * everything comes back"). The view confirms with the user before
   * calling this, since it's destructive to whatever's currently stored.
   */
  function importData(jsonString) {
    var parsed;
    try {
      parsed = JSON.parse(jsonString);
    } catch (err) {
      throw new Error('That file is not valid JSON.');
    }

    var data = sanitize(parsed);
    save(data);
    return data;
  }

  App.store = {
    load: load,
    save: save,
    addTracker: addTracker,
    updateTracker: updateTracker,
    archiveTracker: archiveTracker,
    restoreTracker: restoreTracker,
    deleteTracker: deleteTracker,
    addEntry: addEntry,
    deleteEntry: deleteEntry,
    updateEntry: updateEntry,
    importData: importData
  };
})();
