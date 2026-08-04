/* =========================================================================
   app.js — boot, tab navigation, and shell-level controls

   Loads last (see index.html) because it's the only file that needs every
   other piece already in place. Phase 0's whole job: prove the page wires
   up correctly and switching tabs works. Later phases add a call to each
   view's .render() here, once those views actually do something.

   The bottom-nav buttons added in the redesign's Milestone 1 reuse the
   same "tab" class and data-view attributes as the desktop tabs, so
   showView()'s querySelectorAll('.tab') already covers them — no new
   navigation logic needed, just more buttons in the DOM.

   Milestone 3 adds a 4th .view — tracker detail — that isn't one of the
   three tab destinations. It's opened by tapping a tracker (from Today
   or Trackers) via showTrackerDetail(), and closed back to whichever of
   those it was opened from via closeTrackerDetail(). There's no back-
   button history stack in this app; detailReturnView is the entire
   "history" it needs.
   ========================================================================= */

window.App = window.App || {};

/**
 * Show the view matching `name` ("today" | "summary" | "trackers"),
 * hide the other two, mark the matching tab button active, and re-render
 * that view from current data — so it's always showing the latest state,
 * even if it changed on a different tab.
 */
function showView(name) {
  document.querySelectorAll('.view').forEach(function (section) {
    section.classList.toggle('is-active', section.id === 'view-' + name);
  });

  document.querySelectorAll('.tab').forEach(function (button) {
    button.classList.toggle('is-active', button.dataset.view === name);
  });

  if (App.views[name] && App.views[name].render) {
    App.views[name].render();
  }
}

// Which tab to return to when the tracker detail screen closes.
var detailReturnView = 'trackers';

/**
 * Open the tracker detail screen for `trackerId`. `returnTo` ("today" or
 * "trackers") records where to go back to, since detail isn't reachable
 * from a tab button and so isn't part of showView()'s tab/view pairing.
 */
function showTrackerDetail(trackerId, returnTo) {
  detailReturnView = returnTo || 'trackers';

  document.querySelectorAll('.view').forEach(function (section) {
    section.classList.toggle('is-active', section.id === 'view-tracker-detail');
  });

  // No tab button corresponds to the detail screen, so none should look active.
  document.querySelectorAll('.tab').forEach(function (button) {
    button.classList.remove('is-active');
  });

  if (App.views.trackerDetail) {
    App.views.trackerDetail.render(trackerId);
  }
}

function closeTrackerDetail() {
  showView(detailReturnView);
}

/**
 * The mobile floating quick-add button: jump to Today and focus the log
 * form's amount field. If there are no trackers yet, Today just shows
 * its own "create a tracker" empty state instead — nothing to focus.
 */
function handleQuickAdd() {
  showView('today');

  var amountInput = document.getElementById('log-amount');
  if (amountInput) {
    amountInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
    amountInput.focus();
  }
}

function renderHeaderDate() {
  var el = document.getElementById('header-date');
  if (!el) return;
  var today = new Date();
  el.textContent = today.toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });
}

function init() {
  renderHeaderDate();

  document.querySelectorAll('.tab').forEach(function (button) {
    button.addEventListener('click', function () {
      showView(button.dataset.view);
    });
  });

  var fab = document.getElementById('quick-add-fab');
  if (fab) fab.addEventListener('click', handleQuickAdd);

  // Render every view once up front so each tab shows real data
  // immediately, not just on first click.
  Object.keys(App.views).forEach(function (name) {
    if (App.views[name].render) App.views[name].render();
  });
}

init();
