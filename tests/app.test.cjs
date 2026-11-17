const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const Kazu = require('../engine.js');
const Collection = require('../collection.js');
function harness() {
  const nodes = new Map();
  const node = key => { if (!nodes.has(key)) nodes.set(key, { innerHTML: '', textContent: '', hidden: false, value: '', setAttribute() {}, removeAttribute() {}, focus() {}, blur() {}, querySelector: node }); return nodes.get(key); };
  const context = vm.createContext({ Kazu, Collection, document: { querySelector: node }, localStorage: { getItem: () => null, setItem() {} } });
  vm.runInContext(fs.readFileSync(require.resolve('../app.js'), 'utf8').replace(/home\(\);\s*$/, ''), context);
  const run = code => vm.runInContext(code, context);
  run(`session = { level: 3, done: 0, mistakes: 0, mode: 'main', supportIndex: 0, question: Kazu.generate('subBridge', (() => { const v = [.4,.4,.7]; return () => v.shift(); })()) }; renderQuestion();`);
  return { node, run };
}
test('progressive hints reveal no diagram initially and reset for a new question', () => {
  const { node, run } = harness();
  node('#show-hint').onclick(); assert.doesNotMatch(node('#hint').innerHTML, /ten-frame/);
  node('#show-hint').onclick(); assert.match(node('#hint').innerHTML, /ten-frame/);
  node('#show-hint').onclick(); assert.match(node('#hint').innerHTML, /10 − 8 ＝ 2/);
  assert.equal(node('#show-hint').hidden, true);
  run('renderQuestion()'); node('#show-hint').onclick();
  assert.doesNotMatch(node('#hint').innerHTML, /ten-frame/);
});
test('subtraction diagrams remove eight dots only from the ten frame', () => {
  const { run } = harness();
  for (const type of ['subBridge', 'missingSub']) {
    const html = run(`visual({ ...session.question, type: '${type}' })`);
    const frames = [...html.matchAll(/class="ten-frame">(.*?)<\/div>/g)].map(m => m[1]);
    assert.equal((frames[0].match(/removed/g) || []).length, 8);
    assert.equal((frames[1].match(/removed/g) || []).length, 0);
    assert.equal((frames[1].match(/filled/g) || []).length, 4);
  }
});
test('22 is a subtraction mistake, not an input error; support flow remains available', () => {
  const { node, run } = harness();
  node('#answer').value = '22'; run('submit({preventDefault(){}})');
  assert.match(node('#feedback').innerHTML, /ひき算/);
  assert.equal(run('session.mistakes'), 1);
  node('#continue').onclick(); assert.equal(run('session.mode'), 'support');
});
