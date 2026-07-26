/* =========================================================================
   view-summary.js — renders the Summary tab

   Week/Month/Year/All-time toggle, per-tracker totals for the selected
   period, and prev/next navigation between periods (F8, F9 in PRD.md §6,
   with Year/All added in the 2026-07-27 design pass). "All time" has no
   navigation — there's only one such period.

   Totals include every tracker with at least one entry in the period —
   including archived ones — so a past week's history stays accurate even
   after a tracker is archived or renamed later.

   2026-07-27 additions: an insights line (days logged, entry count, and
   each tracker's change vs the previous equivalent period), plus a
   "Browse entries" search/filter scoped to the current period. Search
   results re-render into their own #search-results container instead of
   through the whole-section render() — typing would otherwise recreate
   the search input every keystroke and steal focus/cursor position.
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

  // Search/filter state for "Browse entries".
  var searchQuery = '';
  var filterTrackerId = '';

  // Cached by the last full render(), so typing in the search box can
  // re-filter without recomputing (or re-rendering) everything else.
  var currentPeriodEntries = [];
  var currentTrackers = [];

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

  /** previousTotal of 0 could mean "no history" or "genuinely logged
   *  zero" — either way there's nothing meaningful to compare against,
   *  so it's shown as "new" rather than a misleading "+100%". */
  function deltaHtml(currentTotal, previousTotal, unit, periodWord) {
    if (currentTotal === 0 && previousTotal === 0) return '';
    if (previousTotal === 0) {
      return '<span class="summary-list__delta">new this ' + periodWord + '</span>';
    }

    var diff = currentTotal - previousTotal;
    if (diff === 0) {
      return '<span class="summary-list__delta">same as last ' + periodWord + '</span>';
    }

    var arrow = diff > 0 ? '▲' : '▼';
    return '<span class="summary-list__delta">' + arrow + ' ' +
      App.format.amount(Math.abs(diff), unit) + ' vs last ' + periodWord + '</span>';
  }

  /**
   * previousTotals/periodWord are null in "all time" mode — there's no
   * "previous all time" to compare against, so deltas are skipped there.
   */
  function rowsHtml(totals, trackers, previousTotals, periodWord) {
    var rows = Object.keys(totals).map(function (id) {
      var tracker = trackers.filter(function (t) { return t.id === id; })[0];
      return {
        id: id,
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
      var delta = periodWord
        ? deltaHtml(r.total, (previousTotals && previousTotals[r.id]) || 0, r.unit, periodWord)
        : '';

      return (
        '<li class="summary-list__row">' +
          '<span class="summary-list__name">' +
            '<span class="dot" style="background:' + r.color + '"></span>' +
            escapeHtml(r.name) +
          '</span>' +
          '<span class="summary-list__totals">' +
            '<span class="summary-list__total">' + App.format.amount(r.total, r.unit) + '</span>' +
            delta +
          '</span>' +
        '</li>'
      );
    }).join('') + '</ul>';
  }

  /** "Logged on 4 of 7 days · 9 entries" for week/month; a simpler entry
   *  count for year/all-time, where "days out of N" is less meaningful. */
  function insightsHtml(mode, entries, monthAnchor) {
    if (entries.length === 0) return '';

    var uniqueDates = {};
    entries.forEach(function (e) { uniqueDates[e.date] = true; });
    var daysLogged = Object.keys(uniqueDates).length;
    var count = entries.length;
    var countLabel = count + (count === 1 ? ' entry' : ' entries');

    if (mode === 'week') {
      return '<p class="insights-bar">Logged on ' + daysLogged + ' of 7 days &middot; ' + countLabel + '</p>';
    }
    if (mode === 'month') {
      var totalDays = App.dates.daysInMonth(monthAnchor);
      return '<p class="insights-bar">Logged on ' + daysLogged + ' of ' + totalDays + ' days &middot; ' + countLabel + '</p>';
    }
    return '<p class="insights-bar">' + countLabel + ' logged</p>';
  }

  function trackerFilterOptionsHtml(trackers, selected) {
    return '<option value="">All trackers</option>' + trackers.map(function (t) {
      return '<option value="' + t.id + '"' + (t.id === selected ? ' selected' : '') + '>' +
        App.format.unitEmoji(t.unit) + ' ' + escapeHtml(t.name) + (t.archived ? ' (archived)' : '') + '</option>';
    }).join('');
  }

  function matchesSearch(entry, tracker, query) {
    if (!query) return true;
    var q = query.toLowerCase();
    var note = (entry.note || '').toLowerCase();
    var name = tracker ? tracker.name.toLowerCase() : '';
    return note.indexOf(q) !== -1 || name.indexOf(q) !== -1;
  }

  function searchResultRowHtml(entry, tracker) {
    var name = tracker ? tracker.name : '(deleted tracker)';
    var dot = tracker ? '<span class="dot" style="background:' + tracker.color + '"></span>' : '';
    var display = tracker ? App.format.amount(entry.amount, tracker.unit) : entry.amount;

    return (
      '<li class="entry-row" data-id="' + entry.id + '">' +
        '<div class="entry-row__info">' +
          '<span class="entry-row__tracker">' + dot + escapeHtml(name) + '</span>' +
          '<span class="entry-row__date">' + entry.date + '</span>' +
          '<span class="entry-row__amount">' + display + '</span>' +
          (entry.note ? '<span class="entry-row__note">' + escapeHtml(entry.note) + '</span>' : '') +
        '</div>' +
        '<button type="button" class="btn btn--danger" data-action="delete-search-entry" data-id="' + entry.id + '">Delete</button>' +
      '</li>'
    );
  }

  /** Repopulates ONLY #search-results, from the cached currentPeriodEntries
   *  and current searchQuery/filterTrackerId — never touches the search
   *  input or filter dropdown, so typing never loses focus. */
  function renderResults() {
    var container = document.getElementById('search-results');
    if (!container) return;

    if (currentPeriodEntries.length === 0) {
      container.innerHTML = '';
      return;
    }

    var query = searchQuery.trim();
    var matches = currentPeriodEntries.filter(function (e) {
      if (filterTrackerId && e.trackerId !== filterTrackerId) return false;
      var tracker = currentTrackers.filter(function (t) { return t.id === e.trackerId; })[0];
      return matchesSearch(e, tracker, query);
    });

    if (matches.length === 0) {
      container.innerHTML = '<p class="empty-note">No matching entries.</p>';
      return;
    }

    var sorted = matches.slice().sort(function (a, b) {
      return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
    });

    container.innerHTML = '<ul class="entry-list">' + sorted.map(function (e) {
      var tracker = currentTrackers.filter(function (t) { return t.id === e.trackerId; })[0];
      return searchResultRowHtml(e, tracker);
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

    var label, periodEntries, previousTotals, periodWord;

    if (mode === 'week') {
      var range = App.dates.weekRange(weekAnchor);
      label = App.dates.weekLabel(range);
      periodEntries = entriesInWeek(data.entries, range);
      var prevRange = App.dates.weekRange(App.dates.addDays(weekAnchor, -7));
      previousTotals = totalsByTracker(entriesInWeek(data.entries, prevRange));
      periodWord = 'week';
    } else if (mode === 'month') {
      label = App.dates.monthLabel(monthAnchor);
      periodEntries = entriesInMonth(data.entries, monthAnchor);
      previousTotals = totalsByTracker(entriesInMonth(data.entries, App.dates.shiftMonth(monthAnchor, -1)));
      periodWord = 'month';
    } else if (mode === 'year') {
      label = yearAnchor;
      periodEntries = entriesInYear(data.entries, yearAnchor);
      previousTotals = totalsByTracker(entriesInYear(data.entries, App.dates.shiftYear(yearAnchor, -1)));
      periodWord = 'year';
    } else {
      label = 'All time';
      periodEntries = data.entries;
      previousTotals = null;
      periodWord = null;
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

    html += insightsHtml(mode, periodEntries, monthAnchor);
    html += rowsHtml(totalsByTracker(periodEntries), data.trackers, previousTotals, periodWord);

    html += '<h3 class="view-subtitle">Browse entries</h3>';
    html += '<div class="search-bar">' +
      '<input type="text" id="search-query" placeholder="Search notes or tracker name" value="' + escapeHtml(searchQuery) + '">' +
      '<select id="search-tracker-filter">' + trackerFilterOptionsHtml(data.trackers, filterTrackerId) + '</select>' +
    '</div>' +
    '<div id="search-results"></div>';

    section.innerHTML = html;

    currentPeriodEntries = periodEntries;
    currentTrackers = data.trackers;
    renderResults();
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
      return;
    }

    if (action === 'delete-search-entry') {
      App.store.deleteEntry(button.dataset.id);
      render();
    }
  }

  function handleInput(e) {
    if (e.target.id !== 'search-query') return;
    searchQuery = e.target.value;
    renderResults();
  }

  function handleChange(e) {
    if (e.target.id !== 'search-tracker-filter') return;
    filterTrackerId = e.target.value;
    renderResults();
  }

  var section = document.getElementById('view-summary');
  if (section) {
    section.addEventListener('click', handleClick);
    section.addEventListener('input', handleInput);
    section.addEventListener('change', handleChange);
  }

  App.views.summary = { render: render };
})();
