const { test } = require('node:test');
const assert = require('node:assert/strict');
const K = require('../engine.js');
function seeded(seed = 742) { return () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296); }
test('all generated questions obey LEVEL 1 arithmetic, bounds, and support answers', () => {
  const rng = seeded();
  for (const type of K.TYPES) for (let i = 0; i < 2000; i++) {
    const q = K.generate(type, rng);
    assert.ok(Number.isInteger(q.answer) && q.answer >= 1 && q.answer <= 10);
    if (type === 'compare') { assert.notEqual(q.a, q.b); assert.ok(q.a >= 1 && q.a <= 10 && q.b >= 1 && q.b <= 10); assert.equal(q.answer, q.bigger ? Math.max(q.a, q.b) : Math.min(q.a, q.b)); }
    if (type === 'order') assert.equal(q.answer, q.a + q.blank);
    if (type === 'complement' || type === 'split10') assert.equal(q.a + q.answer, 10);
    if (type === 'parts') assert.equal(q.answer, q.compose ? q.a + q.b : q.total - q.a);
    const support = K.support(q); assert.equal(support.answer, q.answer); assert.ok(support.support);
  }
});
test('review gives an often missed type a modest, measurable preference', () => {
  const s = K.createState(); s.types.complement.misses = 4;
  const rng = seeded(); let n = 0;
  for (let i = 0; i < 20000; i++) n += K.chooseType(s.types, rng) === 'complement';
  // 30% dedicated review + 70% uniform (1/5) = 44%.
  assert.ok(n / 20000 > .42 && n / 20000 < .46);
});
test('records main questions once, first-answer correctness and per-type misses', () => {
  const s = K.createState(), q = K.generate('parts', seeded());
  K.record(s, q, 2, '2026-10-04'); K.record(s, q, 0, '2026-10-05');
  assert.equal(s.total, 2); assert.equal(s.correct, 1); assert.equal(s.types.parts.misses, 2);
  assert.equal(s.days['2026-10-04'], 1); assert.equal(s.lastStudyDate, '2026-10-05');
  assert.ok(K.validState(JSON.parse(JSON.stringify(s))));
});
test('rejects malformed or future-version persisted data', () => {
  for (const value of [null, {}, [], { ...K.createState(), version: 2 }, { ...K.createState(), correct: 99 }, { ...K.createState(), types: {} }, { ...K.createState(), days: { nope: -1 } }]) assert.ok(!K.validState(value));
});
