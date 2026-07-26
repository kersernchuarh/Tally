/* =========================================================================
   view-today.js — renders the Today tab

   Two ways to log, matching F4/F5 in PRD.md §6:
     - a general log form: pick any active tracker, amount, date
       (defaults to today), optional note — the full-featured path.
     - a quick "+1" button on each count-unit tracker's summary card —
       one tap, no form, per F5's "sensible default (1 for count units)".

   Below that: today's totals per tracker, and today's individual entries
   with edit and delete (F7). Same render-from-data pattern as
   view-trackers.js. Editing an entry follows the same inline-form
   pattern as renaming a tracker: click Edit, the row becomes a form,
   Escape or Cancel backs out without saving.

   2026-07-27 design pass added: a "Repeat last entry" quick action, and
   a colored dot per tracker (App.store's tracker.color) for at-a-glance
   recognition across summary cards and entry rows.
   ========================================================================= */

window.App = window.App || {};
App.views = App.views || {};

(function () {
  // Which entry (if any) is mid-edit. Not saved data — just UI state.
  var editingEntryId = null;

  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function entriesForToday(data, today) {
    return data.entries.filter(function (e) { return e.date === today; });
  }

  function totalFor(entries, trackerId) {
    return entries
      .filter(function (e) { return e.trackerId === trackerId; })
      .reduce(function (sum, e) { return sum + e.amount; }, 0);
  }

  function trackerOptionsHtml(trackers) {
    return trackers.map(function (t) {
      return '<option value="' + t.id + '">' + App.format.unitEmoji(t.unit) + ' ' + escapeHtml(t.name) + '</option>';
    }).join('');
  }

  /** Most recent entry among currently-active trackers, or null. Powers
   *  the "Repeat last entry" quick action. */
  function lastActiveEntry(data, activeTrackers) {
    var activeIds = activeTrackers.map(function (t) { return t.id; });
    var candidates = data.entries.filter(function (e) { return activeIds.indexOf(e.trackerId) !== -1; });
    if (candidates.length === 0) return null;
    return candidates.reduce(function (latest, e) {
      return e.createdAt > latest.createdAt ? e : latest;
    });
  }

  function logFormHtml(activeTrackers, today) {
    return (
      '<form class="card log-form" data-action="log-submit">' +
        '<div class="field">' +
          '<label for="log-tracker">Tracker</label>' +
          '<select id="log-tracker" name="trackerId">' + trackerOptionsHtml(activeTrackers) + '</select>' +
        '</div>' +
        '<div class="field">' +
          '<label for="log-amount">Amount</label>' +
          '<input type="number" id="log-amount" name="amount" min="0.01" step="any" required>' +
        '</div>' +
        '<div class="field">' +
          '<label for="log-date">Date</label>' +
          '<input type="date" id="log-date" name="date" value="' + today + '" required>' +
        '</div>' +
        '<div class="field">' +
          '<label for="log-note">Note (optional)</label>' +
          '<input type="text" id="log-note" name="note" placeholder="e.g. past papers">' +
        '</div>' +
        '<button type="submit" class="btn btn--primary">Log entry</button>' +
      '</form>'
    );
  }

  function summaryCardHtml(tracker, todaysEntries) {
    var total = totalFor(todaysEntries, tracker.id);
    var display = App.format.amount(total, tracker.unit);

    var quickLog = tracker.unit === 'count'
      ? '<button type="button" class="btn btn--primary quick-log-btn" data-action="quick-log" data-id="' + tracker.id + '">+1</button>'
      : '';

    return (
      '<div class="summary-card">' +
        '<div class="summary-card__info">' +
          '<span class="summary-card__name">' +
            '<span class="dot" style="background:' + tracker.color + '"></span>' +
            escapeHtml(tracker.name) +
          '</span>' +
          '<span class="summary-card__total">' + display + '</span>' +
        '</div>' +
        quickLog +
      '</div>'
    );
  }

  function entryRowHtml(entry, tracker) {
    var name = tracker ? tracker.name : '(deleted tracker)';

    if (editingEntryId === entry.id) {
      return (
        '<li class="entry-row" data-id="' + entry.id + '">' +
          '<form class="entry-edit-form" data-action="edit-entry-submit" data-id="' + entry.id + '">' +
            '<input type="number" name="amount" value="' + entry.amount + '" min="0.01" step="any" required aria-label="Amount">' +
            '<input type="date" name="date" value="' + entry.date + '" required aria-label="Date">' +
            '<input type="text" name="note" value="' + escapeHtml(entry.note || '') + '" placeholder="Note" aria-label="Note">' +
            '<button type="submit" class="btn btn--primary">Save</button>' +
            '<button type="button" class="btn" data-action="edit-entry-cancel">Cancel</button>' +
          '</form>' +
        '</li>'
      );
    }

    var display = tracker ? App.format.amount(entry.amount, tracker.unit) : entry.amount;

    var dot = tracker ? '<span class="dot" style="background:' + tracker.color + '"></span>' : '';

    return (
      '<li class="entry-row" data-id="' + entry.id + '">' +
        '<div class="entry-row__info">' +
          '<span class="entry-row__tracker">' + dot + escapeHtml(name) + '</span>' +
          '<span class="entry-row__amount">' + display + '</span>' +
          (entry.note ? '<span class="entry-row__note">' + escapeHtml(entry.note) + '</span>' : '') +
        '</div>' +
        '<div class="entry-row__actions">' +
          '<button type="button" class="btn" data-action="edit-entry" data-id="' + entry.id + '">Edit</button>' +
          '<button type="button" class="btn btn--danger" data-action="delete-entry" data-id="' + entry.id + '">Delete</button>' +
        '</div>' +
      '</li>'
    );
  }

  function render() {
    var section = document.getElementById('view-today');
    if (!section) return;

    var data = App.store.load();
    var activeTrackers = data.trackers.filter(function (t) { return !t.archived; });
    var today = App.dates.todayString();
    var todaysEntries = entriesForToday(data, today);

    var html = '<h2 class="view-title">Today</h2>';

    if (data.trackers.length === 0) {
      html +=
        '<div class="placeholder">' +
          '<p class="placeholder__label">No trackers yet</p>' +
          '<p class="placeholder__text">Create a tracker first, then come back here to start logging.</p>' +
          '<button type="button" class="btn btn--primary" data-action="go-to-trackers">Create a tracker</button>' +
        '</div>';
      section.innerHTML = html;
      return;
    }

    if (activeTrackers.length === 0) {
      html += '<p class="empty-note">All your trackers are archived. Restore one on the Trackers tab to log against it.</p>';
      section.innerHTML = html;
      return;
    }

    html += logFormHtml(activeTrackers, today);

    var lastEntry = lastActiveEntry(data, activeTrackers);
    if (lastEntry) {
      var lastTracker = data.trackers.filter(function (t) { return t.id === lastEntry.trackerId; })[0];
      html += '<button type="button" class="btn repeat-btn" data-action="repeat-last">' +
        '↻ Repeat: ' + escapeHtml(lastTracker.name) + ' (' + App.format.amount(lastEntry.amount, lastTracker.unit) + ')' +
      '</button>';
    }

    html += '<div class="summary-cards">' +
      activeTrackers.map(function (t) { return summaryCardHtml(t, todaysEntries); }).join('') +
      '</div>';

    html += '<h3 class="view-subtitle">Today’s entries</h3>';

    if (todaysEntries.length === 0) {
      html += '<p class="empty-note">Nothing logged yet today.</p>';
    } else {
      var sorted = todaysEntries.slice().sort(function (a, b) {
        return b.createdAt.localeCompare(a.createdAt);
      });
      html += '<ul class="entry-list">' +
        sorted.map(function (e) {
          var tracker = data.trackers.filter(function (t) { return t.id === e.trackerId; })[0];
          return entryRowHtml(e, tracker);
        }).join('') +
        '</ul>';
    }

    section.innerHTML = html;
  }

  function handleSubmit(e) {
    var form = e.target.closest('form[data-action]');
    if (!form) return;
    e.preventDefault();

    var action = form.dataset.action;

    if (action === 'log-submit') {
      var trackerId = form.elements.trackerId.value;
      var amount = form.elements.amount.value;
      var date = form.elements.date.value;
      var note = form.elements.note.value;

      try {
        App.store.addEntry(trackerId, amount, date, note);
      } catch (err) {
        alert(err.message);
        return;
      }

      render();
    }

    if (action === 'edit-entry-submit') {
      var id = form.dataset.id;

      try {
        App.store.updateEntry(id, form.elements.amount.value, form.elements.date.value, form.elements.note.value);
      } catch (err) {
        alert(err.message);
        return;
      }

      editingEntryId = null;
      render();
    }
  }

  function handleClick(e) {
    var button = e.target.closest('button[data-action]');
    if (!button) return;

    var action = button.dataset.action;

    if (action === 'go-to-trackers') {
      showView('trackers');
      return;
    }

    if (action === 'quick-log') {
      try {
        App.store.addEntry(button.dataset.id, 1, App.dates.todayString(), '');
      } catch (err) {
        alert(err.message);
        return;
      }
      render();
      return;
    }

    if (action === 'repeat-last') {
      var data = App.store.load();
      var activeTrackers = data.trackers.filter(function (t) { return !t.archived; });
      var lastEntry = lastActiveEntry(data, activeTrackers);
      if (!lastEntry) return;

      try {
        App.store.addEntry(lastEntry.trackerId, lastEntry.amount, App.dates.todayString(), lastEntry.note);
      } catch (err) {
        alert(err.message);
        return;
      }
      render();
      return;
    }

    if (action === 'delete-entry') {
      App.store.deleteEntry(button.dataset.id);
      render();
      return;
    }

    if (action === 'edit-entry') {
      editingEntryId = button.dataset.id;
      render();
      return;
    }

    if (action === 'edit-entry-cancel') {
      editingEntryId = null;
      render();
    }
  }

  function handleKeydown(e) {
    if (e.key !== 'Escape') return;
    if (!e.target.closest('form[data-action="edit-entry-submit"]')) return;
    editingEntryId = null;
    render();
  }

  var section = document.getElementById('view-today');
  if (section) {
    section.addEventListener('submit', handleSubmit);
    section.addEventListener('click', handleClick);
    section.addEventListener('keydown', handleKeydown);
  }

  App.views.today = { render: render };
})();
