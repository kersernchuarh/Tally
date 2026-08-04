/* =========================================================================
   view-tracker-detail.js — a single tracker's own screen (Redesign M3)

   Not one of the three tab destinations — opened by tapping a tracker on
   Today or Trackers (app.js's showTrackerDetail()), closed back to
   whichever of those it was opened from (closeTrackerDetail()).

   Holds what used to live inline in the Trackers row — edit (name +
   daily goal), archive/restore, delete — plus things that only make
   sense once you're looking at ONE tracker: a 7-day activity strip,
   current/longest logging streaks, and its recent entries (with
   delete, but not full inline edit — see the "why" note above
   entryRowHtml below).
   ========================================================================= */

window.App = window.App || {};
App.views = App.views || {};

(function () {
  // Which tracker is currently shown, so a handler triggered by a button
  // that only carries an *entry* id (delete-entry) still knows which
  // tracker's screen to re-render afterward.
  var currentId = null;
  var editing = false;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function loggedDatesSet(entries, trackerId) {
    var set = {};
    entries.forEach(function (e) {
      if (e.trackerId === trackerId) set[e.date] = true;
    });
    return set;
  }

  /**
   * Days logged in a row, ending today — or ending yesterday if nothing's
   * been logged yet today, so the streak doesn't look "broken" before the
   * day is even over. Only a full missed day zeroes it out.
   */
  function currentStreak(datesSet, today) {
    var cursor = today;
    if (!datesSet[cursor]) {
      cursor = App.dates.addDays(cursor, -1);
      if (!datesSet[cursor]) return 0;
    }

    var count = 0;
    while (datesSet[cursor]) {
      count++;
      cursor = App.dates.addDays(cursor, -1);
    }
    return count;
  }

  /** Longest run of consecutive calendar dates anywhere in this tracker's history. */
  function longestStreak(datesSet) {
    var days = Object.keys(datesSet).sort();
    var longest = 0;
    var run = 0;
    var prev = null;

    days.forEach(function (d) {
      run = (prev !== null && App.dates.addDays(prev, 1) === d) ? run + 1 : 1;
      longest = Math.max(longest, run);
      prev = d;
    });

    return longest;
  }

  /**
   * A 7-cell strip (oldest to today), shaded by how full that day was.
   * Generalizes the habit-tracker "week of checkboxes" to any unit: with
   * a dailyGoal, intensity is relative to the goal; without one, it's
   * relative to the busiest day shown, since there's no fixed target to
   * measure against.
   */
  function activityStripHtml(tracker, allEntries) {
    var today = App.dates.todayString();
    var days = [];
    for (var i = 6; i >= 0; i--) {
      days.push(App.dates.addDays(today, -i));
    }

    var totals = days.map(function (d) {
      return allEntries
        .filter(function (e) { return e.trackerId === tracker.id && e.date === d; })
        .reduce(function (sum, e) { return sum + e.amount; }, 0);
    });

    var max = tracker.dailyGoal || Math.max.apply(null, totals);

    var cells = days.map(function (d, i) {
      var total = totals[i];
      var intensity = max > 0 ? Math.min(1, total / max) : 0;
      var opacity = total === 0 ? 0.12 : (0.3 + intensity * 0.7).toFixed(2);
      var title = d + ': ' + App.format.amount(total, tracker.unit);

      return (
        '<div class="activity-cell" title="' + title + '">' +
          '<span class="activity-cell__box" style="background:' + tracker.color + '; opacity:' + opacity + '"></span>' +
          '<span class="activity-cell__label">' + App.dates.weekdayLetter(d) + '</span>' +
        '</div>'
      );
    }).join('');

    return '<div class="activity-strip">' + cells + '</div>';
  }

  /**
   * Read + delete only, no inline edit — matches Summary's "Browse
   * entries" search results (view-summary.js) rather than duplicating
   * Today's fuller edit-in-place form a third time in this codebase.
   */
  function entryRowHtml(entry, tracker) {
    var display = App.format.amount(entry.amount, tracker.unit);

    return (
      '<li class="entry-row" data-id="' + entry.id + '">' +
        '<div class="entry-row__info">' +
          '<span class="entry-row__date">' + entry.date + '</span>' +
          '<span class="entry-row__amount">' + display + '</span>' +
          (entry.note ? '<span class="entry-row__note">' + escapeHtml(entry.note) + '</span>' : '') +
        '</div>' +
        '<button type="button" class="btn btn--danger" data-action="delete-entry" data-id="' + entry.id + '">Delete</button>' +
      '</li>'
    );
  }

  function render(trackerId) {
    var section = document.getElementById('view-tracker-detail');
    if (!section) return;

    currentId = trackerId;
    var data = App.store.load();
    var tracker = data.trackers.filter(function (t) { return t.id === trackerId; })[0];

    if (!tracker) {
      section.innerHTML =
        '<button type="button" class="btn back-btn" data-action="close-detail">&larr; Back</button>' +
        '<p class="empty-note">This tracker no longer exists.</p>';
      return;
    }

    var entries = data.entries.filter(function (e) { return e.trackerId === trackerId; });
    var datesSet = loggedDatesSet(data.entries, trackerId);
    var today = App.dates.todayString();
    var totalAllTime = entries.reduce(function (sum, e) { return sum + e.amount; }, 0);

    var html = '<button type="button" class="btn back-btn" data-action="close-detail">&larr; Back</button>';

    html += '<div class="detail-header">' +
      '<span class="dot" style="background:' + tracker.color + '"></span>' +
      '<h2 class="view-title detail-header__title">' + escapeHtml(tracker.name) + '</h2>' +
    '</div>';

    if (editing) {
      html += '<form class="card detail-edit-form" data-action="detail-edit-submit" data-id="' + tracker.id + '">' +
        '<div class="field">' +
          '<label for="detail-edit-name">Name</label>' +
          '<input type="text" id="detail-edit-name" name="name" value="' + escapeHtml(tracker.name) + '" required>' +
        '</div>' +
        '<div class="field">' +
          '<label for="detail-edit-goal">Daily goal (optional)</label>' +
          '<input type="number" id="detail-edit-goal" name="dailyGoal" min="0.01" step="any" ' +
            'value="' + (tracker.dailyGoal || '') + '">' +
        '</div>' +
        '<button type="submit" class="btn btn--primary">Save</button>' +
        '<button type="button" class="btn" data-action="detail-edit-cancel">Cancel</button>' +
      '</form>';
    } else {
      html += '<div class="detail-stats">' +
        '<div class="detail-stat"><span class="detail-stat__value">' + currentStreak(datesSet, today) + '</span>' +
          '<span class="detail-stat__label">day streak</span></div>' +
        '<div class="detail-stat"><span class="detail-stat__value">' + longestStreak(datesSet) + '</span>' +
          '<span class="detail-stat__label">longest streak</span></div>' +
        '<div class="detail-stat"><span class="detail-stat__value">' + App.format.amount(totalAllTime, tracker.unit) + '</span>' +
          '<span class="detail-stat__label">all-time total</span></div>' +
      '</div>';

      html += '<h3 class="view-subtitle">Last 7 days</h3>';
      html += activityStripHtml(tracker, data.entries);

      html += '<div class="detail-actions">' +
        '<button type="button" class="btn" data-action="detail-edit" data-id="' + tracker.id + '">Edit</button>' +
        (tracker.archived
          ? '<button type="button" class="btn" data-action="detail-restore" data-id="' + tracker.id + '">Restore</button>'
          : '<button type="button" class="btn" data-action="detail-archive" data-id="' + tracker.id + '">Archive</button>') +
        '<button type="button" class="btn btn--danger" data-action="detail-delete" data-id="' + tracker.id + '">Delete</button>' +
      '</div>';
    }

    html += '<h3 class="view-subtitle">Recent entries</h3>';

    if (entries.length === 0) {
      html += '<p class="empty-note">Nothing logged yet.</p>';
    } else {
      var sorted = entries.slice().sort(function (a, b) {
        return b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt);
      }).slice(0, 15);

      html += '<ul class="entry-list">' + sorted.map(function (e) { return entryRowHtml(e, tracker); }).join('') + '</ul>';
    }

    section.innerHTML = html;
  }

  function handleSubmit(e) {
    var form = e.target.closest('form[data-action="detail-edit-submit"]');
    if (!form) return;
    e.preventDefault();

    var id = form.dataset.id;
    try {
      App.store.updateTracker(id, form.elements.name.value, form.elements.dailyGoal.value);
    } catch (err) {
      alert(err.message);
      return;
    }

    editing = false;
    render(id);
  }

  function handleClick(e) {
    var button = e.target.closest('button[data-action]');
    if (!button) return;

    var action = button.dataset.action;
    var id = button.dataset.id;

    if (action === 'close-detail') {
      editing = false;
      closeTrackerDetail();
      return;
    }

    if (action === 'detail-edit') {
      editing = true;
      render(id);
      return;
    }

    if (action === 'detail-edit-cancel') {
      editing = false;
      render(id);
      return;
    }

    if (action === 'detail-archive') {
      App.store.archiveTracker(id);
      render(id);
      return;
    }

    if (action === 'detail-restore') {
      App.store.restoreTracker(id);
      render(id);
      return;
    }

    if (action === 'detail-delete') {
      var data = App.store.load();
      var tracker = data.trackers.filter(function (t) { return t.id === id; })[0];
      var count = data.entries.filter(function (e) { return e.trackerId === id; }).length;

      var message = 'Delete "' + (tracker ? tracker.name : 'this tracker') + '"?';
      if (count > 0) {
        message += ' This will also permanently delete ' + count + (count === 1 ? ' entry' : ' entries') + '.';
      }

      if (window.confirm(message)) {
        App.store.deleteTracker(id);
        closeTrackerDetail();
      }
      return;
    }

    if (action === 'delete-entry') {
      App.store.deleteEntry(id);
      render(currentId);
    }
  }

  function handleKeydown(e) {
    if (e.key !== 'Escape') return;
    if (!e.target.closest('form[data-action="detail-edit-submit"]')) return;
    editing = false;
    render(currentId);
  }

  var section = document.getElementById('view-tracker-detail');
  if (section) {
    section.addEventListener('submit', handleSubmit);
    section.addEventListener('click', handleClick);
    section.addEventListener('keydown', handleKeydown);
  }

  App.views.trackerDetail = { render: render };
})();
