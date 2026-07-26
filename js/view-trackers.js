/* =========================================================================
   view-trackers.js — renders the Trackers tab

   Create / rename / archive / restore / delete trackers (F1–F3, PRD.md §6).

   Pattern used throughout this app: render() rebuilds the section's HTML
   entirely from App.store data every time something changes. Nothing here
   ever hand-edits a piece of the page — change the data, then redraw from
   it. One click listener per section (event delegation) reads a
   data-action attribute rather than attaching a listener per button.
   ========================================================================= */

window.App = window.App || {};
App.views = App.views || {};

(function () {
  var UNITS = [
    { value: 'minutes', label: 'Minutes' },
    { value: 'count', label: 'Count' },
    { value: 'dollars', label: 'Dollars' }
  ];

  // Local UI state — which tracker (if any) is mid-rename, and whether the
  // archived list is expanded. Not saved data, just what this screen shows.
  var editingId = null;
  var showArchived = false;

  function unitLabel(unit) {
    var match = UNITS.filter(function (u) { return u.value === unit; })[0];
    return match ? match.label : unit;
  }

  /** Escapes text before it goes into innerHTML, so a tracker named
   *  "<script>" renders as text instead of running. */
  function escapeHtml(str) {
    var div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  function unitOptionsHtml(selected) {
    return UNITS.map(function (u) {
      return '<option value="' + u.value + '"' + (u.value === selected ? ' selected' : '') + '>' +
        u.label + '</option>';
    }).join('');
  }

  function trackerRowHtml(tracker, entryCount) {
    if (editingId === tracker.id) {
      return (
        '<li class="tracker-row" data-id="' + tracker.id + '">' +
          '<form class="tracker-row__rename-form" data-action="rename-submit" data-id="' + tracker.id + '">' +
            '<input type="text" name="name" value="' + escapeHtml(tracker.name) + '" required>' +
            '<button type="submit" class="btn btn--primary">Save</button>' +
            '<button type="button" class="btn" data-action="rename-cancel">Cancel</button>' +
          '</form>' +
        '</li>'
      );
    }

    var countLabel = entryCount + (entryCount === 1 ? ' entry' : ' entries');

    return (
      '<li class="tracker-row' + (tracker.archived ? ' tracker-row--archived' : '') + '" data-id="' + tracker.id + '">' +
        '<div class="tracker-row__info">' +
          '<span class="tracker-row__name">' + escapeHtml(tracker.name) + '</span>' +
          '<span class="tracker-row__meta">' + unitLabel(tracker.unit) + ' &middot; ' + countLabel + '</span>' +
        '</div>' +
        '<div class="tracker-row__actions">' +
          '<button type="button" class="btn" data-action="rename" data-id="' + tracker.id + '">Rename</button>' +
          (tracker.archived
            ? '<button type="button" class="btn" data-action="restore" data-id="' + tracker.id + '">Restore</button>'
            : '<button type="button" class="btn" data-action="archive" data-id="' + tracker.id + '">Archive</button>') +
          '<button type="button" class="btn btn--danger" data-action="delete" data-id="' + tracker.id + '">Delete</button>' +
        '</div>' +
      '</li>'
    );
  }

  function countEntriesFor(data, trackerId) {
    return data.entries.filter(function (e) { return e.trackerId === trackerId; }).length;
  }

  function render() {
    var section = document.getElementById('view-trackers');
    if (!section) return;

    var data = App.store.load();
    var active = data.trackers.filter(function (t) { return !t.archived; });
    var archived = data.trackers.filter(function (t) { return t.archived; });

    var html = '<h2 class="view-title">Trackers</h2>';

    html += '<form class="card add-tracker-form" data-action="add-submit">' +
      '<div class="field">' +
        '<label for="new-tracker-name">Name</label>' +
        '<input type="text" id="new-tracker-name" name="name" placeholder="e.g. Math study" required>' +
      '</div>' +
      '<div class="field">' +
        '<label for="new-tracker-unit">Unit</label>' +
        '<select id="new-tracker-unit" name="unit">' + unitOptionsHtml('minutes') + '</select>' +
      '</div>' +
      '<button type="submit" class="btn btn--primary">Add tracker</button>' +
    '</form>';

    if (data.trackers.length === 0) {
      html +=
        '<div class="placeholder">' +
          '<p class="placeholder__label">No trackers yet</p>' +
          '<p class="placeholder__text">Create your first tracker above to start logging.</p>' +
        '</div>';
    } else if (active.length === 0) {
      html += '<p class="empty-note">No active trackers.</p>';
    } else {
      html += '<ul class="tracker-list">' +
        active.map(function (t) { return trackerRowHtml(t, countEntriesFor(data, t.id)); }).join('') +
        '</ul>';
    }

    if (archived.length > 0) {
      html +=
        '<button type="button" class="btn archived-toggle" data-action="toggle-archived">' +
          (showArchived ? 'Hide' : 'Show') + ' archived (' + archived.length + ')' +
        '</button>';

      if (showArchived) {
        html += '<ul class="tracker-list tracker-list--archived">' +
          archived.map(function (t) { return trackerRowHtml(t, countEntriesFor(data, t.id)); }).join('') +
          '</ul>';
      }
    }

    section.innerHTML = html;
  }

  function handleSubmit(e) {
    var form = e.target.closest('form[data-action]');
    if (!form) return;
    e.preventDefault();

    var action = form.dataset.action;

    if (action === 'add-submit') {
      var name = form.elements.name.value.trim();
      var unit = form.elements.unit.value;
      try {
        App.store.addTracker(name, unit);
      } catch (err) {
        alert(err.message);
        return;
      }
      render();
    }

    if (action === 'rename-submit') {
      var id = form.dataset.id;
      var newName = form.elements.name.value.trim();
      try {
        App.store.renameTracker(id, newName);
      } catch (err) {
        alert(err.message);
        return;
      }
      editingId = null;
      render();
    }
  }

  function handleClick(e) {
    var button = e.target.closest('button[data-action]');
    if (!button) return;

    var action = button.dataset.action;
    var id = button.dataset.id;

    if (action === 'rename') {
      editingId = id;
      render();
      return;
    }

    if (action === 'rename-cancel') {
      editingId = null;
      render();
      return;
    }

    if (action === 'archive') {
      App.store.archiveTracker(id);
      render();
      return;
    }

    if (action === 'restore') {
      App.store.restoreTracker(id);
      render();
      return;
    }

    if (action === 'delete') {
      var data = App.store.load();
      var tracker = data.trackers.filter(function (t) { return t.id === id; })[0];
      var count = countEntriesFor(data, id);

      var message = 'Delete "' + (tracker ? tracker.name : 'this tracker') + '"?';
      if (count > 0) {
        message += ' This will also permanently delete ' + count +
          (count === 1 ? ' entry' : ' entries') + '.';
      }

      if (window.confirm(message)) {
        App.store.deleteTracker(id);
        render();
      }
      return;
    }

    if (action === 'toggle-archived') {
      showArchived = !showArchived;
      render();
    }
  }

  var section = document.getElementById('view-trackers');
  if (section) {
    section.addEventListener('submit', handleSubmit);
    section.addEventListener('click', handleClick);
  }

  App.views.trackers = { render: render };
})();
