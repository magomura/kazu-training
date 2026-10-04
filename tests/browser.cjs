/* Dev-only smoke checks. npm install --no-save playwright, then npx playwright install chromium. */
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
(async () => {
  const server = http.createServer((req, res) => {
    const file = req.url === '/' ? 'index.html' : req.url.slice(1);
    if (!['index.html', 'app.js', 'engine.js', 'styles.css', 'icon.svg'].includes(file)) { res.writeHead(404); res.end(); return; }
    const mime = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml' };
    res.setHeader('Content-Type', mime[path.extname(file)]);
    res.end(fs.readFileSync(path.join(__dirname, '..', file)));
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 1 });
  const page = await context.newPage(), errors = [];
  page.on('pageerror', e => errors.push(e.message));
  const url = process.env.TEST_URL || `http://127.0.0.1:${server.address().port}`;
  await page.goto(url);
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
  console.log('PASS: 10-question session, all 5 types, support/retry/return, validation, history reload, 320/390/430px layout, corrupt/denied storage, no JS errors.');
  await browser.close();
  server.close();
})().catch(error => { console.error(error); process.exit(1); });
