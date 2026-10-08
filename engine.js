/* Pure learning logic: no DOM, network, or storage dependency. */
(function (root) {
  'use strict';
  const TYPES = ['compare', 'order', 'complement', 'split10', 'parts'];
  const NEXT_TYPES = ['tens', 'add20', 'sub20', 'addBridge', 'subBridge'];
  const ALL_TYPES = [...TYPES, ...NEXT_TYPES];
  const LABELS = { compare: '数の大小', order: '数の順番', complement: 'あといくつで10', split10: '10の分け方', parts: '数の分解と合成', tens: '10といくつ', add20: '20までの足し算', sub20: '20までの引き算', addBridge: '10をこえる足し算', subBridge: '10をまたぐ引き算' };
  const integer = (min, max, rng = Math.random) => min + Math.floor(rng() * (max - min + 1));
  function generate(type, rng = Math.random) {
    if (NEXT_TYPES.includes(type)) return generateNext(type, rng);
    const a = integer(1, 9, rng);
    if (type === 'compare') {
      let b = integer(1, 9, rng); if (b >= a) b++;
      const bigger = rng() < .5;
      const answer = bigger ? Math.max(a, b) : Math.min(a, b);
      return { type, a, b, bigger, answer, prompt: `${bigger ? '大きい' : '小さい'}数は どっち？`, expression: `${a}　と　${b}`, explanation: `${Math.min(a, b)}より ${Math.max(a, b)}のほうが大きいね。`, hint: '数の線で、右にあるほど大きいよ。', visual: 'line' };
    }
    if (type === 'order') {
      const start = integer(1, 8, rng), blank = integer(0, 2, rng);
      const values = [start, start + 1, start + 2];
      return { type, a: start, blank, answer: values[blank], prompt: '□に入る数は？', expression: values.map((v, i) => i === blank ? '□' : v).join(' → '), explanation: `${values.join('、')}。右へ1ずつふえるよ。`, hint: '数の線で、ひとつずつたどろう。', visual: 'line' };
    }
    if (type === 'complement' || type === 'split10') {
      return { type, a, total: 10, answer: 10 - a, prompt: type === 'complement' ? '10になるには あといくつ？' : '10は いくつと いくつ？', expression: type === 'complement' ? `${a} ＋ □ ＝ 10` : `10 ＝ ${a} ＋ □`, explanation: `${a}と${10 - a}で10。あわせると10になるね。`, hint: '色のついていない丸を数えてみよう。', visual: 'frame' };
    }
    if (type === 'parts') {
      const total = integer(2, 10, rng), part = integer(1, total - 1, rng), compose = rng() < .5;
      return { type, a: part, b: total - part, total, compose, answer: compose ? total : total - part, prompt: compose ? 'あわせると いくつ？' : `${total}を ふたつに分けよう`, expression: compose ? `${part} ＋ ${total - part} ＝ □` : `${total} ＝ ${part} ＋ □`, explanation: `${total}は ${part}と${total - part}に分けられるね。`, hint: compose ? 'ふたつの色の丸を、あわせて数えよう。' : '色のついていない丸を数えてみよう。', visual: 'frame' };
    }
    throw new Error('Unknown question type');
  }
  function support(q) {
    if (NEXT_TYPES.includes(q.type)) return q.prerequisite;
    if (q.type === 'compare') return { ...q, support: true, prompt: `${q.bigger ? '右' : '左'}にある数は どっち？`, hint: '数の線の位置を見てみよう。' };
    if (q.type === 'order') return { ...q, support: true, prompt: q.blank === 0 ? `${q.a + 1}の ひとつ前は？` : `${q.answer - 1}の ひとつ次は？`, expression: q.blank === 0 ? `□ ← ${q.a + 1}` : `${q.answer - 1} → □` };
    return { ...q, support: true, prompt: q.compose ? '丸は ぜんぶで いくつ？' : '色のついていない丸は いくつ？', expression: '', hint: 'ひとつずつ、ゆっくり数えてみよう。' };
  }
  function chooseType(stats, rng = Math.random, available = TYPES) {
    const review = available.filter(t => (stats[t]?.misses || 0) > 0);
    const pool = review.length && rng() < .3 ? review : available;
    return pool[integer(0, pool.length - 1, rng)];
  }
  function createState() { return { version: 2, total: 0, correct: 0, lastStudyDate: null, days: {}, types: Object.fromEntries(ALL_TYPES.map(t => [t, { total: 0, correct: 0, misses: 0 }])), recent: [], bright: 0 }; }
  const count = n => Number.isSafeInteger(n) && n >= 0;
  function validState(s) {
    const base = [1, 2].includes(s?.version) && count(s.total) && count(s.correct) && s.correct <= s.total && (s.lastStudyDate === null || /^\d{4}-\d{2}-\d{2}$/.test(s.lastStudyDate)) && s.days && typeof s.days === 'object' && !Array.isArray(s.days) && Object.entries(s.days).every(([d, n]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && count(n)) && (s.version === 1 ? TYPES : ALL_TYPES).every(t => s.types?.[t] && ['total', 'correct', 'misses'].every(k => count(s.types[t][k])) && s.types[t].correct <= s.types[t].total);
    return Boolean(base && (s.version === 1 || (count(s.bright) && Array.isArray(s.recent) && s.recent.length <= 5 && s.recent.every(r => [1, 2].includes(r.level) && count(r.correct) && r.correct <= 10))));
  }
  function migrate(s) {
    if (!validState(s)) throw new Error('Invalid saved history');
    const next = JSON.parse(JSON.stringify(s));
    if (next.version === 1) {
      next.version = 2; next.recent = []; next.bright = 0;
      NEXT_TYPES.forEach(t => { next.types[t] = { total: 0, correct: 0, misses: 0 }; });
    }
    return next;
  }
  function bridgeReady(state) {
    const last = state.recent.filter(r => r.level === 2).at(-1);
    return Boolean(last && last.correct >= 8);
  }
  function completeSession(state, level, correct) {
    state.recent = [...state.recent, { level, correct }].slice(-5);
    if (correct >= 8) state.bright++;
  }
  function schedule(state, level, rng = Math.random) {
    const shuffle = values => {
      for (let i = values.length - 1; i > 0; i--) { const j = integer(0, i, rng); [values[i], values[j]] = [values[j], values[i]]; }
      return values;
    };
    if (level === 1) return [...shuffle([...TYPES]), ...Array.from({ length: 5 }, () => chooseType(state.types, rng))];
    const basic = ['tens', 'add20', 'sub20'];
    return [...shuffle(['complement', 'parts']), ...shuffle([...basic]), ...Array.from({ length: 3 }, () => chooseType(state.types, rng, basic)), ...(bridgeReady(state) ? shuffle(['addBridge', 'subBridge']) : Array.from({ length: 2 }, () => chooseType(state.types, rng, basic)))];
  }
  function generateNext(type, rng) {
    const ones = integer(1, 9, rng);
    let a, b, answer, explanation, prerequisite;
    const partQuestion = (total, part) => ({ type: 'parts', support: true, a: part, total, answer: total - part, prompt: `${total}は ${part}と いくつ？`, expression: `${total} ＝ ${part} ＋ □`, explanation: `${part}と${total - part}で${total}になるね。`, hint: '白い丸を数えて、数の分け方をたしかめよう。', visual: 'frame' });
    if (type === 'tens') {
      return { type, a: 10, total: 10 + ones, answer: ones, prompt: '10と いくつに分けられる？', expression: `${10 + ones} ＝ 10 ＋ □`, explanation: `${10 + ones}は、10のまとまりと ${ones}。`, hint: '10のまとまりの、下にある白い丸を数えよう。', visual: 'frame', prerequisite: partQuestion(ones + 1, 1) };
    }
    if (type === 'add20') {
      a = 10 + integer(0, 8, rng); b = integer(1, a === 10 ? 10 : 19 - a, rng); answer = a + b;
      prerequisite = { type: 'parts', support: true, compose: true, a: a - 10, b, total: a - 10 + b, answer: a - 10 + b, prompt: 'まず、10のほかの数を あわせよう', expression: `${a - 10} ＋ ${b} ＝ □`, explanation: `${a - 10}と${b}で${a - 10 + b}。これに10をあわせよう。`, hint: 'ふたつの色の丸を、あわせて数えよう。', visual: 'frame' };
      explanation = `${a}は10と${a - 10}。${a - 10}＋${b}＝${answer - 10}だから、10と${answer - 10}で${answer}。`;
    } else if (type === 'sub20') {
      a = 10 + ones; b = integer(1, ones, rng); answer = a - b;
      prerequisite = partQuestion(ones, b);
      explanation = `${a}は10と${ones}。${ones}から${b}をとると${ones - b}。10と${ones - b}で${answer}。`;
    } else if (type === 'addBridge') {
      a = integer(2, 9, rng); b = integer(11 - a, 9, rng); answer = a + b;
      prerequisite = { ...partQuestion(10, a), prompt: `${a}に あといくつで10？`, expression: `${a} ＋ □ ＝ 10` };
      explanation = `${b}を${10 - a}と${answer - 10}に分けるよ。${a}＋${10 - a}＝10。のこり${answer - 10}を足して${answer}。`;
    } else {
      a = 10 + integer(1, 8, rng); b = integer(a - 9, 9, rng); answer = a - b;
      prerequisite = partQuestion(a, 10);
      explanation = `${b}を${a - 10}と${b - (a - 10)}に分けるよ。${a}から${a - 10}をひいて10。あと${b - (a - 10)}をひくと${answer}。`;
    }
    const subtract = type.startsWith('sub');
    return { type, a, b, answer, total: subtract ? a : answer, compose: !subtract, subtract, prompt: subtract ? 'のこりは いくつ？' : 'あわせると いくつ？', expression: `${a} ${subtract ? '−' : '＋'} ${b} ＝ □`, explanation, hint: subtract ? '線で消した丸をのぞいて、のこりを数えよう。10のまとまりにも注目。' : '10のまとまりを見つけて、のこりとあわせよう。', visual: 'frame', prerequisite };
  }
  function record(state, q, mistakes, date) {
    state.total++; state.correct += mistakes === 0 ? 1 : 0;
    const type = state.types[q.type]; type.total++; type.correct += mistakes === 0 ? 1 : 0; type.misses += mistakes;
    state.days[date] = (state.days[date] || 0) + 1; state.lastStudyDate = date;
  }
  const api = { TYPES, NEXT_TYPES, ALL_TYPES, LABELS, generate, support, chooseType, createState, validState, migrate, record, schedule, bridgeReady, completeSession };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Kazu = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
