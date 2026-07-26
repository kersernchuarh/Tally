/* =========================================================================
   dates.js — date helpers (today, week ranges, month keys, labels)

   Every function here takes/returns the plain "YYYY-MM-DD" date strings
   described in PRD.md §5 — never a JS Date passed across files — so
   timezone bugs have nowhere to creep in. The one place a real Date
   object exists is briefly, inside toDate()/fromDate(), always built
   from local year/month/day components (never by parsing a string
   directly — `new Date("2026-07-26")` is parsed as UTC midnight and can
   land on the *previous* day in negative-UTC-offset timezones).

   Weeks run Monday–Sunday.
   ========================================================================= */

window.App = window.App || {};

(function () {
  function pad2(n) {
    return n < 10 ? '0' + n : String(n);
  }

  function toDate(dateStr) {
    var parts = dateStr.split('-');
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }

  function fromDate(d) {
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }

  /** Today's local calendar date as "YYYY-MM-DD". */
  function todayString() {
    return fromDate(new Date());
  }

  /** dateStr shifted by n days (n may be negative). */
  function addDays(dateStr, n) {
    var d = toDate(dateStr);
    d.setDate(d.getDate() + n);
    return fromDate(d);
  }

  /**
   * The Monday–Sunday week containing dateStr, as { start, end }.
   * getDay() is 0=Sun..6=Sat; (dow + 6) % 7 turns that into "days since
   * Monday" (Mon->0, Tue->1, ... Sun->6) without a special case for Sunday.
   */
  function weekRange(dateStr) {
    var dow = toDate(dateStr).getDay();
    var daysSinceMonday = (dow + 6) % 7;
    var start = addDays(dateStr, -daysSinceMonday);
    return { start: start, end: addDays(start, 6) };
  }

  function shortLabel(dateStr) {
    return toDate(dateStr).toLocaleDateString(undefined, {
      weekday: 'short', day: 'numeric', month: 'short'
    });
  }

  function weekLabel(range) {
    return shortLabel(range.start) + ' – ' + shortLabel(range.end);
  }

  /** "2026-07-26" -> "2026-07". Just the date string's first 7 characters,
   *  which is why entries can be grouped by month with a plain string
   *  compare — no date parsing needed. */
  function monthKey(dateStr) {
    return dateStr.slice(0, 7);
  }

  function monthLabel(key) {
    var parts = key.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  }

  /** monthKey shifted by n calendar months (n may be negative). */
  function shiftMonth(key, n) {
    var parts = key.split('-');
    var d = new Date(Number(parts[0]), Number(parts[1]) - 1, 1);
    d.setMonth(d.getMonth() + n);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  }

  /** "2026-07-26" -> "2026". Same string-slicing trick as monthKey(). */
  function yearKey(dateStr) {
    return dateStr.slice(0, 4);
  }

  /** yearKey shifted by n years (n may be negative), as a string. */
  function shiftYear(key, n) {
    return String(Number(key) + n);
  }

  /** Number of days in a "YYYY-MM" month — day 0 of the next month is
   *  the last day of this one. Powers the "logged on X of Y days" stat. */
  function daysInMonth(key) {
    var parts = key.split('-');
    return new Date(Number(parts[0]), Number(parts[1]), 0).getDate();
  }

  App.dates = {
    todayString: todayString,
    addDays: addDays,
    weekRange: weekRange,
    weekLabel: weekLabel,
    monthKey: monthKey,
    monthLabel: monthLabel,
    shiftMonth: shiftMonth,
    yearKey: yearKey,
    shiftYear: shiftYear,
    daysInMonth: daysInMonth
  };
})();
