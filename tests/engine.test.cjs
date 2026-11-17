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
  for (const value of [null, {}, [], { ...K.createState(), version: 4 }, { ...K.createState(), correct: 99 }, { ...K.createState(), types: {} }, { ...K.createState(), days: { nope: -1 } }, { ...K.createState(), recent: [{ level: 2, correct: 11 }] }, { ...K.createState(), collection: {} }]) assert.ok(!K.validState(value));
});
test('LEVEL 3 blank equations and every bridge support step are mathematically valid', () => {
  const rng = seeded(827);
  for (const type of ['missingAdd', 'missingSub', 'addBridge', 'subBridge']) for (let i = 0; i < 3000; i++) {
    const q = K.generate(type, rng);
    assert.ok(q.answer >= 0 && q.answer <= 20);
    if (type === 'missingAdd') assert.equal(q.a + q.answer, q.result);
    if (type === 'missingSub') assert.equal(q.total - q.answer, q.result);
    const steps = K.supportSteps(q);
    assert.equal(steps.length, type.endsWith('Bridge') || type === 'missingSub' ? 3 : 1);
    for (const p of steps) {
      assert.equal(p.answer, p.subtract ? p.total - p.b : p.compose ? p.total : p.total - p.a);
      assert.ok(p.total <= 20 && p.answer >= 0 && p.answer <= 20);
    }
    if (type.endsWith('Bridge')) assert.equal(steps.at(-1).answer, q.answer);
  }
});
test('v2 migration retains old learning, recent sessions and shooting stars', () => {
  const old = K.createState(); old.version = 2; delete old.collection;
  K.THIRD_TYPES.forEach(t => delete old.types[t]);
  old.total = 330; old.correct = 320; old.bright = 27; old.recent = [{ level: 2, correct: 10 }];
  const next = K.migrate(old);
  assert.equal(next.version, 3); assert.equal(next.total, 330); assert.equal(next.bright, 27);
  assert.deepEqual(next.recent, old.recent); assert.equal(next.collection.completed, 0);
  assert.equal(next.collection.streaks[2], 0); assert.ok(K.validState(next));
});
test('LEVEL 3 has harder relations and returns to a gentler mix at 5/10', () => {
  const s = K.createState();
  const plan = K.schedule(s, 3, seeded());
  assert.equal(plan.length, 10); ['addBridge', 'subBridge', 'missingAdd', 'missingSub'].forEach(t => assert.ok(plan.includes(t)));
  K.completeSession(s, 3, 5, 1, '2026-11-11', () => .9);
  const gentle = K.schedule(s, 3, seeded());
  assert.equal(gentle.length, 10); assert.ok(!gentle.some(t => t.startsWith('missing')));
  assert.ok(gentle.includes('complement') && gentle.includes('parts'));
});
test('LEVEL 2 arithmetic and distinct prerequisite answers stay within bounds', () => {
  const rng = seeded(913);
  for (const type of K.NEXT_TYPES) for (let i = 0; i < 2000; i++) {
    const q = K.generate(type, rng), p = K.support(q);
    assert.ok(q.answer >= 0 && q.answer <= 20);
    assert.ok(q.total >= 1 && q.total <= 20);
    assert.equal(q.answer, type === 'tens' ? q.total - 10 : q.subtract ? q.a - q.b : q.a + q.b);
    assert.equal(p.answer, p.compose ? p.a + p.b : p.total - p.a);
    assert.ok(p.support && p.answer >= 0 && p.answer <= 10);
    if (type === 'add20') assert.ok(q.a === 10 || q.a % 10 + q.b < 10);
    if (type === 'sub20') assert.ok(q.answer >= 10);
    if (type === 'addBridge') assert.ok(q.a < 10 && q.b < 10 && q.answer > 10);
    if (type === 'subBridge') assert.ok(q.a > 10 && q.b < 10 && q.answer < 10);
  }
});
test('migrates legacy history without losing counts or changing input', () => {
  const legacy = { version: 1, total: 30, correct: 29, lastStudyDate: '2026-10-07', days: { '2026-10-07': 30 }, types: Object.fromEntries(K.TYPES.map(t => [t, { total: 6, correct: t === 'parts' ? 5 : 6, misses: t === 'parts' ? 1 : 0 }])) };
  const before = JSON.stringify(legacy), s = K.migrate(legacy);
  assert.equal(JSON.stringify(legacy), before); assert.equal(s.total, 30); assert.equal(s.correct, 29);
  assert.deepEqual(s.days, legacy.days);
  K.TYPES.forEach(t => assert.deepEqual(s.types[t], legacy.types[t]));
  assert.ok(K.validState(s)); assert.equal(s.types.add20.total, 0);
  assert.deepEqual(K.migrate(s), s);
});
test('8/10 opens only two bridge questions; lower accuracy restores basics', () => {
  const s = K.createState(), rng = seeded();
  const check = bridges => {
    const plan = K.schedule(s, 2, rng); assert.equal(plan.length, 10);
    assert.equal(plan.filter(t => K.TYPES.includes(t)).length, 2);
    assert.equal(plan.filter(t => t.endsWith('Bridge')).length, bridges);
    ['tens', 'add20', 'sub20'].forEach(t => assert.ok(plan.includes(t)));
  };
  check(0); K.completeSession(s, 2, 7); check(0);
  K.completeSession(s, 2, 8); check(2); assert.equal(s.bright, 1);
  K.completeSession(s, 2, 5); check(0);
  for (let i = 0; i < 8; i++) K.completeSession(s, 1, 10);
  assert.equal(s.recent.length, 5); assert.ok(K.validState(s));
});
test('subtraction uses ten minus subtrahend, then adds the ones', () => {
  for (let a = 11; a <= 18; a++) for (let b = a - 9; b <= 9; b++) {
    const q = { ...K.generate('subBridge'), a, b, total: a, answer: a - b, prerequisite: { total: a, a: 10, answer: a - 10 } };
    const steps = K.supportSteps(q);
    assert.deepEqual(steps.map(p => p.answer), [a - 10, 10 - b, a - b]);
    assert.equal(steps[1].expression, `10 − ${b} ＝ □`);
    assert.equal(steps[2].expression, `${10 - b} ＋ ${a - 10} ＝ □`);
  }
});
test('review recovers after three first answers, persists, and reopens on a miss', () => {
  let s = K.createState(); const q = K.generate('subBridge');
  K.record(s, q, 1, '2026-11-17');
  const select = () => K.chooseType(s.types, () => 0, ['compare', 'subBridge']);
  for (let i = 0; i < 3; i++) { assert.equal(select(), 'subBridge'); K.record(s, q, 0, '2026-11-17'); }
  s = K.migrate(JSON.parse(JSON.stringify(s)));
  assert.equal(select(), 'compare'); assert.equal(s.types.subBridge.misses, 1);
  K.record(s, q, 1, '2026-11-17'); assert.equal(select(), 'subBridge');
  delete s.types.subBridge.firstCorrectStreak;
  assert.ok(K.validState(s)); assert.equal(select(), 'subBridge');
  s.types.subBridge.firstCorrectStreak = -1; assert.ok(!K.validState(s));
});
test('mistake cues distinguish operations, blanks, offsets and complements', () => {
  assert.match(K.mistakeHint({ subtract: true, a: 14, b: 8, answer: 6 }, 22), /ひき算/);
  assert.match(K.mistakeHint({ type: 'missingAdd', a: 8, result: 13, answer: 5 }, 21), /8から13/);
  assert.match(K.mistakeHint({ type: 'addBridge', answer: 13 }, 12), /1つずつ/);
  assert.match(K.mistakeHint({ type: 'complement', answer: 5 }, 0), /白い丸/);
  for (const type of K.ALL_TYPES) assert.equal(K.hints(K.generate(type)).length, 2);
});
