# Wrong Answer Log

A small offline web app for nursing students who practice questions and miss some.
Instead of a quiz *score*, this app captures the learning moment: the topic, the wrong
answer you picked, one honest sentence about why you thought that, and the category
you assign to the miss.

Every week it picks your **"top clencher"** — the category that clenched the most
wrong answers — and turns it into a printable one-page **study-focus sheet**.

Built by [Asdale Dynamics, LLC](https://dylanasdale.github.io) as an open-source,
local-first education tool. Plain, warm, and beginner-friendly — like everything
Asdale Dynamics makes.

> **Education only — not medical advice.**
> This tool describes *study habits*, never clinical practice. It is not medical
> advice and is not a substitute for your instructors, textbooks, or your own
> professional judgment. A disclaimer appears on every view of the app.

## How to run it

Just open the file. No install, no server, no internet:

- Double-click `index.html`, or open it in any modern browser (`file://` works).

All data is stored in your browser's localStorage, on your device only. Nothing is
sent anywhere; there are no accounts, no analytics, no network calls.

## Logging a moment

Each entry asks for exactly four things:

1. **Study topic** — e.g. "Pre-eclampsia warning signs"
2. **The wrong answer you picked** — so you remember what you fell for
3. **Why I thought that** — one sentence, honest, no judgment
4. **Assigned category** — how the miss happened, not whether you're "bad" at it:
   - **Knowledge gap** — you didn't know the material
   - **Rushed** — you knew it, but your pace beat your accuracy
   - **Misread** — the material was fine; the reading was the problem

## What it shows

- **History** — every logged moment, newest first, with a delete button
- **Weekly recap** — Monday–Sunday weeks, a per-category tally bar, the week's
  top clencher callout, and topics to revisit
- **Study-focus sheet** — a printable page with the top category, a focus plan
  (specific study tactics matched to that category), and up to five topics to
  hit first. Use the **Print sheet** button or your browser's print preview.
- **Export / import (JSON)** — in the History view, so you can back up your log
  or move it to another browser/device yourself. No cloud involved.

There is also a **Load sample data** button on the entry screen (clearly fictional
entries) if you want to see the app in action before logging real mistakes of your own.

## Privacy

No secrets, no personal data, no network. Your log lives in localStorage on your
machine; the export feature writes a JSON file only when you click it. Sample
data is fictional.

## Tests

The category-tally logic (tallying, the "top clencher" pick, tie-breaking,
ISO-week math, and input validation) is extracted directly from `index.html`
and tested, so the shipped file is what gets verified:

```
node tests/run-tests.js
```

Requires Node.js. All tests are pure-logic tests — no browser needed.

## Project layout

```
index.html          the whole app (HTML + CSS + JS, single file, works from file://)
tests/run-tests.js  unit tests for the tally/week/validation logic
LICENSE             MIT
```

## Credits and license

Copyright (c) 2026 Asdale Dynamics, LLC. Released under the MIT License — see
[LICENSE](LICENSE). Asdale Dynamics, LLC makes beginner-friendly AI education,
books, guides, and practical tools at [dylanasdale.github.io](https://dylanasdale.github.io).
