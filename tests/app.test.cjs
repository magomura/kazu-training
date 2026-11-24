const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const Kazu = require('../engine.js');
const Collection = require('../collection.js');
function harness() {
  const nodes = new Map();
  const node = key => { if (!nodes.has(key)) nodes.set(key, { innerHTML: '', textContent: '', hidden: false, value: '', setAttribute() {}, removeAttribute() {}, focus() {}, blur() {}, querySelector: node, querySelectorAll: () => Array.from({length:(nodes.get('#app').innerHTML.match(/class="move-dot"/g)||[]).length}, (_,i) => node('move'+i)) }); return nodes.get(key); };
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

test('F-1 keeps the same remaining positions in main and support ten frames', () => {
  const { run } = harness();
  const classes = html => [...html.matchAll(/class="dot ([^"]*)"/g)].map(m => m[1]);
  for (let a = 11; a <= 18; a++) for (let b = a - 9; b <= 9; b++) {
    run(`session.question = { ...session.question, a: ${a}, b: ${b}, total: ${a}, answer: ${a-b} };`);
    const main = classes(run('visual(session.question)')).slice(0, 10);
    const support = classes(run('visual(Kazu.supportSteps(session.question)[1])'));
    assert.deepEqual(support, main);
    const blank = classes(run(`visual(Kazu.supportSteps({ ...session.question, type: 'missingSub', result: ${a-b}, answer: ${b} })[2])`));
    assert.deepEqual(blank.map(c => c === 'filled'), main.map(c => c === 'filled'));
    assert.equal(blank.filter(c => c === '').length, b);
  }
});

test('I-2 taps conserve dots, never score, and stop when ten is full', () => {
  const {node,run} = harness();
  run("session.question={...Kazu.generate('addBridge'),a:8,b:5,answer:13,total:13}; beginSupport();");
  const before = run('JSON.stringify(history)');
  node('move0').onclick(); assert.equal(run('session.moved'),1);
  node('move0').onclick(); node('move0').onclick();
  assert.equal(run('session.moved'),2);
  assert.equal(run('JSON.stringify(history)'),before);
  assert.match(node('#app').innerHTML,/10に なった/);
  node('#move-next').onclick();
  assert.equal(run('session.mode'),'support');
  assert.equal(run('activeQuestion().answer'),3);
});

test('J-1 and J-2 keep the completed diagram and show the original sum during transfer', () => {
  const { node, run } = harness();
  run("session.question = {...Kazu.generate('addBridge'), a:5, b:9, answer:14, total:14}; beginSupport();");
  assert.match(node('#app').innerHTML, /ちいさなステップ 1 \/ 3/);
  assert.match(node('#app').innerHTML, /5 ＋ 9/);
  for (let i = 0; i < 5; i++) node('move0').onclick();
  const completeDiagram = run('moveDiagram(session.question, session.moved)');
  assert.ok(node('#app').innerHTML.includes(completeDiagram));
  node('#move-next').onclick();
  assert.ok(node('#app').innerHTML.includes(completeDiagram));
  assert.match(node('#app').innerHTML, /のこりは いくつ？/);
  assert.equal(run('activeQuestion().answer'), 4);
  assert.equal(run('Kazu.supportSteps(session.question)[2].expression'), '10 ＋ 4 ＝ □');
});

test('J-3 and J-4 show the frame before either hint and skip the diagram hint stage', () => {
  const { node, run } = harness();
  for (const green of [true, false]) {
    run(`session.question = Kazu.generate('frameSee', (() => { const values = [.6, ${green ? 0 : .9}]; return () => values.shift(); })()); renderQuestion();`);
    assert.match(node('#app').innerHTML, /id="hint"><div class="visual"/);
    assert.ok(!node('#app').innerHTML.includes(run('session.question.hint')));
    node('#show-hint').onclick();
    assert.match(node('#hint').innerHTML, /ten-frame/);
    assert.ok(node('#hint').innerHTML.includes(run('session.question.hint')));
    assert.equal(node('#show-hint').textContent, '考え方を見る');
    assert.equal(node('#show-hint').hidden, false);
    node('#show-hint').onclick();
    assert.ok(node('#hint').innerHTML.includes(run('Kazu.hints(session.question)[1]')));
    assert.equal(node('#show-hint').hidden, true);
  }
  assert.match(run('session.question.hint'), /下の段の白/);
  assert.match(run('Kazu.support(session.question).hint'), /ゆっくり数えて/);
});
