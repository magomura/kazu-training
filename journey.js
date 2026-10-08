/* Original vector postcards. No downloads, accounts, or random reward purchases. */
(function (root) {
  'use strict';
  const places = [
    ['森のむこうの星', '木々のむこうに、小さな星を見つけた。', '#102f3b', '#317066'],
    ['星うつす湖', '水の上にも、もうひとつの星空。', '#172644', '#557a91'],
    ['月へのさんぽ', 'いつもの月が、今日は少し近く見える。', '#24213e', '#7f7398'],
    ['オーロラの丘', '夜空に、光のカーテンがゆれている。', '#102f3b', '#407e79'],
    ['わっかのある星', '遠くの星には、ふしぎなわっか。', '#292343', '#9c6e88'],
    ['夜明けのそら', '一歩ずつ進んだ先で、新しい朝に出会った。', '#364564', '#e8b090']
  ];
  let sequence = 0;
  function scene(index, shooting = false) {
    const [name, , top, bottom] = places[index % places.length], id = `sky-${++sequence}`;
    const stars = [[24, 28], [57, 67], [86, 23], [123, 46], [157, 17], [193, 63], [217, 33], [253, 75], [292, 22], [313, 52]];
    const special = [
      '<path d="M0 160l24-52 22 52 18-70 33 80 36-48 30 49H0z" fill="#183d3c"/>',
      '<path d="M0 156Q75 145 160 159T340 154V220H0z" fill="#537990"/><path d="M170 168h48m-63 13h77m-66 14h54" stroke="#dccfac" opacity=".7"/>',
      '<circle cx="229" cy="74" r="36" fill="#eee5ce"/><circle cx="242" cy="63" r="7" fill="#c4bfb6"/><circle cx="214" cy="86" r="10" fill="#d5cdbb"/>',
      '<path d="M-20 85Q75 5 147 66T360 31L340 73Q223 117 143 92T0 123z" fill="#85d3b0" opacity=".55"/><path d="M-20 95Q75 15 147 76T360 41" stroke="#b0e0c8" stroke-width="3" fill="none"/>',
      '<g transform="rotate(-22 215 82)"><circle cx="215" cy="82" r="32" fill="#d7af91"/><ellipse cx="215" cy="82" rx="59" ry="13" fill="none" stroke="#ebd8ae" stroke-width="7"/><path d="M185 73a32 32 0 0160 0" fill="#d7af91"/></g>',
      '<circle cx="227" cy="140" r="38" fill="#ffe1aa"/><path d="M15 108q12-12 24 0m11-14q10-10 20 0" fill="none" stroke="#314854" stroke-width="2"/>'
    ][index % places.length];
    return `<svg class="sky${shooting ? ' has-shooting' : ''}" viewBox="0 0 340 220" role="img" aria-label="${name}${shooting ? '。流れ星がきらめく空' : ''}" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="${id}" x2="0" y2="1"><stop stop-color="${top}"/><stop offset="1" stop-color="${bottom}"/></linearGradient></defs><rect width="340" height="220" rx="18" fill="url(#${id})"/>${stars.map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${i % 3 === 0 ? 1.8 : 1}" fill="#f9edcb" opacity="${i % 2 ? '.6' : '.95'}"/>`).join('')}${special}<path d="M0 180Q55 139 120 170T230 159T340 176V220H0z" fill="#142f36" opacity=".85"/><path d="M0 205Q100 170 176 197T340 183V220H0z" fill="#10292f"/>${shooting ? '<g class="shooting-star"><path d="M125 29L207 83" stroke="#f6dda2" stroke-width="2"/><path d="M207 74l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="#fff6db"/></g>' : ''}</svg>`;
  }
  const count = history => Math.min(places.length, Math.floor(history.total / 10));
  const current = history => Math.max(0, Math.floor(history.total / 10) - 1) % places.length;
  function home(history) {
    const found = count(history), left = 10 - history.total % 10;
    return `<div class="journey-heading"><p class="eyebrow">ほしぞらの旅</p><span>${found} / ${places.length}の景色</span></div>${scene(current(history))}<h2>${found ? places[current(history)][0] : '数のむこうに、見にいこう。'}</h2><p class="note">${found < places.length ? `あと${left}問で、新しい景色に出会えるよ。` : `あと${left}問で、次の空へのさんぽ。`}<br>考えなおしても、一歩ずつ進めるよ。</p><button id="album" class="secondary">見つけた景色を見る</button>`;
  }
  function album(history) {
    const found = count(history);
    return `<p class="eyebrow">ほしぞらの旅</p><h1 tabindex="-1">見つけた景色</h1><p class="lead">${found}つの景色に出会ったよ。<br>流れ星が見えた回：${history.bright}回</p><div class="album">${places.map(([name, description], i) => `<section class="postcard">${i < found ? scene(i) + `<h2>${name}</h2><p>${description}</p>` : `<div class="locked-sky" aria-hidden="true">✧</div><h2>まだ見ぬ景色 ${i + 1}</h2><p>あと${(i + 1) * 10 - history.total}問の旅で出会えるよ。</p>`}</section>`).join('')}</div><p class="note album-note">お休みしても、見つけた景色はなくならないよ。</p>`;
  }
  function reward(history, startTotal, shooting) {
    const discovery = Math.floor(history.total / 10) > Math.floor(startTotal / 10);
    const title = discovery ? (Math.floor(history.total / 10) <= places.length ? '新しい景色を見つけた！' : '次の空まで、歩いてきたね。') : '星空の旅も、一歩進んだよ。';
    return `<h2>${title}</h2>${scene(current(history), shooting)}<p>${shooting ? '8問以上、はじめの答えでできたね。<br>今日は流れ星も見えたよ！' : discovery ? places[current(history)][1] : `あと${10 - history.total % 10}問で、次の景色へ。`}</p>`;
  }
  root.Journey = { home, album, reward };
})(typeof globalThis !== 'undefined' ? globalThis : this);
