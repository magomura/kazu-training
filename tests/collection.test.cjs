const { test } = require('node:test');
const assert = require('node:assert/strict');
const C = require('../collection');
const play = (c, correct = 10, level = 3, recovered = 0, date = '2026-11-11', rng = () => .9) => { C.begin(c, level); return C.finish(c, { level, correct, recovered, date }, rng); };
test('30 new items have unique IDs; progress does not depend on correctness', () => {
  assert.equal(C.catalog.length, 30); assert.equal(new Set(C.catalog.map(x => x.id)).size, 30);
  const c = C.create(); play(c, 0); assert.ok(c.owned.includes('place-0'));
  for (let i = 1; i < 90; i++) play(c, 0, 3, 0, `2026-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + i % 28).padStart(2, '0')}`);
  assert.equal(c.owned.filter(x => x.startsWith('place-')).length, 18); assert.ok(C.valid(c));
});
test('perfect runs stay separate by level, survive days off, reset on abandonment and misses', () => {
  const c = C.create(); play(c); play(c, 10, 2); play(c, 10, 3, 0, '2026-12-12');
  assert.equal(c.streaks[3], 2); assert.ok(!c.owned.includes('three'));
  play(c); assert.ok(c.owned.includes('three'));
  C.begin(c, 3); C.abandon(c); assert.equal(c.streaks[3], 0); assert.ok(c.owned.includes('three'));
  for (let i = 0; i < 5; i++) play(c);
  assert.ok(c.owned.includes('five')); play(c, 9); assert.equal(c.streaks[3], 0);
  for (let i = 0; i < 10; i++) play(c);
  assert.ok(c.owned.includes('ten')); assert.equal(c.best[3], 10);
});
test('rare draw is capped at 3 per day, persists, has a guarantee and no duplicates', () => {
  let c = C.create();
  for (let i = 0; i < 20; i++) play(c, 10, 3, 0, '2026-11-11');
  assert.equal(c.dailyDraws, 3); assert.equal(c.missDraws, 3); assert.ok(!c.owned.some(x => x.startsWith('rare-')));
  c = JSON.parse(JSON.stringify(c));
  for (let day = 12; day <= 15; day++) for (let i = 0; i < 3; i++) play(c, 10, 3, 0, `2026-11-${day}`);
  assert.equal(c.owned.filter(x => x.startsWith('rare-')).length, 1); assert.equal(c.missDraws, 0);
  for (let day = 16; day < 22; day++) play(c, 10, 3, 0, `2026-11-${day}`, () => 0);
  assert.equal(c.owned.filter(x => x.startsWith('rare-')).length, 6); assert.equal(new Set(c.owned).size, c.owned.length);
  assert.ok(C.valid(c));
});
test('low score alone gives no badge; recovering also has an alternative without low scores', () => {
  const c = C.create(); play(c, 5, 3, 0); assert.ok(!c.owned.includes('rainbow'));
  play(c, 5, 3, 1); assert.ok(c.owned.includes('rainbow'));
  const other = C.create(); for (let i = 0; i < 10; i++) play(other, 9, 3, 1);
  assert.ok(other.owned.includes('retry') && other.owned.includes('rainbow'));
});
test('12% boundary and malformed stored collectibles', () => {
  const c = C.create(); play(c, 10, 3, 0, '2026-11-11', () => .119); assert.ok(c.owned.some(x => x.startsWith('rare-')));
  const d = C.create(); play(d, 10, 3, 0, '2026-11-11', () => .12); assert.ok(!d.owned.some(x => x.startsWith('rare-')));
  for (const bad of [{ ...c, owned: ['unknown'] }, { ...c, owned: ['three', 'three'] }, { ...c, pendingLevel: 4 }, { ...c, missDraws: 15 }]) assert.equal(C.valid(bad), false);
});
