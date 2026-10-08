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
function home() {
  session = null;
  const today = history.days[localDay()] || 0;
  app.innerHTML = `<p class="eyebrow">すこしずつ、わかるをふやそう</p><h1>今日は、どんな<br>発見があるかな。</h1><p class="lead">1回10問。じぶんのペースで。<br>迷ったら、図を見ながら考えよう。</p><section class="card"></section><div class="mission"><span>今日のミッション</span><strong>${Math.min(today, 10)} / 10問</strong></div><progress value="${Math.min(today, 10)}" max="10" aria-label="今日のミッション"></progress>${today >= 10 ? '<p class="note">今日の10問、できたね。</p>' : ''}<details></details>`;
  const card = app.querySelector('.card');
  card.innerHTML = `<span class="level">LEVEL 2 · あたらしい一歩</span><h2>20までの数に であおう</h2><p class="note">10のまとまりを使って、<br>足し算・引き算にチャレンジ。</p><div class="tags"><span>10といくつ</span><span>足し算</span><span>引き算</span></div><button id="start-next" class="primary">20までの10問 はじめる →</button><p class="note">${Kazu.bridgeReady(history) ? '今回は、10をまたぐ計算も2問ためしてみよう。' : 'まずは10といくつ、やさしい計算から。'}</p><button id="start" class="secondary review-button">LEVEL 1で おさらいする</button>`;
  app.querySelector('details').innerHTML = `<summary>おうちの方へ・学習の記録</summary><p>LEVEL 2は復習2問と新しい問題8問。直近のLEVEL 2の10問で、初回正解が8問以上なら次の回に繰り上がり・繰り下がりを各1問入れます。下回ったら、次は基本の計算に戻ります。自分でLEVEL 1も選べます。</p><p>間違えたら一段階前の数の関係を確認し、元の問題に戻ります。補助問題は10問に数えません。紙に丸や式を書いても大丈夫です。</p><p>これまで ${history.total}問 ／ 最初の回答で正解 ${history.correct}問${history.total ? `（${Math.round(history.correct / history.total * 100)}%）` : ''}</p><p>${history.recent.length ? '最近の10問：' + history.recent.map(r => `LEVEL ${r.level} · ${r.correct}/10`).join(' ／ ') : '更新後に10問を終えると、最近の記録もここに表示します。'}</p><p>景色は累計10問ごとに増えます。途中でおわった分や、更新前の記録も含みます。流れ星は1回10問のうち初回正解8問以上で出現。正解率で景色を失うことはありません。</p><p>記録はこの端末・このブラウザに保存します。履歴の消去やプライベートブラウズでは残らない場合があります。時間制限・連続日数のペナルティはありません。</p>`;
  const journey = document.createElement('section'); journey.className = 'journey-card'; journey.innerHTML = Journey.home(history); card.after(journey);
  document.querySelector('#album').onclick = showAlbum;
  document.querySelector('#start').onclick = () => start(1);
  document.querySelector('#start-next').onclick = () => start(2);
}
function showAlbum() {
  session = null;
  app.innerHTML = Journey.album(history) + '<button id="home" class="primary">ホームへ</button>';
  document.querySelector('#home').onclick = home;
  app.querySelector('h1').focus({ preventScroll: true });
}
function start(level = 1) {
  // Each session has a fixed coverage plan and a modest review preference.
  const coverage = Kazu.schedule(history, level);
  session = { level, startTotal: history.total, done: 0, correct: 0, coverage, question: null, mode: 'main', mistakes: 0, supportAttempts: 0, resolved: false };
  nextQuestion();
}
function nextQuestion() {
  if (session.done === 10) { finish(); return; }
  const type = session.coverage.shift() || Kazu.chooseType(history.types);
  session.question = Kazu.generate(type);
  session.mode = 'main'; session.mistakes = 0; session.supportAttempts = 0; session.resolved = false;
  renderQuestion();
}
function visual(q) {
  if (q.visual === 'line') {
    const active = q.type === 'compare' ? [q.a, q.b] : [];
    return `<div class="visual" role="img" aria-label="1から10の数の線。右へ1ずつ大きくなります。"><div class="number-line">${Array.from({ length: 10 }, (_, i) => `<span class="${active.includes(i + 1) ? 'active' : ''}">${i + 1}</span>`).join('')}</div><p class="visual-caption">小さい ←　数の線　→ 大きい</p></div>`;
  }
  const dots = Array.from({ length: q.total }, (_, i) => `<span class="dot ${q.subtract && i >= q.total - q.b ? 'removed' : i < q.a ? 'filled' : q.compose ? 'other' : ''}"></span>`);
  const frames = Array.from({ length: Math.ceil(q.total / 10) }, (_, i) => `<div class="ten-frame">${dots.slice(i * 10, i * 10 + 10).join('')}</div>`).join('');
  return `<div class="visual" role="img" aria-label="${q.total}個の丸。${q.subtract ? `${q.b}個を線で消しています。` : `${q.a}個は緑色、残りは${q.compose ? 'オレンジ色' : '白'}です。`}">${frames}<p class="visual-caption">${q.subtract ? '線で消した丸を、とりのぞこう' : q.compose ? 'ふたつの色を、あわせてみよう' : '緑の丸と、白い丸'}${q.total >= 10 ? '<br>ひとつの枠に10個まで入るよ' : ''}</p></div>`;
}
function renderQuestion() {
  const q = session.mode === 'support' ? Kazu.support(session.question) : session.question;
  app.innerHTML = `<div class="session-top"><p>${session.mode === 'support' ? '数をたしかめよう' : `LEVEL 1 · ${session.done + 1} / 10問`}</p><button id="stop" class="text-button">ここでおわる</button></div><progress value="${session.done}" max="10" aria-label="今回の進みぐあい"></progress><section class="card question-card"><p class="eyebrow">${session.mode === 'support' ? 'ちいさなステップ' : '数となかよくなる'}</p><h1 tabindex="-1">${q.prompt}</h1>${q.expression ? `<p class="expression">${q.expression}</p>` : ''}<div id="hint">${session.mode === 'support' ? `${visual(q)}<p class="note">${q.hint}</p>` : ''}</div><form id="answer-form" novalidate><label class="input-label" for="answer">答えを数字で入れよう</label><input id="answer" name="answer" type="text" inputmode="numeric" pattern="[0-9]*" maxlength="2" autocomplete="off" enterkeyhint="done" aria-describedby="input-error"><p id="input-error" class="input-error" role="alert" hidden></p><button class="primary" type="submit">答える</button></form><button id="show-hint" class="text-button" ${session.mode === 'support' ? 'hidden' : ''}>ヒントを見る</button><div id="feedback" aria-live="polite" aria-atomic="true"></div></section>`;
  document.querySelector('#answer-form').onsubmit = submit;
  app.querySelector('.session-top p').textContent = session.mode === 'support' ? '数をたしかめよう' : `LEVEL ${session.level} · ${session.done + 1} / 10問`;
  app.querySelector('.question-card .eyebrow').textContent = session.mode === 'support' ? 'ちいさなステップ' : Kazu.LABELS[q.type];
  document.querySelector('#stop').onclick = () => finish(true);
  document.querySelector('#show-hint').onclick = () => {
    document.querySelector('#hint').innerHTML = visual(q) + `<p class="note">${q.hint}</p>`;
    document.querySelector('#show-hint').hidden = true;
  };
  // Heading focus gives screen readers context without opening the iPhone keyboard.
  app.querySelector('h1').focus({ preventScroll: true });
}
function feedback(title, text, label, action, showDiagram = false) {
  const q = session.mode === 'support' ? Kazu.support(session.question) : session.question;
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
  if (session.done === 10) Kazu.completeSession(history, session.level, session.correct);
  save();
}
function submit(event) {
  event.preventDefault();
  if (document.querySelector('#answer-form').hidden) return;
  const input = document.querySelector('#answer');
  const raw = input.value.trim().replace(/[０-９]/g, c => String.fromCharCode(c.charCodeAt(0) - 0xfee0));
  const maxAnswer = session.level === 2 ? 20 : 10;
  if (!/^\d{1,2}$/.test(raw) || Number(raw) > maxAnswer) {
    const error = document.querySelector('#input-error'); error.textContent = `0〜${maxAnswer}の数字を入れてね。`; error.hidden = false; input.setAttribute('aria-invalid', 'true'); return;
  }
  input.removeAttribute('aria-invalid'); document.querySelector('#input-error').hidden = true;
  const q = session.question, active = session.mode === 'support' ? Kazu.support(q) : q, correct = Number(raw) === active.answer;
  if (session.mode === 'support') {
    session.supportAttempts++;
    if (!correct && session.supportAttempts < 2) {
      feedback('ひとつずつ、たしかめよう', Kazu.support(q).hint, 'もう一度 数える', () => renderQuestion());
    } else {
      feedback(correct ? 'そう、その数だね！' : `いっしょに考えると ${active.answer}だね`, active.explanation, 'もとの問題へ', () => { session.mode = 'return'; renderQuestion(); });
    }
    return;
  }
  if (correct) {
    resolve();
    feedback('○ せいかい！', q.explanation, session.done === 10 ? '今日のふりかえり' : '次の問題', nextQuestion, true);
  } else {
    session.mistakes++;
    if (session.mode === 'main') {
      feedback('もう一度、考えてみよう', '小さなステップで、数をたしかめよう。', '数をたしかめる', () => { session.mode = 'support'; renderQuestion(); }, true);
    } else {
      resolve();
      feedback(`答えは ${q.answer}。図でたしかめよう`, q.explanation, session.done === 10 ? '今日のふりかえり' : '次の問題', nextQuestion, true);
    }
  }
}
function finish(early = false) {
  const done = session.done, correct = session.correct;
  app.innerHTML = `<section class="card summary"><p class="eyebrow">${early ? 'ひとやすみ' : 'TODAY’S MISSION'}</p><div class="celebration" aria-hidden="true">${early ? '☕' : '☆'}</div><h1>${early ? 'ここまで、おつかれさま。' : '10問、取り組めたね！'}</h1><p>${done ? `${done}問の数をたしかめたよ。<br>最初の答えで正解：${correct}問<br>考えなおした時間も、たいせつ。` : 'また、やりたいときに始めよう。'}</p><button id="home" class="primary">ホームへ</button><p class="note">紙に今日の数を書いてみるのもいいね。</p></section>`;
  document.querySelector('#home').onclick = home;
  if (done) {
    const reward = document.createElement('div'); reward.className = 'reward';
    reward.innerHTML = Journey.reward(history, session.startTotal, !early && correct >= 8);
    document.querySelector('#home').before(reward);
  }
}
home();
