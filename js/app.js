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

  // Render every view once up front so each tab shows real data
  // immediately, not just on first click.
  Object.keys(App.views).forEach(function (name) {
    if (App.views[name].render) App.views[name].render();
  });
}

init();
