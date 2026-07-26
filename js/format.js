/* =========================================================================
   format.js — unit-aware display formatting

   Turns raw stored numbers into what you actually read on screen:
     90     minutes -> "1h 30m"
     18.4   dollars  -> "$18.40"
     3      count    -> "3"

   Storage always keeps the plain number (PRD.md §5) — formatting is a
   presentation concern only, which is why it's isolated here rather than
   scattered through the view files.
   ========================================================================= */

window.App = window.App || {};

(function () {
  function formatMinutes(value) {
    var total = Math.round(value);
    var hours = Math.floor(total / 60);
    var mins = total % 60;
    if (hours === 0) return mins + 'm';
    if (mins === 0) return hours + 'h';
    return hours + 'h ' + mins + 'm';
  }

  function formatDollars(value) {
    var num = Number(value);
    var sign = num < 0 ? '-' : '';
    return sign + '$' + Math.abs(num).toFixed(2);
  }

  function formatCount(value) {
    // Trims trailing zeros from e.g. 3.0 while allowing 2.5 if it ever occurs.
    return String(Math.round(value * 100) / 100);
  }

  function amount(value, unit) {
    if (unit === 'minutes') return formatMinutes(value);
    if (unit === 'dollars') return formatDollars(value);
    return formatCount(value);
  }

  App.format = {
    amount: amount
  };
})();
