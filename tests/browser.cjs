/* Dev-only smoke checks. npm install --no-save playwright, then npx playwright install chromium. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const server = http.createServer((req, res) => {
    const pathname = new URL(req.url, 'http://localhost').pathname;
    // Optional local Japanese font for Linux visual QA; never part of the app.
    if (process.env.TEST_FONT_DIR && /^\/test-font\/[a-z0-9-]+\.woff2?$/.test(pathname)) {
      res.setHeader('Content-Type', pathname.endsWith('.woff2') ? 'font/woff2' : 'font/woff');
      res.end(fs.readFileSync(path.join(process.env.TEST_FONT_DIR, 'files', path.basename(pathname)))); return;
    }
    const file = pathname === '/' ? 'index.html' : pathname.slice(1);
    if (!['index.html', 'app.js', 'engine.js', 'journey.js', 'styles.css', 'icon.svg'].includes(file)) { res.writeHead(404); res.end(); return; }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', mime[path.extname(file)]);
    res.end(fs.readFileSync(path.join(__dirname, '..', file)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  if (process.env.TEST_FONT_DIR) {
    const fontCSS = [400, 700].map(weight => fs.readFileSync(path.join(process.env.TEST_FONT_DIR, `${weight}.css`), 'utf8')).join('\n').replaceAll('./files/', '/test-font/') + '\nbody{font-family:"Noto Sans JP",sans-serif}';
    await context.addInitScript(css => window.addEventListener('DOMContentLoaded', () => { const style = document.createElement('style'); style.textContent = css; document.head.append(style); }), fontCSS);
  }
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const url = process.env.TEST_URL || `http://127.0.0.1:${server.address().port}`;
  await page.goto(url);
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: '/tmp/kazu-home.png', fullPage: true });
  await page.locator('#start').click();
  const first = await page.evaluate(() => session.question.answer);
  await page.locator('#answer-form button').click();
  assert.equal(await page.locator('#input-error').isVisible(), true);
  assert.equal(await page.evaluate(() => history.total), 0);
  await page.locator('#answer').fill('0'); await page.locator('#answer-form button').click();
  assert.match(await page.locator('#feedback').innerText(), /もう一度/);
  await page.locator('#continue').click();
  assert.equal(await page.evaluate(() => session.mode), 'support');
  await page.screenshot({ path: '/tmp/kazu-support.png', fullPage: true });
  for (let i = 0; i < 2; i++) {
    await page.locator('#answer').fill('0'); await page.locator('#answer-form button').click(); await page.locator('#continue').click();
  }
  assert.equal(await page.evaluate(() => session.mode), 'return');
  assert.equal(await page.evaluate(() => history.total), 0);
  assert.equal(await page.evaluate(() => session.question.answer), first);
  await page.locator('#answer').fill(String(first)); await page.locator('#answer-form button').click();
  assert.equal(await page.evaluate(() => history.total), 1);
  assert.equal(await page.evaluate(() => history.correct), 0);
  await page.locator('#continue').click();
  // Finish the remaining nine: ten main questions total, support steps excluded.
  for (let i = 1; i < 10; i++) {
    const answer = await page.evaluate(() => session.question.answer);
    await page.locator('#answer').fill(String(answer)); await page.locator('#answer-form button').click();
    await page.locator('#continue').click();
  }
  assert.match(await page.locator('h1').innerText(), /10問/);
  assert.equal(await page.evaluate(() => history.total), 10);
  assert.equal(await page.evaluate(() => history.correct), 9);
  await page.reload();
  assert.equal(await page.evaluate(() => history.total), 10);
  assert.ok(await page.evaluate(() => Kazu.TYPES.every(t => history.types[t].total >= 1)));
  await page.locator('#start').click();
  // All layouts at narrow and standard iPhone widths, including long prompts and hints.
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const type of ['compare', 'order', 'complement', 'split10', 'parts']) {
      await page.evaluate(t => { session.question = Kazu.generate(t); session.mode = 'support'; renderQuestion(); }, type);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${type} overflow`);
      const size = await page.locator('#answer-form button').boundingBox(); assert.ok(size.height >= 48);
    }
  }
  // Failing the returned main question resolves gracefully without an endless loop.
  await page.evaluate(() => { session.mode = 'return'; session.mistakes = 1; renderQuestion(); });
  await page.locator('#answer').fill('0'); await page.locator('#answer-form button').click();
  assert.match(await page.locator('#feedback').innerText(), /答えは/);
  assert.equal(await page.evaluate(() => history.total), 11);
  await page.locator('#stop').click(); await page.locator('#home').click();
  // Preserve three days of existing practice through the schema upgrade.
  await page.evaluate(() => {
    const legacy = { version: 1, total: 30, correct: 29, lastStudyDate: '2026-10-07', days: { '2026-10-05': 10, '2026-10-06': 10, '2026-10-07': 10 }, types: Object.fromEntries(Kazu.TYPES.map(t => [t, { total: 6, correct: t === 'parts' ? 5 : 6, misses: t === 'parts' ? 1 : 0 }])) };
    localStorage.setItem(KEY, JSON.stringify(legacy));
  });
  await page.reload();
  assert.equal(await page.evaluate(() => history.total), 30);
  assert.equal(await page.evaluate(() => history.correct), 29);
  assert.match(await page.locator('.journey-heading').innerText(), /3 \/ 6/);
  // Migration doesn't touch the stored original until a completed question is saved.
  assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem(KEY)).version), 1);
  await page.locator('#start-next').click();
  assert.equal(await page.evaluate(() => session.level), 2);
  assert.equal(await page.evaluate(() => session.coverage.some(t => t.endsWith('Bridge'))), false);
  for (let i = 0; i < 10; i++) {
    const answer = await page.evaluate(() => session.question.answer);
    await page.locator('#answer').fill(String(answer)); await page.locator('#answer-form button').click();
    await page.locator('#continue').click();
  }
  assert.equal(await page.evaluate(() => history.total), 40);
  assert.equal(await page.evaluate(() => history.bright), 1);
  assert.equal(await page.locator('.shooting-star').count(), 1);
  await page.screenshot({ path: '/tmp/kazu-v02-reward.png', fullPage: true });
  await page.reload();
  assert.equal(await page.evaluate(() => history.bright), 1);
  assert.equal(await page.evaluate(() => history.total), 40);
  await page.locator('#album').click();
  assert.equal(await page.locator('.postcard svg').count(), 4);
  await page.screenshot({ path: '/tmp/kazu-v02-album.png', fullPage: true });
  await page.locator('#home').click();
  await page.screenshot({ path: '/tmp/kazu-v02-home.png', fullPage: true });
  await page.locator('#start-next').click();
  assert.equal(await page.evaluate(() => session.coverage.filter(t => t.endsWith('Bridge')).length), 2);
  // Crucial regression: prerequisite answer (2) differs from main answer (13).
  await page.evaluate(() => { session.question = { ...Kazu.generate('addBridge', () => .9) }; renderQuestion(); });
  const mainAnswer = await page.evaluate(() => session.question.answer);
  const supportAnswer = await page.evaluate(() => Kazu.support(session.question).answer);
  assert.notEqual(mainAnswer, supportAnswer);
  await page.locator('#answer').fill('0'); await page.locator('#answer-form button').click(); await page.locator('#continue').click();
  await page.locator('#answer').fill(String(supportAnswer)); await page.locator('#answer-form button').click();
  assert.match(await page.locator('#feedback').innerText(), /そう、その数/);
  assert.equal(await page.evaluate(() => history.total), 40);
  await page.locator('#continue').click();
  await page.locator('#answer').fill(String(mainAnswer)); await page.locator('#answer-form button').click();
  assert.equal(await page.evaluate(() => history.total), 41);
  assert.equal(await page.evaluate(() => history.correct), 39);
  await page.locator('#continue').click();
  // All new main/support diagrams, including 20 dots, zero, and long explanations.
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const type of ['tens', 'add20', 'sub20', 'addBridge', 'subBridge']) {
      for (const mode of ['main', 'support']) {
        await page.evaluate(({ type, mode }) => { session.question = Kazu.generate(type, () => .999); session.mode = mode; renderQuestion(); }, { type, mode });
        if (mode === 'main') await page.locator('#show-hint').click();
        assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), `${width}: ${type}/${mode} overflow`);
      }
    }
    await page.evaluate(() => home());
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'home overflow');
    await page.locator('#album').click();
    assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'album overflow');
    await page.locator('#home').click(); await page.locator('#start-next').click();
  }
  // A new scene appears after ten completions even when every main answer needed help.
  await page.evaluate(() => { history = Kazu.createState(); start(2); });
  for (let i = 0; i < 10; i++) {
    await page.evaluate(() => { session.mode = 'return'; session.mistakes = 1; renderQuestion(); });
    const wrong = await page.evaluate(() => (session.question.answer + 1) % 21);
    await page.locator('#answer').fill(String(wrong)); await page.locator('#answer-form button').click(); await page.locator('#continue').click();
  }
  assert.equal(await page.evaluate(() => history.total), 10);
  assert.equal(await page.evaluate(() => history.correct), 0);
  assert.equal(await page.evaluate(() => history.bright), 0);
  assert.match(await page.locator('.reward').innerText(), /新しい景色/);
  assert.equal(await page.locator('.shooting-star').count(), 0);
  // Corrupt stored data is not silently overwritten.
  await page.evaluate(() => localStorage.setItem(KEY, '{bad'));
  await page.reload();
  assert.equal(await page.locator('#storage-warning').isVisible(), true);
  assert.equal(await page.evaluate(() => localStorage.getItem(KEY)), '{bad');
  assert.equal(await page.evaluate(() => history.total), 0);
  // Storage denied: learning still works and gives a visible warning.
  const denied = await context.newPage();
  await denied.addInitScript(() => { Storage.prototype.setItem = () => { throw new Error('denied'); }; });
  await denied.goto(url);
  await denied.evaluate(() => localStorage.removeItem('kazu-training:v1'));
  await denied.reload(); await denied.locator('#start').click();
  const answer = await denied.evaluate(() => session.question.answer);
  await denied.locator('#answer').fill(String(answer)); await denied.locator('#answer-form button').click();
  assert.equal(await denied.locator('#storage-warning').isVisible(), true);
  assert.equal(await denied.evaluate(() => history.total), 1);
  assert.deepEqual(errors, []);
  console.log('PASS: LEVEL 1/2 sessions; distinct prerequisite answers; legacy migration; adaptive bridge questions; postcards and shooting stars; 320/390/430px layouts; corrupt/denied storage; no JS errors.');
  await browser.close();
  server.close();
})().catch(error => { console.error(error); process.exit(1); });
