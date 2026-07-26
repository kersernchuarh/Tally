/* =========================================================================
   app.js — boot and tab navigation

   Loads last (see index.html) because it's the only file that needs every
   other piece already in place. Phase 0's whole job: prove the page wires
   up correctly and switching tabs works. Later phases add a call to each
   view's .render() here, once those views actually do something.
   ========================================================================= */

window.App = window.App || {};

/**
 * Show the view matching `name` ("today" | "summary" | "trackers"),
 * hide the other two, and mark the matching tab button active.
 *
 * This — swap a CSS class, never touch page structure — is the pattern
 * every view in this app will follow: change data, then redraw from it.
 */
function showView(name) {
  document.querySelectorAll('.view').forEach(function (section) {
    section.classList.toggle('is-active', section.id === 'view-' + name);
  });

  document.querySelectorAll('.tab').forEach(function (button) {
    button.classList.toggle('is-active', button.dataset.view === name);
  });
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

  // Phase 1+: App.views.trackers.render(), App.views.today.render(), etc.
  // will be called here once each view has real data to show.
}

init();
