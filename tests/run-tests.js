#!/usr/bin/env node
// Tests for the Wrong Answer Log's pure logic (category tally, week helpers,
// entry validation). The tested code is extracted directly from index.html so
// the shipped file is what gets verified.
//
// Run:  node tests/run-tests.js   (from the project folder)

'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const assert = require('assert');

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

// ---- extract the PURE LOGIC block from index.html ----
const START = '// ==== PURE LOGIC (tests) ====';
const END = '// ==== END PURE LOGIC ====';
const startIdx = indexHtml.indexOf(START);
const endIdx = indexHtml.indexOf(END);
assert.ok(startIdx !== -1 && endIdx !== -1 && endIdx > startIdx,
  'index.html must contain the PURE LOGIC test block');
const logicSource = indexHtml.slice(startIdx, endIdx);

// The DOM application block must be syntactically valid too (compile only).
const scriptBlocks = [...indexHtml.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
assert.ok(scriptBlocks.length === 1, 'expected exactly one inline <script> block');

// Compile the pure-logic block first (catches syntax errors), then eval it in
// a wrapper that returns the public functions.
// runInThisContext keeps objects in Node's own realm so deepStrictEqual works.
vm.runInThisContext(logicSource, { filename: 'logic.js' });
const api = vm.runInThisContext(`(function () {
  ${logicSource}
  return { CATEGORIES, CATEGORY_LABELS, normalizeCategory, tallyCategories,
           topCategory, weekKey, startOfWeek, weekStartFromKey, weekOffsetKey,
           entriesInWeek, parseEntryDate, tallyTopics, topTopics, validateEntry,
           WHY_MAX, TOPIC_MAX, ANSWER_MAX };
})()`, { filename: 'logic.js' });
new vm.Script(scriptBlocks[0] + '\n; window.wrongAnswerLog;', { filename: 'index.html-script.js' }); // syntax check only

// ---- tiny test harness ----
let passed = 0;
let failed = 0;
function test(name, fn) {
  try {
    fn(api);
    passed++;
    console.log('  ok ' + name);
  } catch (err) {
    failed++;
    console.error('  FAIL ' + name);
    console.error('       ' + (err && err.message ? err.message : err));
  }
}
function entry(cat, extra) {
  return Object.assign({
    id: 'x', topic: 'Topic A', answer: 'Answer B',
    why: 'Because I mixed things up.', category: cat,
    date: new Date(2026, 10, 2).toISOString(), createdAt: 1
  }, extra || {});
}

console.log('normalizeCategory');
test('accepts canonical categories', (t) => {
  for (const c of t.CATEGORIES) {
    assert.strictEqual(t.normalizeCategory(c), c);
  }
});
test('accepts label and messy-case forms', (t) => {
  assert.strictEqual(t.normalizeCategory('Knowledge Gap'), 'knowledge gap');
  assert.strictEqual(t.normalizeCategory('RUSHED'), 'rushed');
  assert.strictEqual(t.normalizeCategory('misread '), 'misread');
  assert.strictEqual(t.normalizeCategory('gap'), 'knowledge gap');
});
test('rejects non-category values', (t) => {
  assert.strictEqual(t.normalizeCategory('lucky guess'), null);
  assert.strictEqual(t.normalizeCategory(''), null);
  assert.strictEqual(t.normalizeCategory(null), null);
  assert.strictEqual(t.normalizeCategory(42), null);
});

console.log('tallyCategories');
test('empty input yields zeroed tally', (t) => {
  assert.deepStrictEqual(t.tallyCategories([]),
    { 'knowledge gap': 0, rushed: 0, misread: 0 });
});
test('counts each category correctly', (t) => {
  const tally = t.tallyCategories([
    entry('knowledge gap'), entry('rushed'),
    entry('knowledge gap'), entry('misread'),
    entry('knowledge gap')
  ]);
  assert.deepStrictEqual(tally, { 'knowledge gap': 3, rushed: 1, misread: 1 });
});
test('normalizes messy category strings before counting', (t) => {
  const tally = t.tallyCategories([entry('Rushed'), entry('  MISREAD ')]);
  assert.strictEqual(tally.rushed, 1);
  assert.strictEqual(tally.misread, 1);
  assert.strictEqual(tally['knowledge gap'], 0);
});
test('skips unknown and missing categories', (t) => {
  const tally = t.tallyCategories([entry('vibes'), entry({}), entry(null)]);
  assert.deepStrictEqual(tally, { 'knowledge gap': 0, rushed: 0, misread: 0 });
});
test('non-array input yields zeroed tally', (t) => {
  assert.deepStrictEqual(t.tallyCategories(null),
    { 'knowledge gap': 0, rushed: 0, misread: 0 });
  assert.deepStrictEqual(t.tallyCategories(undefined),
    { 'knowledge gap': 0, rushed: 0, misread: 0 });
});

console.log('topCategory');
test('returns null when nothing counts', (t) => {
  assert.strictEqual(t.topCategory([]), null);
  assert.strictEqual(t.topCategory([entry('lucky')]), null);
});
test('returns the largest category', (t) => {
  const top = t.topCategory([
    entry('rushed'), entry('rushed'), entry('misread'),
    entry('knowledge gap'), entry('rushed')
  ]);
  assert.deepStrictEqual(top, { category: 'rushed', count: 3 });
});
test('ties break in canonical order (knowledge gap, rushed, misread)', (t) => {
  const [kg, ru, mi] = t.CATEGORIES;
  assert.strictEqual(t.topCategory([entry(kg), entry(ru)]).category, kg);
  assert.strictEqual(t.topCategory([entry(ru), entry(mi)]).category, ru);
  assert.strictEqual(t.topCategory([entry(mi), entry(kg)]).category, kg);
  const all = t.topCategory([entry(kg), entry(ru), entry(mi)]);
  assert.strictEqual(all.category, kg);
});

console.log('weekKey (ISO weeks, Monday start)');
test('known date maps to ISO week', (t) => {
  assert.strictEqual(t.weekKey(new Date(2026, 10, 3)), '2026-W45'); // Tue Nov 3 2026
});
test('ISO year boundaries', (t) => {
  assert.strictEqual(t.weekKey(new Date(2026, 0, 1)), '2026-W01'); // Thu Jan 1
  assert.strictEqual(t.weekKey(new Date(2025, 11, 29)), '2026-W01'); // Mon Dec 29 2025
  assert.strictEqual(t.weekKey(new Date(2025, 11, 28)), '2025-W52'); // Sun Dec 28 2025
});
test('whole first week of 2026 shares one key', (t) => {
  for (let day = 29; day <= 31; day++) {
    assert.strictEqual(t.weekKey(new Date(2025, 11, day)), '2026-W01');
  }
  for (let day = 1; day <= 4; day++) {
    assert.strictEqual(t.weekKey(new Date(2026, 0, day)), '2026-W01');
  }
});

console.log('startOfWeek / weekStartFromKey / weekOffsetKey');
test('startOfWeek returns the Monday 00:00 local', (t) => {
  const mon = t.startOfWeek(new Date(2026, 10, 3)); // Tue
  assert.strictEqual(mon.getDay(), 1);
  assert.strictEqual(mon.getFullYear(), 2026);
  assert.strictEqual(mon.getMonth(), 10);
  assert.strictEqual(mon.getDate(), 2);
  const sun = t.startOfWeek(new Date(2026, 10, 8)); // Sun
  assert.strictEqual(sun.getDate(), 2);
});
test('weekStartFromKey parses keys back to their Monday', (t) => {
  const start = t.weekStartFromKey('2026-W45');
  assert.strictEqual(t.weekKey(start), '2026-W45');
  assert.strictEqual(start.getDay(), 1);
  assert.strictEqual(t.weekStartFromKey('nonsense'), null);
  assert.strictEqual(t.weekStartFromKey('2026-W99'), null);
});
test('weekOffsetKey walks forward and backward correctly', (t) => {
  assert.strictEqual(t.weekOffsetKey('2026-W45', 1), '2026-W46');
  assert.strictEqual(t.weekOffsetKey('2026-W45', -1), '2026-W44');
  assert.strictEqual(t.weekOffsetKey('2026-W01', -1), '2025-W52'); // across ISO year
  assert.strictEqual(t.weekOffsetKey('2025-W52', 1), '2026-W01');
  assert.strictEqual(t.weekOffsetKey('nope', 1), null);
});

console.log('entriesInWeek');
test('includes only entries whose date is in the target week', (t) => {
  const inWeek = [
    entry('rushed', { date: new Date(2026, 10, 2).toISOString(), createdAt: 2 }),   // Mon
    entry('misread', { date: new Date(2026, 10, 8).toISOString(), createdAt: 3 })   // Sun
  ];
  const outOfWeek = [
    entry('knowledge gap', { date: new Date(2026, 10, 1).toISOString(), createdAt: 1 }), // Sun prior
    entry('rushed', { date: new Date(2026, 10, 9).toISOString(), createdAt: 4 })         // Mon next
  ];
  const result = t.entriesInWeek(outOfWeek.concat(inWeek), '2026-W45');
  assert.strictEqual(result.length, 2);
  assert.deepStrictEqual(result, inWeek);
});
test('handles plain YYYY-MM-DD dates as local days', (t) => {
  const result = t.entriesInWeek([
    { category: 'rushed', date: '2026-11-03' },
    { category: 'rushed', date: '2026-11-08' },
    { category: 'rushed', date: '2026-11-01' }
  ], '2026-W45');
  assert.strictEqual(result.length, 2);
});
test('empty / invalid inputs are safe', (t) => {
  assert.deepStrictEqual(t.entriesInWeek([], '2026-W45'), []);
  assert.deepStrictEqual(t.entriesInWeek(null, '2026-W45'), []);
});

console.log('tallyTopics / topTopics');
test('topics sorted by count, ties alphabetical', (t) => {
  const topics = t.tallyTopics([
    entry('rushed', { topic: 'ABCs' }), entry('rushed', { topic: ' abcS ' }),
    entry('rushed', { topic: 'Beta ' }), entry('rushed', { topic: 'gamma' }),
    entry('rushed', { topic: 'beta' })
  ]);
  assert.deepStrictEqual(topics, [
    { topic: 'ABCs', count: 2 },
    { topic: 'Beta', count: 2 },
    { topic: 'gamma', count: 1 }
  ]);
});
test('topTopics respects the limit', (t) => {
  const week = [
    entry('rushed', { topic: 'Fluids' }), entry('rushed', { topic: 'Fluids' }),
    entry('rushed', { topic: 'Electrolytes' }), entry('rushed', { topic: 'Acid-base' })
  ];
  assert.strictEqual(t.topTopics(week, 1).length, 1);
  assert.deepStrictEqual(t.topTopics(week, 1), [{ topic: 'Fluids', count: 2 }]);
  assert.strictEqual(t.topTopics(week, 0).length, 0);
});

console.log('validateEntry');
test('accepts a full valid entry', (t) => {
  const v = t.validateEntry({
    topic: 'Insulin types', answer: 'Regular insulin at bedtime',
    why: 'I had the timing tables swapped.', category: 'knowledge gap'
  });
  assert.ok(v.ok);
  assert.strictEqual(v.entry.category, 'knowledge gap');
  assert.ok(v.entry.id);
  assert.ok(Date.parse(v.entry.date));
});
test('rejects missing required fields', (t) => {
  const v = t.validateEntry({ topic: '', answer: '', why: '', category: '' });
  assert.strictEqual(v.ok, false);
  assert.strictEqual(v.errors.length, 4);
});
test('rejects invalid category values', (t) => {
  const v = t.validateEntry({ topic: 'T', answer: 'A', why: 'W', category: 'lucky' });
  assert.strictEqual(v.ok, false);
  assert.ok(v.errors.some(e => /category/i.test(e)));
});
test('enforces one-sentence style length cap on the why field', (t) => {
  const v = t.validateEntry({
    topic: 'T', answer: 'A', why: 'w'.repeat(t.WHY_MAX + 1), category: 'rushed'
  });
  assert.strictEqual(v.ok, false);
  const v2 = t.validateEntry({
    topic: 'T', answer: 'A', why: 'w'.repeat(t.WHY_MAX), category: 'rushed'
  });
  assert.ok(v2.ok);
});
test('rejects non-object input', (t) => {
  for (const bad of [null, 'e', 5]) {
    const v = t.validateEntry(bad);
    assert.strictEqual(v.ok, false);
  }
});

console.log('');
console.log(failed === 0
  ? `All ${passed} tests passed.`
  : `${failed} test(s) FAILED, ${passed} passed.`);
process.exit(failed === 0 ? 0 : 1);
