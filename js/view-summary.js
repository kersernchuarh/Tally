/* =========================================================================
   view-summary.js — renders the Summary tab

   Week/Month/Year/All-time toggle, per-tracker totals for the selected
   period, and prev/next navigation between periods (F8, F9 in PRD.md §6,
   with Year/All added in the 2026-07-27 design pass). "All time" has no
   navigation — there's only one such period.

   Totals include every tracker with at least one entry in the period —
   including archived ones — so a past week's history stays accurate even
   after a tracker is archived or renamed later.
   ========================================================================= */

window.App = window.App || {};
App.views = App.views || {};

(function () {
  // Local UI state: which period is showing. Not saved data — just what
  // this screen currently displays. Anchors default lazily to "now" the
  // first time render() runs, so this file never calls Date-dependent
  // code at load time.
  var mode = 'week';
  var weekAnchor = null;
  var monthAnchor = null;
  var yearAnchor = null;

  function ensureAnchors() {
    if (!weekAnchor) weekAnchor = App.dates.todayString();
    if (!monthAnchor) monthAnchor = App.dates.monthKey(App.dates.todayString());
    if (!yearAnchor) yearAnchor = App.dates.yearKey(App.dates.todayString());
  }

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function entriesInWeek(entries, range) {
    // Plain string comparison works because dates are "YYYY-MM-DD" —
    // that format sorts identically whether compared as text or as time.
    return entries.filter(function (e) { return e.date >= range.start && e.date <= range.end; });
  }

  function entriesInMonth(entries, key) {
    return entries.filter(function (e) { return App.dates.monthKey(e.date) === key; });
  }

  function entriesInYear(entries, key) {
    return entries.filter(function (e) { return App.dates.yearKey(e.date) === key; });
  }

  function totalsByTracker(entries) {
    var totals = {};
    entries.forEach(function (e) {
      totals[e.trackerId] = (totals[e.trackerId] || 0) + e.amount;
    });
    return totals;
  }

  function rowsHtml(totals, trackers) {
    var rows = Object.keys(totals).map(function (id) {
      var tracker = trackers.filter(function (t) { return t.id === id; })[0];
      return {
        name: tracker ? tracker.name : '(deleted tracker)',
        unit: tracker ? tracker.unit : 'count',
        color: tracker ? tracker.color : '#a0aec0',
        total: totals[id]
      };
    });

    if (rows.length === 0) {
      return '<p class="empty-note">Nothing logged in this period.</p>';
    }

    rows.sort(function (a, b) { return b.total - a.total || a.name.localeCompare(b.name); });

    return '<ul class="summary-list">' + rows.map(function (r) {
      return (
        '<li class="summary-list__row">' +
          '<span class="summary-list__name">' +
            '<span class="dot" style="background:' + r.color + '"></span>' +
            escapeHtml(r.name) +
          '</span>' +
          '<span class="summary-list__total">' + App.format.amount(r.total, r.unit) + '</span>' +
        '</li>'
      );
    }).join('') + '</ul>';
  }

  function render() {
    var section = document.getElementById('view-summary');
    if (!section) return;

    ensureAnchors();
    var data = App.store.load();

    var html = '<h2 class="view-title">Summary</h2>';

    var modes = [
      { key: 'week', label: 'Week' },
      { key: 'month', label: 'Month' },
      { key: 'year', label: 'Year' },
      { key: 'all', label: 'All time' }
    ];

    html += '<div class="mode-toggle">' + modes.map(function (m) {
      return '<button type="button" class="mode-btn' + (mode === m.key ? ' is-active' : '') +
        '" data-action="set-mode" data-mode="' + m.key + '">' + m.label + '</button>';
    }).join('') + '</div>';

    var label, body;

    if (mode === 'week') {
      var range = App.dates.weekRange(weekAnchor);
      label = App.dates.weekLabel(range);
      body = rowsHtml(totalsByTracker(entriesInWeek(data.entries, range)), data.trackers);
    } else if (mode === 'month') {
      label = App.dates.monthLabel(monthAnchor);
      body = rowsHtml(totalsByTracker(entriesInMonth(data.entries, monthAnchor)), data.trackers);
    } else if (mode === 'year') {
      label = yearAnchor;
      body = rowsHtml(totalsByTracker(entriesInYear(data.entries, yearAnchor)), data.trackers);
    } else {
      label = 'All time';
      body = rowsHtml(totalsByTracker(data.entries), data.trackers);
    }

    if (mode === 'all') {
      html += '<div class="period-nav period-nav--static"><span class="period-nav__label">' + label + '</span></div>';
    } else {
      html += '<div class="period-nav">' +
        '<button type="button" class="btn" data-action="prev" aria-label="Previous period">&larr;</button>' +
        '<span class="period-nav__label">' + label + '</span>' +
        '<button type="button" class="btn" data-action="next" aria-label="Next period">&rarr;</button>' +
      '</div>';
    }

    html += body;

    section.innerHTML = html;
  }

  function handleClick(e) {
    var button = e.target.closest('button[data-action]');
    if (!button) return;

    var action = button.dataset.action;

    if (action === 'set-mode') {
      mode = button.dataset.mode;
      render();
      return;
    }

    if (action === 'prev' || action === 'next') {
      var delta = action === 'prev' ? -1 : 1;
      if (mode === 'week') {
        weekAnchor = App.dates.addDays(weekAnchor, delta * 7);
      } else if (mode === 'month') {
        monthAnchor = App.dates.shiftMonth(monthAnchor, delta);
      } else if (mode === 'year') {
        yearAnchor = App.dates.shiftYear(yearAnchor, delta);
      }
      render();
    }
  }

  var section = document.getElementById('view-summary');
  if (section) {
    section.addEventListener('click', handleClick);
  }

  App.views.summary = { render: render };
})();
