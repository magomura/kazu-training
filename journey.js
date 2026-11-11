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
  const destinations = [
    '<path d="M155 164l10-82h18l10 82z" fill="#ddd3b8"/><path d="M160 82l14-15 14 15z" fill="#d49b63"/><path d="M173 89L78 113l95-10 94 10-94-24" fill="#ffe5a0" opacity=".6"/>',
    '<path d="M0 158q95-100 185 0T340 146v74H0" fill="#c6a17c"/><path d="M0 186q105-85 230-12" fill="none" stroke="#f4d2a4"/>',
    '<path d="M40 156Q170 60 300 156M40 170Q170 75 300 170" fill="none" stroke="#d4c7b4" stroke-width="6"/><path d="M80 134v23m45-43v24m45-32v25m45-17v24m45-4v23" stroke="#d4c7b4" stroke-width="4"/>',
    '<path d="M160 170l9-65h15l9 65z" fill="#b6c3b5"/><g stroke="#e6d8b7" stroke-width="9"><path d="M177 108l-37-35m37 35l36-38m-36 38l36 37m-36-37l-35 36"/></g>',
    '<path d="M0 180L72 70l54 104 60-124 83 130 71-84v124H0" fill="#96c8d3"/><path d="M72 70l-8 69 30-30m92-59l-23 103 47-59" fill="#d4f1ec"/>',
    '<path d="M93 113l77 64 78-64z" fill="#b49b95"/><ellipse cx="170" cy="112" rx="78" ry="20" fill="#8fbb97"/><path d="M170 77v36m-21-19l21-35 22 35" stroke="#e6d2b7" fill="#37635a" stroke-width="3"/>',
    '<g fill="#c9d9b0" stroke="#b3c5ac" stroke-width="6"><path d="M130 120v52m90-38v42"/><path d="M92 120q38-75 76 0zM191 134q29-56 58 0z" fill="#a6b6dd"/></g>',
    '<path d="M70 145h210l-40 30H100z" fill="#91bdb9"/><path d="M167 75v70h62z" fill="#eed8b6"/><path d="M0 190q75-20 150 0t190 0" fill="none" stroke="#a7cdcb"/>',
    '<path d="M89 105l80 15 82-15v63l-82 12-80-12z" fill="#d9cba8"/><path d="M169 120v60m-60-54l39 6m41 0l40-6m-120 18l39 6m41 0l40-6" stroke="#8e8b83" stroke-width="3"/>',
    '<ellipse cx="169" cy="86" rx="46" ry="54" fill="#d6b19e"/><path d="M169 32q-37 53 0 108q37-53 0-108" fill="#efcfab"/><path d="M145 129l13 28m35-28l-13 28" stroke="#dfc9a6"/><path d="M154 156h31l-5 19h-21z" fill="#aa947e"/>',
    '<path d="M83 167l20-72 25 62 30-113 32 113 35-82 27 92z" fill="#bdc5e1"/><path d="M158 44v113m67-82v92m-122-72v62" stroke="#e5e8f4" stroke-width="3"/>',
    '<path d="M65 138h46v30H65zm54 0h48v30h-48zm56 0h56v30h-56z" fill="#a6bfbb"/><path d="M69 143h20m38 0h25m30 0h28" stroke="#ffe2a2" stroke-width="8"/><path d="M60 181h200" stroke="#e6cfad" stroke-width="3"/>',
    '<path d="M109 163V96l17-20 17 20v28h52V96l17-20 17 20v67z" fill="#d4cfdb"/><path d="M158 162v-29h21v29" fill="#698999"/><ellipse cx="170" cy="176" rx="107" ry="15" fill="#c1d9d8"/>',
    '<g fill="#ead5b3" stroke="#b8cab1"><path d="M110 160v-40m60 50v-66m62 60v-39" stroke-width="3"/><circle cx="110" cy="118" r="13"/><circle cx="170" cy="101" r="18"/><circle cx="232" cy="124" r="14"/></g>',
    '<path d="M130 74q-40 65 1 111h68q-50-57-12-111" fill="#b0d7e0" opacity=".8"/><path d="M148 76q-40 57 9 105m13-104q-37 66 12 105" fill="none" stroke="#e9eff0" stroke-width="3"/>',
    '<path d="M139 176V90h61v86" fill="#d0c5af"/><circle cx="169" cy="95" r="29" fill="#dce4d4" stroke="#cbb591" stroke-width="4"/><path d="M169 76v19l13 9" fill="none" stroke="#617f80" stroke-width="3"/>',
    '<g opacity=".55"><ellipse cx="170" cy="100" rx="110" ry="38" fill="#b49dd3" transform="rotate(-25 170 100)"/><ellipse cx="170" cy="100" rx="89" ry="23" fill="#98d1cb" transform="rotate(-25 170 100)"/></g><circle cx="170" cy="100" r="12" fill="#f2dcba"/>',
    '<path d="M104 170v-55a66 66 0 01132 0v55z" fill="#b4c2c1"/><path d="M159 51v64h14V51" fill="#799199"/><path d="M188 137l46-30 8 13-46 30z" fill="#e6d6b3"/><path d="M189 147l-11 27m11-27l12 27" stroke="#e6d6b3" stroke-width="4"/>'
  ];
  let sequence = 0;
  function scene(index, shooting = false) {
    const [, , top, bottom] = places[index % places.length], id = `sky-${++sequence}`;
    const name = index < 6 ? places[index][0] : Collection.catalog[index - 6].name;
    const stars = [[24, 28], [57, 67], [86, 23], [123, 46], [157, 17], [193, 63], [217, 33], [253, 75], [292, 22], [313, 52]];
    const special = index >= 6 ? destinations[index - 6] : [
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
  function legacyReward(history, startTotal, shooting) {
    const discovery = Math.floor(history.total / 10) > Math.floor(startTotal / 10);
    const title = discovery ? (Math.floor(history.total / 10) <= places.length ? '新しい景色を見つけた！' : '次の空まで、歩いてきたね。') : '星空の旅も、一歩進んだよ。';
    return `<h2>${title}</h2>${scene(current(history), shooting)}<p>${shooting ? '8問以上、はじめの答えでできたね。<br>今日は流れ星も見えたよ！' : discovery ? places[current(history)][1] : `あと${10 - history.total % 10}問で、次の景色へ。`}</p>`;
  }
  function cards(history) {
    return [...places.map(([name, description], i) => ({ id: `legacy-${i}`, name, description, kind: 'legacy', index: i, condition: `累計${(i + 1) * 10}問に取り組む。`, owned: history.total >= (i + 1) * 10 })), ...Collection.catalog.map(c => ({ ...c, owned: history.collection.owned.includes(c.id) }))];
  }
  function emblem(card) {
    const rareArt = [
      '<path d="M68 48L198 106 104 40" fill="#ecd59a" opacity=".6"/><circle cx="203" cy="111" r="18" fill="#ffe5ac"/>',
      '<path d="M84 123q20-56 95-35 35 8 37 31l34-27-1 35-31 13q-74 50-134-17" fill="#9ed3df"/><circle cx="112" cy="113" r="3" fill="#253d59"/><path d="M112 82q-3-18-15-24m15 24q5-20 20-23" stroke="#d5eeec" fill="none" stroke-width="3"/>',
      '<path d="M78 47l94 56m-53-67l110 70" stroke="#d5c9ee" stroke-width="5"/><circle cx="174" cy="106" r="10" fill="#fbecb9"/><circle cx="232" cy="109" r="16" fill="#f5dba7"/>',
      '<path d="M123 129l7-62 29 26 31-26 13 59-39 34z" fill="#ebdfca"/><path d="M203 126q51-50 52-4t-60 27" fill="#ebdfca"/><path d="M145 119l5 3m27-3l-5 3" stroke="#334852" stroke-width="3"/><circle cx="163" cy="139" r="3" fill="#334852"/>',
      '<path d="M113 111q0-78 110 0z" fill="#b6b6df"/><path d="M126 111q-9 27 8 48m20-48q-8 36 7 47m24-47q-8 26 7 44m18-44q-7 21 8 33" stroke="#cce0e7" fill="none" stroke-width="5"/>',
      '<path d="M129 126c0-32 22-72 41-72s41 40 41 72-82 38-82 0" fill="#e5be6e"/><path d="M165 80l6 12 13 2-10 10 3 14-12-7-12 7 3-14-10-10 13-2z" fill="#fff0bd"/>'
    ];
    const badgeArt = [
      '<circle cx="170" cy="108" r="43" fill="none" stroke="#e1c694" stroke-width="3"/><path d="M170 64l15 44-15 44-15-44z" fill="#e1c694"/>',
      '<path d="M112 96l25 17 33-39 32 39 26-17-13 55h-90z" fill="#e4bd79"/>',
      '<path d="M147 80v-9a23 23 0 0146 0v9m-57 0h68l-8 74h-52z" fill="none" stroke="#d8c9a7" stroke-width="4"/><path d="M170 96l12 35-12 12-12-12z" fill="#ffe4a0"/>',
      '<path d="M170 55l39 49-39 58-39-58z" fill="#a7ddd5"/><path d="M170 55v107m-39-58h78" stroke="#e6f3df" stroke-width="3"/>',
      '<path d="M105 148a65 65 0 01130 0" fill="none" stroke="#d4a3aa" stroke-width="12"/><path d="M119 148a51 51 0 01102 0" fill="none" stroke="#e6cf98" stroke-width="11"/><path d="M132 148a38 38 0 0176 0" fill="none" stroke="#b1d6bd" stroke-width="10"/>',
      '<path d="M103 144v-23q67-75 134 0v23M103 144q67-75 134 0" fill="none" stroke="#d7ceab" stroke-width="5"/><path d="M137 101v25m33-34v25m33-16v25" stroke="#d7ceab" stroke-width="3"/>'
    ];
    const drawing = card.kind === 'rare' ? rareArt[card.index] : badgeArt[card.index];
    return `<svg class="sky collectible-art" viewBox="0 0 340 220" role="img" aria-label="${card.name}" xmlns="http://www.w3.org/2000/svg"><rect width="340" height="220" rx="18" fill="${card.kind === 'rare' ? '#292c4b' : '#22493f'}"/><g fill="#d8caac"><circle cx="64" cy="70" r="2"/><circle cx="270" cy="55" r="2"/><circle cx="285" cy="151" r="1.5"/><circle cx="92" cy="175" r="1.5"/></g>${drawing}</svg>`;
  }
  function art(card) { return card.kind === 'legacy' ? scene(card.index) : card.kind === 'place' ? scene(card.index + 6) : emblem(card); }
  function home(history) {
    const all = cards(history), owned = all.filter(c => c.owned), last = owned.find(c => c.id === history.collection.lastAwards.at(-1)) || owned.at(-1);
    const next = Collection.catalog.find(c => c.kind === 'place' && !history.collection.owned.includes(c.id));
    return `<div class="journey-heading"><p class="eyebrow">ほしぞらの旅 · 第2章</p><span>${owned.length} / 36</span></div>${last ? art(last) : scene(0)}<h2>${last ? last.name : '次の空へ、出かけよう。'}</h2><p class="note">${next ? `10問の旅をあと${Math.max(0, next.at - history.collection.completed)}回で、新しい景色へ。` : 'すべての旅の景色に出会ったね。'}<br>珍しい発見や、特別な記念品もあるよ。</p><button id="album" class="secondary">コレクションを見る</button>`;
  }
  function album(history) {
    const all = cards(history), found = all.filter(c => c.owned).length;
    return `<p class="eyebrow">ほしぞらの旅 · 第2章</p><h1 tabindex="-1">星のコレクション</h1><p class="lead">${found} / 36 の発見。<br>見つけたものを押すと、大きく見られるよ。</p><div class="album-filters" aria-label="種類で絞り込み">${[['all', 'すべて'], ['place', '新しい景色'], ['rare', 'ふしぎ'], ['badge', '記念品'], ['legacy', 'はじまり']].map(([id, label]) => `<button data-filter="${id}" aria-pressed="${id === 'all'}">${label}</button>`).join('')}</div><div class="collection-grid">${all.map(c => `<section class="collection-card" data-kind="${c.kind}">${c.owned ? `<button data-card="${c.id}">${art(c)}<span>${c.name}</span><small>見つけた！</small></button>` : `<div class="locked-sky" aria-hidden="true">✧</div><h2>${c.kind === 'rare' ? 'まだ見ぬふしぎ' : c.name}</h2><p>${c.condition}</p>`}</section>`).join('')}</div><details><summary>旅のきろくと、発見のしくみ</summary><p>この更新から ${history.collection.completed}回の10問の旅。流れ星を見た回：${history.bright}回。</p><p>同じLEVELでの連続全問正解：${[1, 2, 3].map(l => `LEVEL ${l}：${history.collection.streaks[l]}回`).join(' ／ ')}。日が空いても続きから。途中終了や誤答では、そのLEVELの連続回数が0に戻るよ。</p><p>ふしぎな発見は10問の旅のあと12%の抽選。1日3回まで、15回出会えなかったら必ず1つ発見。手に入れたものは重ならないよ。</p><p>間違えた数ではなく、考えなおした一歩にも記念品があるよ。景色も記念品も、お休みしてもなくならないよ。</p></details><p class="note album-note">今日はここまで、でもだいじょうぶ。</p>`;
  }
  function detail(history, id) {
    const card = cards(history).find(c => c.id === id && c.owned);
    if (!card) return '<h1 tabindex="-1">まだ見ぬ発見</h1>';
    return `<p class="eyebrow">星のコレクション</p><h1 tabindex="-1">${card.name}</h1>${art(card)}<p class="lead">${card.description || (card.kind === 'place' ? '少しずつ進んだ旅の、その先で見つけた景色。' : card.kind === 'rare' ? 'いつもの空で出会った、とくべつな発見。' : '数と向き合った時間を、星が覚えているよ。')}</p><p class="note album-note">${card.condition}</p>`;
  }
  function reward(history, startTotal, shooting, awards = []) {
    const fresh = cards(history).filter(c => awards.includes(c.id));
    return legacyReward(history, startTotal, shooting) + (fresh.length ? `<section class="new-discoveries"><h2>今日のあたらしい発見</h2>${fresh.map(c => `<div class="discovery">${art(c)}<strong>${c.name}</strong></div>`).join('')}<p>コレクションにしまったよ。</p></section>` : '<p class="note">新しい景色へ、旅が一歩進んだよ。</p>');
  }
  root.Journey = { home, album, reward, detail };
})(typeof globalThis !== 'undefined' ? globalThis : this);
