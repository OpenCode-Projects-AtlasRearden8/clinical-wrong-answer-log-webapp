# STATUS.md — Wrong Answer Log

Built: Tue Nov 3 2026 · Owner: Asdale Dynamics, LLC (MIT)

## What was built

A single-file, offline web app for nursing students to log wrong-answer moments
from practice work — education only, never medical advice (disclaimers are shown
in the header banner, on every view, in the footer, and inside the printed sheet).

- `index.html` — the entire app (HTML + CSS + JS). Works straight from `file://`.
  - **New Entry** form: topic, the wrong answer picked, one-sentence
    "why I thought that", and an assigned category (knowledge gap / rushed /
    misread). Validation on all fields; length caps; category required.
  - **History**: newest-first list with category chips, delete (with confirm),
    JSON export and JSON import (validated before replacing the log).
  - **Weekly Recap**: Monday–Sunday weeks with prev/next navigation, per-category
    tally bars, a **top clencher** callout (largest category, canonical-order
    tie-break), and topics to revisit.
  - **Study-Focus Sheet**: printable one-pager for a chosen week — top clencher,
    a focus plan matched to that category, up to five topics, and a disclaimer.
    Print button + `@media print` CSS that prints only the sheet.
  - "Load sample data" button with six clearly fictional entries.
  - All data in localStorage (`wrong-answer-log-entries-v1`); no network requests.
- `tests/run-tests.js` — 27 unit tests for the pure logic, extracted live from
  `index.html` so the shipped file is what's tested: `normalizeCategory`,
  `tallyCategories`, `topCategory` (ties), ISO `weekKey` / `weekOffsetKey`
  (incl. the 2025/2026 ISO-year boundary), `entriesInWeek`, `tallyTopics`,
  `topTopics`, `validateEntry`. Also compiles the full DOM script for syntax.
- `README.md` (credits Asdale Dynamics, LLC) and `LICENSE` (MIT, copyright
  exactly "Copyright (c) 2026 Asdale Dynamics, LLC").

Distinct from `nclex-style-quiz-trainer`: this app has no quiz, scoring, or
grading — it records and reflects on your *own* practice misses.

## How to run it

- Open `index.html` in any modern browser (double-click works; `file://` is fine).
- Run the tests: `node tests/run-tests.js` (needs Node; no browser required).

## Verification results

- `node tests/run-tests.js` → **All 27 tests passed.**
- DOM wiring smoke-tested in Node with stubbed `document`/`window`/`localStorage`:
  form submit → validation → localStorage write → render all verified working.
- Static checks: every element ID referenced by the JS exists in the HTML
  (19/19); exactly one inline `<script>` block; all structural tags balanced.
- No secrets, API keys, or personal data in any file. Sample data is fictional.

## Known gaps / honest limitations

- No in-app edit of existing entries (delete + re-log instead). Edit can be
  added later without schema changes.
- Weekly recap/sheet defaults to the "current" week at load time; if a browser
  session spans a week boundary, re-opening the tab refreshes it.
- No auto-cleanup of localStorage growth; the export/import tools cover backup
  and move, but there is no multi-week trends view yet.
- Print styling tested via the print stylesheet and structure checks, not on
  every physical printer — expect normal browser print-preview tweaking.
- History list renders all entries; a pagination/virtual scroll would matter
  only for logs in the thousands.
