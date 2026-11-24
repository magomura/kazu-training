/* A single main question stays active while the child explores its prerequisite. */
'use strict';
const KEY = 'kazu-training:v1';
const app = document.querySelector('#app');
const warning = document.querySelector('#storage-warning');
let history = Kazu.createState();
let session = null;
let storageAvailable = true;
function storageNotice(message) { warning.textContent = message; warning.hidden = false; }
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    if (!Kazu.validState(parsed)) throw new Error('Invalid saved history');
    history = Kazu.migrate(parsed);
  }
} catch (_) {
  storageAvailable = false;
  storageNotice('記録を読みこめませんでした。今回は記録を保存せずに練習できます。');
}
function localDay() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function save() {
  if (!storageAvailable) return;
  try { localStorage.setItem(KEY, JSON.stringify(history)); }
  catch (_) { storageAvailable = false; storageNotice('このブラウザには記録を保存できません。練習はこのまま続けられます。'); }
}
// A reload must not turn an unfinished attempt into a perfect completed session.
if (history.collection.pendingLevel !== null) { Collection.abandon(history.collection); save(); }
function activeQuestion() { return session.mode === 'support' ? Kazu.supportSteps(session.question)[session.supportIndex] : session.question; }
function home() {
  session = null;
  const today = history.days[localDay()] || 0;
  app.innerHTML = `<p class="eyebrow">すこしずつ、わかるをふやそう</p><h1>今日は、どんな<br>発見があるかな。</h1><p class="lead">1回10問。じぶんのペースで。<br>迷ったら、図を見ながら考えよう。</p><section class="card"></section><div class="mission"><span>今日のミッション</span><strong>${Math.min(today, 10)} / 10問</strong></div><progress value="${Math.min(today, 10)}" max="10" aria-label="今日のミッション"></progress>${today >= 10 ? '<p class="note">今日の10問、できたね。</p>' : ''}<details></details>`;
  const card = app.querySelector('.card');
  card.innerHTML = `<span class="level">LEVEL 3 · 10を使いこなそう</span><h2>10の橋を わたろう</h2><p class="note">数を分けて、10をつくって。<br>□に入る数も、見つけてみよう。</p><div class="tags"><span>8＋7</span><span>14−8</span><span>8＋□＝13</span></div><button id="start-third" class="primary">LEVEL 3の10問 はじめる →</button><p class="note">迷ったら、小さなステップで確かめよう。</p><button id="start-next" class="secondary review-button">LEVEL 2 · 20までの基本</button><button id="start" class="secondary review-button">LEVEL 1 · 数となかよくなる</button>`;
  app.querySelector('details').innerHTML = `<summary>おうちの方へ・学習の記録</summary><p>LEVEL 2は復習2問と新しい問題8問。直近のLEVEL 2の10問で、初回正解が8問以上なら次の回に繰り上がり・繰り下がりを各1問入れます。下回ったら、次は基本の計算に戻ります。自分でLEVEL 1も選べます。</p><p>間違えたら一段階前の数の関係を確認し、元の問題に戻ります。補助問題は10問に数えません。紙に丸や式を書いても大丈夫です。</p><p>これまで ${history.total}問 ／ 最初の回答で正解 ${history.correct}問${history.total ? `（${Math.round(history.correct / history.total * 100)}%）` : ''}</p><p>${history.recent.length ? '最近の10問：' + history.recent.map(r => `LEVEL ${r.level} · ${r.correct}/10`).join(' ／ ') : '更新後に10問を終えると、最近の記録もここに表示します。'}</p><p>景色は累計10問ごとに増えます。途中でおわった分や、更新前の記録も含みます。流れ星は1回10問のうち初回正解8問以上で出現。正解率で景色を失うことはありません。</p><p>記録はこの端末・このブラウザに保存します。履歴の消去やプライベートブラウズでは残らない場合があります。時間制限・連続日数のペナルティはありません。</p>`;
  const journey = document.createElement('section'); journey.className = 'journey-card'; journey.innerHTML = Journey.home(history); card.after(journey);
  document.querySelector('#album').onclick = showAlbum;
  document.querySelector('#start').onclick = () => start(1);
  document.querySelector('#start-next').onclick = () => start(2);
  document.querySelector('#start-third').onclick = () => start(3);
  const parentInfo = app.querySelector('details');
  parentInfo.querySelector('p').textContent = 'LEVEL 3は20以内で10をまたぐ計算と、□に入る数を考える問題です。直近のLEVEL 3で初回正解5問以下なら、次回は復習を増やし、□の問題を一度お休みします。LEVEL 1・2はいつでも選べます。';
  parentInfo.insertAdjacentHTML('beforeend', `<p>新コレクションは30種類＋以前の景色6種類。更新後の10問完走回数で景色が増えます。珍しい発見は完走後12%の抽選（最初は各種類2%、重複なし）。抽選は1日3回まで、出会えなくても15回目の抽選で必ず1つ発見します。</p><p>連続全問正解は同じLEVELの10問完走を数えます。途中終了・再読み込み・誤答でそのLEVELの連続回数はリセットしますが、日を空けても消えません。過去の景色や記念品も失いません。</p><p>「雨上がりの虹」は初回正解5問以下でも解き直して完走した記念。正答率に関係なく解き直しを10問積み重ねても手に入ります。間違えることを目標にする必要はありません。</p>`);
}
function showAlbum() {
  session = null;
  app.innerHTML = Journey.album(history) + '<button id="home" class="primary">ホームへ</button>';
  document.querySelector('#home').onclick = home;
  app.querySelector('h1').focus({ preventScroll: true });
  app.querySelectorAll('[data-filter]').forEach(button => { button.onclick = () => {
    app.querySelectorAll('[data-filter]').forEach(b => b.setAttribute('aria-pressed', String(b === button)));
    app.querySelectorAll('[data-kind]').forEach(card => { card.hidden = button.dataset.filter !== 'all' && card.dataset.kind !== button.dataset.filter; });
  }; });
  app.querySelectorAll('[data-card]').forEach(button => { button.onclick = () => {
    app.innerHTML = Journey.detail(history, button.dataset.card) + '<button id="back-album" class="primary">コレクションへ</button>';
    document.querySelector('#back-album').onclick = showAlbum;
    app.querySelector('h1').focus({ preventScroll: true });
  }; });
}
function start(level = 1) {
  // Each session has a fixed coverage plan and a modest review preference.
  const coverage = Kazu.schedule(history, level);
  Collection.begin(history.collection, level); save();
  session = { level, startTotal: history.total, done: 0, correct: 0, recovered: 0, awards: [], coverage, question: null, mode: 'main', mistakes: 0, supportIndex: 0, supportAttempts: 0, resolved: false };
  nextQuestion();
}
function nextQuestion() {
  if (session.done === 10) { finish(); return; }
  const type = session.coverage.shift() || Kazu.chooseType(history.types);
  session.question = Kazu.generate(type);
  session.mode = 'main'; session.mistakes = 0; session.supportIndex = 0; session.supportAttempts = 0; session.resolved = false;
  renderQuestion();
}
function visual(q) {
  if (q.visual === 'line') {
    const active = q.type === 'compare' ? [q.a, q.b] : [];
    return `<div class="visual" role="img" aria-label="1から10の数の線。右へ1ずつ大きくなります。"><div class="number-line">${Array.from({ length: 10 }, (_, i) => `<span class="${active.includes(i + 1) ? 'active' : ''}">${i + 1}</span>`).join('')}</div><p class="visual-caption">小さい ←　数の線　→ 大きい</p></div>`;
  }
  const bridge = q.type === 'subBridge' || q.type === 'missingSub';
  const subtract = q.subtract || q.type === 'missingSub';
  const dots = Array.from({ length: q.total }, (_, i) => `<span class="dot ${subtract && (bridge || q.removeFromStart ? i < q.b : i >= q.total - q.b) ? 'removed' : subtract || (q.remainingAtEnd ? i >= q.total - q.a : i < q.a) ? 'filled' : q.compose ? 'other' : ''}"></span>`);
  const frames = Array.from({ length: Math.ceil(q.total / 10) }, (_, i) => `<div class="ten-frame">${dots.slice(i * 10, i * 10 + 10).join('')}</div>`).join('');
  return `<div class="visual" role="img" aria-label="${q.total}個の丸。${subtract ? `${q.b}個を線で消しています。` : `${q.a}個は緑色、残りは${q.compose ? 'オレンジ色' : '白'}です。`}">${frames}<p class="visual-caption">${subtract ? (bridge ? '10の枠ののこりと、となりの丸をあわせよう' : '線で消した丸を、とりのぞこう') : q.compose ? 'ふたつの色を、あわせてみよう' : '緑の丸と、白い丸'}${q.total >= 10 ? '<br>ひとつの枠に10個まで入るよ' : ''}</p></div>`;
}
// An unscored, tap-only introduction before the numerical support steps.
function renderMove() {
  const q = session.question;
  const moved = session.moved || 0, need = 10 - q.a, full = moved === need;
  app.innerHTML = `<div class="session-top"><p>数をうつしてみよう</p><button id="stop" class="text-button">ここでおわる</button></div><section class="card question-card"><h1 tabindex="-1">${full ? '10に なった！' : 'オレンジを 1こずつ、白いところへ うつそう'}</h1><div class="visual"><div class="ten-frame">${Array.from({length:10}, (_,i) => `<span class="dot ${i < q.a ? 'filled' : i < q.a + moved ? 'other' : ''}"></span>`).join('')}</div><div class="move-source">${Array.from({length:q.b - moved}, (_,i) => `<button class="move-dot" aria-label="オレンジの丸を1こ うつす" ${full ? 'disabled' : ''}><span class="dot other" aria-hidden="true"></span></button>`).join('')}</div></div><p id="move-status" class="note" role="status">${full ? `${moved}こ うつしたら、10になったね。のこりを たしかめよう。` : 'オレンジの丸をタップしてね。'}</p>${full ? '<button id="move-next" class="primary">のこりは いくつ？</button>' : ''}</section>`;
  document.querySelector('#stop').onclick = () => finish(true);
  app.querySelectorAll('.move-dot').forEach(button => { button.onclick = () => {
    // Ignore stale/rapid taps after the frame has filled.
    if (session.mode !== 'move' || session.moved >= need) return;
    session.moved++; renderMove();
  }; });
  if (full) document.querySelector('#move-next').onclick = () => {
    session.mode = 'support'; session.supportIndex = 1; session.supportAttempts = 0; renderQuestion();
  };
}
function beginSupport() {
  if (session.question.type === 'addBridge') {
    session.mode = 'move'; session.moved = 0; renderMove();
  } else { session.mode = 'support'; renderQuestion(); }
}
function renderQuestion() {
  const q = activeQuestion();
  app.innerHTML = `<div class="session-top"><p>${session.mode === 'support' ? '数をたしかめよう' : `LEVEL 1 · ${session.done + 1} / 10問`}</p><button id="stop" class="text-button">ここでおわる</button></div><progress value="${session.done}" max="10" aria-label="今回の進みぐあい"></progress><section class="card question-card"><p class="eyebrow">${session.mode === 'support' ? 'ちいさなステップ' : '数となかよくなる'}</p><h1 tabindex="-1">${q.prompt}</h1>${q.expression ? `<p class="expression">${q.expression}</p>` : ''}<div id="hint">${session.mode === 'support' || q.alwaysVisual ? `${visual(q)}<p class="note">${q.hint}</p>` : ''}</div><form id="answer-form" novalidate><label class="input-label" for="answer">答えを数字で入れよう</label><input id="answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" enterkeyhint="done" aria-describedby="input-error"><p id="input-error" class="input-error" role="alert" hidden></p><button class="primary" type="submit">答える</button></form><button id="show-hint" class="text-button" ${session.mode === 'support' ? 'hidden' : ''}>ヒントを見る</button><div id="feedback" aria-live="polite" aria-atomic="true"></div></section>`;
  document.querySelector('#answer-form').onsubmit = submit;
  app.querySelector('.session-top p').textContent = session.mode === 'support' ? '数をたしかめよう' : `LEVEL ${session.level} · ${session.done + 1} / 10問`;
  app.querySelector('.question-card .eyebrow').textContent = session.mode === 'support' ? `ちいさなステップ ${session.supportIndex + 1} / ${Kazu.supportSteps(session.question).length}` : Kazu.LABELS[q.type];
  document.querySelector('#stop').onclick = () => finish(true);
  let hintStage = 0;
  const [cue, intermediate] = Kazu.hints(q);
  document.querySelector('#hint').setAttribute('aria-live', 'polite');
  document.querySelector('#show-hint').onclick = () => {
    hintStage++;
    document.querySelector('#hint').innerHTML = `<p class="note">${cue}</p>` + (hintStage >= 2 || q.alwaysVisual ? visual(q) : '') + (hintStage >= 3 ? `<p class="note">${intermediate}</p>` : '');
    document.querySelector('#show-hint').textContent = hintStage === 1 ? '図を見る' : '途中の式を見る';
    document.querySelector('#show-hint').hidden = hintStage >= 3;
  };
  // Heading focus gives screen readers context without opening the iPhone keyboard.
  app.querySelector('h1').focus({ preventScroll: true });
}
function feedback(title, text, label, action, showDiagram = false) {
  const q = activeQuestion();
  document.querySelector('#answer').blur();
  document.querySelector('#answer-form').hidden = true;
  document.querySelector('#show-hint').hidden = true;
  if (showDiagram) document.querySelector('#hint').innerHTML = visual(q);
  const box = document.querySelector('#feedback');
  box.innerHTML = `<div class="feedback"><strong>${title}</strong><p>${text}</p><button class="secondary" id="continue">${label}</button></div>`;
  document.querySelector('#continue').onclick = action;
}
function resolve() {
  if (session.resolved) return;
  session.resolved = true;
  Kazu.record(history, session.question, session.mistakes, localDay());
  session.done++;
  if (!session.mistakes) session.correct++;
  if (session.done === 10) session.awards = Kazu.completeSession(history, session.level, session.correct, session.recovered, localDay());
  save();
}
function submit(event) {
  event.preventDefault();
  if (document.querySelector('#answer-form').hidden) return;
  const input = document.querySelector('#answer');
  const raw = input.value.trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  if (!/^\d{1,2}$/.test(raw) || Number(raw) > 99) {
    const error = document.querySelector('#input-error'); error.textContent = '0〜99の数字を入れてね。'; error.hidden = false; input.setAttribute('aria-invalid', 'true'); return;
  }
  input.removeAttribute('aria-invalid'); document.querySelector('#input-error').hidden = true;
  const q = session.question, active = activeQuestion(), correct = Number(raw) === active.answer;
  if (session.mode === 'support') {
    session.supportAttempts++;
    if (!correct && session.supportAttempts < 2) {
      feedback('ひとつずつ、たしかめよう', active.hint, 'もう一度 考える', () => renderQuestion());
    } else {
      const more = session.supportIndex + 1 < Kazu.supportSteps(q).length;
      feedback(correct ? 'そう、その数だね！' : `いっしょに考えると ${active.answer}だね`, active.explanation, more ? '次のステップ' : 'もとの問題へ', () => {
        if (more) { session.supportIndex++; session.supportAttempts = 0; }
        else session.mode = 'return';
        renderQuestion();
      });
    }
    return;
  }
  if (correct) {
    if (session.mode === 'return') session.recovered++;
    resolve();
    feedback('○ せいかい！', q.explanation, session.done === 10 ? '今日のふりかえり' : '次の問題', nextQuestion, true);
  } else {
    session.mistakes++;
    history.collection.streaks[session.level] = 0; save();
    if (session.mode === 'main') {
      feedback(Kazu.mistakeHint(q, Number(raw)), '小さなステップで、数をたしかめよう。', '数をたしかめる', beginSupport, true);
    } else {
      resolve();
      feedback(`答えは ${q.answer}。図でたしかめよう`, q.explanation, session.done === 10 ? '今日のふりかえり' : '次の問題', nextQuestion, true);
    }
  }
}
function finish(early = false) {
  const done = session.done, correct = session.correct;
  if (done < 10) { Collection.abandon(history.collection); save(); }
  app.innerHTML = `<section class="card summary"><p class="eyebrow">${early ? 'ひとやすみ' : 'TODAY’S MISSION'}</p><div class="celebration" aria-hidden="true">${early ? '☕' : '☆'}</div><h1>${early ? 'ここまで、おつかれさま。' : '10問、取り組めたね！'}</h1><p>${done ? `${done}問の数をたしかめたよ。<br>最初の答えで正解：${correct}問<br>考えなおした時間も、たいせつ。` : 'また、やりたいときに始めよう。'}</p><button id="home" class="primary">ホームへ</button><p class="note">紙に今日の数を書いてみるのもいいね。</p></section>`;
  document.querySelector('#home').onclick = home;
  if (done) {
    const reward = document.createElement('div'); reward.className = 'reward';
    reward.innerHTML = Journey.reward(history, session.startTotal, done === 10 && correct >= 8, done === 10 ? session.awards : []);
    document.querySelector('#home').before(reward);
  }
}
home();
