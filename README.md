# Tally

A personal tracker that runs entirely in your browser — no accounts, no server, works offline. Define your own trackers (study time, habits, spending — anything measured in minutes, counts, or dollars), log entries, and see today's activity plus weekly/monthly/yearly totals, insights, and a searchable history.

**Live:** https://kersernchuarh.github.io/Tally/ — open it from any device's browser, no install needed.

## Running it locally

Right-click **`index.html`** → **Open with** → Edge (or Chrome). Double-clicking may not work depending on your machine's default app for `.html` files.

## Your data

Data is saved in the browser's local storage, separately for every device/browser that opens the app — it does **not** sync between the local copy, the hosted link, your phone, etc. Use the **Export backup (JSON)** / **Import backup** buttons on the Trackers tab to move your history between them, and export regularly as a safety backup — local storage can be wiped by clearing browser data.

## Project docs

- [PRD.md](PRD.md) — what this app does and why, in detail
- [ROADMAP.md](ROADMAP.md) — the build plan, phase by phase
- [STRUCTURE.md](STRUCTURE.md) — how the code is organised and why
- [CLAUDE.md](CLAUDE.md) — working notes for Claude Code sessions

## Status

v1 complete (Phases 0–4), plus a post-v1 design and features pass. See [CLAUDE.md](CLAUDE.md) for the current checklist and [PRD.md §13](PRD.md) for what was added after v1.
