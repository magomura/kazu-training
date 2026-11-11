(function (root) {
  'use strict';
  const milestones = [1, 2, 3, 5, 7, 10, 14, 18, 23, 28, 34, 40, 47, 54, 62, 70, 80, 90];
  const names = ['星待ちの灯台', '月あかりの砂丘', '銀河の橋', '星の風車', '青い氷の谷', '宙に浮かぶ島', '光るきのこの森', '三日月の港', '星の図書館', '夜空の気球', '水晶の洞窟', '天の川の列車', '雲の上の城', '宇宙の花畑', '流星の滝', '星時計の塔', '虹色の星雲', '旅の天文台'];
  const rareNames = ['ほうき星の便り', '銀河を泳ぐくじら', 'ふたごの流星', '月の白いきつね', '宇宙のくらげ', '金色の星のたまご'];
  const badges = [
    ['three', '三つ星のコンパス', '同じLEVELで3回続けて10問全問正解。'],
    ['five', '五つ星の王冠', '同じLEVELで5回続けて10問全問正解。'],
    ['ten', '十の光のランタン', '同じLEVELで10回続けて10問全問正解。'],
    ['retry', '考えなおしの結晶', '補助問題のあと、元の問題を自力で3問正解。'],
    ['rainbow', '雨上がりの虹', '初回正解5問以下の回で、補助後に1問以上解き直して10問完走。または解き直し正解を累計10問。'],
    ['level3', '10の橋の建築士', 'LEVEL 3を10回、10問ずつ完走。']
  ];
  const catalog = [
    ...names.map((name, i) => ({ id: `place-${i}`, name, kind: 'place', index: i, at: milestones[i], condition: `この更新から10問の旅を${milestones[i]}回。正解数は問わないよ。` })),
    ...rareNames.map((name, i) => ({ id: `rare-${i}`, name, kind: 'rare', index: i, condition: '10問の旅のあと、ときどき出会うふしぎな発見。' })),
    ...badges.map(([id, name, condition], i) => ({ id, name, condition, kind: 'badge', index: i }))
  ];
  const ids = catalog.map(c => c.id);
  const count = n => Number.isSafeInteger(n) && n >= 0;
  function create() { return { completed: 0, level3: 0, recovered: 0, streaks: { 1: 0, 2: 0, 3: 0 }, best: { 1: 0, 2: 0, 3: 0 }, owned: [], lastAwards: [], drawDay: null, dailyDraws: 0, missDraws: 0, pendingLevel: null }; }
  function valid(c) {
    const uniqueIds = a => Array.isArray(a) && new Set(a).size === a.length && a.every(id => ids.includes(id));
    return Boolean(c && ['completed', 'level3', 'recovered', 'dailyDraws', 'missDraws'].every(k => count(c[k])) && c.level3 <= c.completed && c.dailyDraws <= 3 && c.missDraws < 15 && [1, 2, 3].every(l => count(c.streaks?.[l]) && count(c.best?.[l]) && c.streaks[l] <= c.best[l]) && uniqueIds(c.owned) && uniqueIds(c.lastAwards) && c.lastAwards.every(id => c.owned.includes(id)) && (c.drawDay === null || /^\d{4}-\d{2}-\d{2}$/.test(c.drawDay)) && [null, 1, 2, 3].includes(c.pendingLevel));
  }
  function abandon(c) {
    if (c.pendingLevel !== null) c.streaks[c.pendingLevel] = 0;
    c.pendingLevel = null;
  }
  function begin(c, level) { abandon(c); c.pendingLevel = level; c.lastAwards = []; }
  function finish(c, { level, correct, recovered = 0, date }, rng = Math.random) {
    c.completed++; c.level3 += level === 3 ? 1 : 0; c.recovered += recovered;
    c.pendingLevel = null;
    c.streaks[level] = correct === 10 ? c.streaks[level] + 1 : 0;
    c.best[level] = Math.max(c.best[level], c.streaks[level]);
    const awards = [];
    const earn = id => { if (!c.owned.includes(id)) { c.owned.push(id); awards.push(id); } };
    catalog.filter(x => x.kind === 'place' && c.completed >= x.at).forEach(x => earn(x.id));
    for (const [n, id] of [[3, 'three'], [5, 'five'], [10, 'ten']]) if (c.streaks[level] >= n) earn(id);
    if (c.recovered >= 3) earn('retry');
    if ((correct <= 5 && recovered >= 1) || c.recovered >= 10) earn('rainbow');
    if (c.level3 >= 10) earn('level3');
    if (c.drawDay !== date) { c.drawDay = date; c.dailyDraws = 0; }
    const available = catalog.filter(x => x.kind === 'rare' && !c.owned.includes(x.id));
    if (c.dailyDraws < 3 && available.length) {
      c.dailyDraws++; c.missDraws++;
      // One 12% discovery draw, then a uniform choice among unowned items.
      // The 15th eligible draw always discovers one; no duplicates or reroll on render.
      if (c.missDraws >= 15 || rng() < .12) {
        earn(available[Math.floor(rng() * available.length)].id); c.missDraws = 0;
      }
    }
    c.lastAwards = awards;
    return awards;
  }
  const api = { catalog, create, valid, begin, abandon, finish };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.Collection = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
