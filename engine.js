/* Pure learning logic: no DOM, network, or storage dependency. */
(function (root) {
  'use strict';
  const Collection = typeof module !== 'undefined' && module.exports ? require('./collection.js') : root.Collection;
  const TYPES = ['compare', 'order', 'complement', 'split10', 'parts'];
  const NEXT_TYPES = ['tens', 'add20', 'sub20', 'addBridge', 'subBridge'];
  const THIRD_TYPES = ['missingAdd', 'missingSub'];
  const OLD_TYPES = [...TYPES, ...NEXT_TYPES];
  const ALL_TYPES = [...OLD_TYPES, ...THIRD_TYPES];
  const LABELS = { compare: '数の大小', order: '数の順番', complement: 'あといくつで10', split10: '10の分け方', parts: '数の分解と合成', tens: '10といくつ', add20: '20までの足し算', sub20: '20までの引き算', addBridge: '10をこえる足し算', subBridge: '10をまたぐ引き算' };
  const integer = (min, max, rng = Math.random) => min + Math.floor(rng() * (max - min + 1));
  LABELS.missingAdd = '足す数を見つけよう'; LABELS.missingSub = 'ひく数を見つけよう';
  function generate(type, rng = Math.random) {
    if (THIRD_TYPES.includes(type)) {
      const base = generateNext(type === 'missingAdd' ? 'addBridge' : 'subBridge', rng);
      return { ...base, type, answer: base.b, result: base.answer, compose: false, subtract: false,
        prompt: type === 'missingAdd' ? 'いくつ足すと この数になる？' : 'いくつひくと この数になる？',
        expression: `${base.a} ${type === 'missingAdd' ? '＋' : '−'} □ ＝ ${base.answer}`,
        a: type === 'missingAdd' ? base.a : base.answer,
        hint: type === 'missingSub' ? '10のまとまりからひいて、のこりとあわせよう。' : '緑の丸と白い丸で全体になるよ。白い丸の数を考えよう。',
        explanation: type === 'missingAdd' ? `${base.a}に${10 - base.a}を足すと10。あと${base.answer - 10}で${base.answer}。足した数は${base.b}。` : `${base.a}を10と${base.a - 10}に分けるよ。10から${base.b}をひくと${10 - base.b}。${10 - base.b}と${base.a - 10}で${base.answer}。ひいた数は${base.b}。`,
        prerequisite: part(10, type === 'missingAdd' ? base.a : base.answer) };
    }
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
  function part(total, a) { return { type: 'parts', support: true, total, a, answer: total - a, prompt: `${total}は ${a}と いくつ？`, expression: `${total} ＝ ${a} ＋ □`, visual: 'frame', hint: '白い丸を数えてみよう。', explanation: `${a}と${total - a}で${total}になるね。` }; }
  function supportSteps(q) {
    if (q.type === 'addBridge') {
      const need = 10 - q.a, rest = q.b - need;
      return [q.prerequisite, part(q.b, need), { ...part(10 + rest, 10), compose: true, answer: 10 + rest, prompt: '10と のこりを あわせると？', expression: `10 ＋ ${rest} ＝ □`, hint: '10のまとまりと、のこりの丸をあわせよう。', explanation: `10と${rest}で${10 + rest}だね。` }];
    }
    if (q.type === 'subBridge') {
      const ones = q.a - 10, left = 10 - q.b;
      return [q.prerequisite,
        { ...part(10, q.b), subtract: true, b: q.b, a: 10, prompt: '10から ひこう', expression: `10 − ${q.b} ＝ □`, hint: '10の枠から、線で消した丸をのぞこう。', explanation: `10から${q.b}をひくと${left}だね。` },
        { ...part(q.answer, left), compose: true, b: ones, answer: q.answer, prompt: 'のこった数と あわせよう', expression: `${left} ＋ ${ones} ＝ □`, hint: '10からのこった丸と、分けておいた丸をあわせよう。', explanation: `${left}と${ones}で${q.answer}だね。` }];
    }
    if (q.type === 'missingSub') {
      const ones = q.total - 10, left = q.result - ones;
      return [part(q.total, 10),
        { ...part(q.result, ones), prompt: `${q.result}は ${ones}と いくつ？`, hint: '分けておいた数と、10からのこった数をあわせるよ。' },
        { ...part(10, left), prompt: `10から いくつひくと${left}？`, expression: `10 − □ ＝ ${left}`, hint: '緑の丸をのこすには、白い丸をいくつとればいいかな？', explanation: `10から${q.answer}をひくと${left}。${left}と${ones}で${q.result}だね。` }];
    }
    return [support(q)];
  }
  function support(q) {
    if (THIRD_TYPES.includes(q.type)) return q.prerequisite;
    if (NEXT_TYPES.includes(q.type)) return q.prerequisite;
    if (q.type === 'compare') return { ...q, support: true, prompt: `${q.bigger ? '右' : '左'}にある数は どっち？`, hint: '数の線の位置を見てみよう。' };
    if (q.type === 'order') return { ...q, support: true, prompt: q.blank === 0 ? `${q.a + 1}の ひとつ前は？` : `${q.answer - 1}の ひとつ次は？`, expression: q.blank === 0 ? `□ ← ${q.a + 1}` : `${q.answer - 1} → □` };
    return { ...q, support: true, prompt: q.compose ? '丸は ぜんぶで いくつ？' : '色のついていない丸は いくつ？', expression: '', hint: 'ひとつずつ、ゆっくり数えてみよう。' };
  }
  function chooseType(stats, rng = Math.random, available = TYPES) {
    const review = available.filter(t => (stats[t]?.misses || 0) > 0 && (stats[t]?.firstCorrectStreak || 0) < 3);
    const pool = review.length && rng() < .3 ? review : available;
    return pool[integer(0, pool.length - 1, rng)];
  }
  function createState() { return { version: 3, total: 0, correct: 0, lastStudyDate: null, days: {}, types: Object.fromEntries(ALL_TYPES.map(t => [t, { total: 0, correct: 0, misses: 0 }])), recent: [], bright: 0, collection: Collection.create() }; }
  const count = n => Number.isSafeInteger(n) && n >= 0;
  function validState(s) {
    const schemaTypes = s?.version === 1 ? TYPES : s?.version === 2 ? OLD_TYPES : ALL_TYPES;
    const base = [1, 2, 3].includes(s?.version) && count(s.total) && count(s.correct) && s.correct <= s.total && (s.lastStudyDate === null || /^\d{4}-\d{2}-\d{2}$/.test(s.lastStudyDate)) && s.days && typeof s.days === 'object' && !Array.isArray(s.days) && Object.entries(s.days).every(([d, n]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && count(n)) && schemaTypes.every(t => s.types?.[t] && ['total', 'correct', 'misses'].every(k => count(s.types[t][k])) && s.types[t].correct <= s.types[t].total && (s.types[t].firstCorrectStreak === undefined || (count(s.types[t].firstCorrectStreak) && s.types[t].firstCorrectStreak <= 3)));
    return Boolean(base && (s.version === 1 || (count(s.bright) && Array.isArray(s.recent) && s.recent.length <= 5 && s.recent.every(r => (s.version === 2 ? [1, 2] : [1, 2, 3]).includes(r.level) && count(r.correct) && r.correct <= 10))) && (s.version !== 3 || Collection.valid(s.collection)));
  }
  function migrate(s) {
    if (!validState(s)) throw new Error('Invalid saved history');
    const next = JSON.parse(JSON.stringify(s));
    if (next.version === 1) {
      next.version = 2; next.recent = []; next.bright = 0;
      NEXT_TYPES.forEach(t => { next.types[t] = { total: 0, correct: 0, misses: 0 }; });
    }
    if (next.version === 2) {
      next.version = 3; next.collection = Collection.create();
      THIRD_TYPES.forEach(t => { next.types[t] = { total: 0, correct: 0, misses: 0 }; });
    }
    return next;
  }
  function bridgeReady(state) {
    const last = state.recent.filter(r => r.level === 2).at(-1);
    return Boolean(last && last.correct >= 8);
  }
  function completeSession(state, level, correct, recovered = 0, date = state.lastStudyDate, rng = Math.random) {
    state.recent = [...state.recent, { level, correct }].slice(-5);
    if (correct >= 8) state.bright++;
    return Collection.finish(state.collection, { level, correct, recovered, date }, rng);
  }
  function schedule(state, level, rng = Math.random) {
    const shuffle = values => {
      for (let i = values.length - 1; i > 0; i--) { const j = integer(0, i, rng); [values[i], values[j]] = [values[j], values[i]]; }
      return values;
    };
    if (level === 1) return [...shuffle([...TYPES]), ...Array.from({ length: 5 }, () => chooseType(state.types, rng))];
    if (level === 3) {
      const last = state.recent.filter(r => r.level === 3).at(-1);
      const gentle = last && last.correct <= 5;
      const pool = ['addBridge', 'subBridge', 'missingAdd', 'missingSub'];
      return [...shuffle(['tens', 'sub20']), ...shuffle(['addBridge', 'subBridge']), ...shuffle(gentle ? ['complement', 'parts'] : ['missingAdd', 'missingSub']), ...Array.from({ length: 4 }, () => chooseType(state.types, rng, gentle ? ['add20', 'sub20', 'addBridge', 'subBridge'] : pool))];
    }
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
      explanation = `${a}を10と${a - 10}に分けるよ。10から${b}をひくと${10 - b}。${10 - b}と${a - 10}で${answer}。`;
    }
    const subtract = type.startsWith('sub');
    return { type, a, b, answer, total: subtract ? a : answer, compose: !subtract, subtract, prompt: subtract ? 'のこりは いくつ？' : 'あわせると いくつ？', expression: `${a} ${subtract ? '−' : '＋'} ${b} ＝ □`, explanation, hint: subtract ? (type === 'subBridge' ? '10のまとまりからひいて、分けておいた数とあわせよう。' : '線で消した丸をのぞいて、のこりを数えよう。10のまとまりにも注目。') : '10のまとまりを見つけて、のこりとあわせよう。', visual: 'frame', prerequisite };
  }
  // Hints reveal a cue, then the existing diagram, then an intermediate relation.
  function hints(q) {
    switch (q.type) {
      case 'addBridge': return ['10をつくれないかな？', `${q.a} ＋ ${10 - q.a} ＝ 10。${q.b}の のこりは${q.answer - 10}。`];
      case 'subBridge': return ['10のまとまりからひいてみよう。', `${q.a} ＝ 10 ＋ ${q.a - 10}。10 − ${q.b} ＝ ${10 - q.b}。あとは${q.a - 10}とあわせよう。`];
      case 'missingSub': return ['10のまとまりからひいて、分けておいた数とあわせよう。', `${q.total} ＝ 10 ＋ ${q.total - 10}。${q.result} ＝ ${q.result - (q.total - 10)} ＋ ${q.total - 10}。10 − □ ＝ ${q.result - (q.total - 10)}。`];
      case 'missingAdd': return ['まず10をつくって、その先を考えよう。', `${q.a} ＋ ${10 - q.a} ＝ 10。10から${q.result}までは${q.result - 10}。`];
      case 'complement': case 'split10': return ['10にするには、あといくつかな？', `${q.a} ＋ □ ＝ 10。ふたつをあわせて10にしよう。`];
      case 'tens': return ['10のまとまりと、そのほかに分けよう。', `${q.total} ＝ 10 ＋ □。10の枠のほかを見よう。`];
      case 'add20': return ['10のほかの数を、先にあわせよう。', `${q.a} ＝ 10 ＋ ${q.a - 10}。まず${q.a - 10} ＋ ${q.b}を考えよう。`];
      case 'sub20': return ['10のほかの数から、ひいてみよう。', `${q.a} ＝ 10 ＋ ${q.a - 10}。まず${q.a - 10} − ${q.b}を考えよう。`];
      case 'compare': return ['数の順番を思いうかべよう。', '1 → 2 → 3 …。右へ進むと、1ずつ大きくなるよ。'];
      case 'order': return ['となりの数と、くらべてみよう。', 'となりへ進むと1ずつふえるよ。□の前や後から、たどってみよう。'];
      default: return [q.compose ? 'ふたつの数をあわせよう。' : '全体をふたつに分けよう。', `${q.total} ＝ ${q.a} ＋ ${q.compose ? q.b : '□'}。ふたつの数で全体になるよ。`];
    }
  }
  function mistakeHint(q, answer) {
    if (q.subtract && answer === q.a + q.b) return 'ひき算だね。のこりは もとの数より 小さくなるよ。';
    if (q.type === 'missingAdd' && answer === q.a + q.result) return `□は 足した数。${q.a}から${q.result}まで、いくつ ふえたかな？`;
    if (q.type === 'missingSub' && answer === q.total + q.result) return '□は ひいた数。10のまとまりからひいて考えよう。';
    if (Math.abs(answer - q.answer) === 1) return 'おしい！ 1つずつ、数えなおしてみよう。';
    if (q.type === 'complement' || q.type === 'split10') return '10の枠の、白い丸を数えてみよう。';
    return 'もう一度、考えてみよう。';
  }
  function record(state, q, mistakes, date) {
    state.total++; state.correct += mistakes === 0 ? 1 : 0;
    const type = state.types[q.type]; type.total++; type.correct += mistakes === 0 ? 1 : 0; type.misses += mistakes;
    type.firstCorrectStreak = mistakes === 0 ? Math.min(3, (type.firstCorrectStreak || 0) + 1) : 0;
    state.days[date] = (state.days[date] || 0) + 1; state.lastStudyDate = date;
  }
  const api = { hints, mistakeHint, TYPES, NEXT_TYPES, THIRD_TYPES, ALL_TYPES, LABELS, generate, support, supportSteps, chooseType, createState, validState, migrate, record, schedule, bridgeReady, completeSession };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Kazu = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
