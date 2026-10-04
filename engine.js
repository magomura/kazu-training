/* Pure learning logic: no DOM, network, or storage dependency. */
(function (root) {
  'use strict';
  const TYPES = ['compare', 'order', 'complement', 'split10', 'parts'];
  const LABELS = { compare: '数の大小', order: '数の順番', complement: 'あといくつで10', split10: '10の分け方', parts: '数の分解と合成' };
  const integer = (min, max, rng = Math.random) => min + Math.floor(rng() * (max - min + 1));
  function generate(type, rng = Math.random) {
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
    if (q.type === 'compare') return { ...q, support: true, prompt: `${q.bigger ? '右' : '左'}にある数は どっち？`, hint: '数の線の位置を見てみよう。' };
    if (q.type === 'order') return { ...q, support: true, prompt: q.blank === 0 ? `${q.a + 1}の ひとつ前は？` : `${q.answer - 1}の ひとつ次は？`, expression: q.blank === 0 ? `□ ← ${q.a + 1}` : `${q.answer - 1} → □` };
    return { ...q, support: true, prompt: q.compose ? '丸は ぜんぶで いくつ？' : '色のついていない丸は いくつ？', expression: '', hint: 'ひとつずつ、ゆっくり数えてみよう。' };
  }
  function chooseType(stats, rng = Math.random) {
    const review = TYPES.filter(t => (stats[t]?.misses || 0) > 0);
    const pool = review.length && rng() < .3 ? review : TYPES;
    return pool[integer(0, pool.length - 1, rng)];
  }
  function createState() { return { version: 1, total: 0, correct: 0, lastStudyDate: null, days: {}, types: Object.fromEntries(TYPES.map(t => [t, { total: 0, correct: 0, misses: 0 }])) }; }
  const count = n => Number.isSafeInteger(n) && n >= 0;
  function validState(s) {
    return s?.version === 1 && count(s.total) && count(s.correct) && s.correct <= s.total && (s.lastStudyDate === null || /^\d{4}-\d{2}-\d{2}$/.test(s.lastStudyDate)) && s.days && typeof s.days === 'object' && !Array.isArray(s.days) && Object.entries(s.days).every(([d, n]) => /^\d{4}-\d{2}-\d{2}$/.test(d) && count(n)) && TYPES.every(t => s.types?.[t] && ['total', 'correct', 'misses'].every(k => count(s.types[t][k])) && s.types[t].correct <= s.types[t].total);
  }
  function record(state, q, mistakes, date) {
    state.total++; state.correct += mistakes === 0 ? 1 : 0;
    const type = state.types[q.type]; type.total++; type.correct += mistakes === 0 ? 1 : 0; type.misses += mistakes;
    state.days[date] = (state.days[date] || 0) + 1; state.lastStudyDate = date;
  }
  const api = { TYPES, LABELS, generate, support, chooseType, createState, validState, record };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Kazu = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
