#!/usr/bin/env node
/** Real Chrome/Metal WebGPU smoke; run after npm run verify:web. */
import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, extname, isAbsolute, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const site = resolve(root, 'build/web/site');
const out = resolve(root, 'build/browser-qa');
mkdirSync(out, { recursive: true });
const report = { ok: false, started: new Date().toISOString(), renderer: 'Chrome native WebGPU', checks: [], screenshots: [], console: [], errors: [], audio: [], states: [] };
let browser, page, cdp, chromeProcess, profile;
const server = createServer((request, response) => {
  try {
    const pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
    const file = resolve(site, `.${pathname === '/' ? '/index.html' : pathname}`);
    const rel = relative(site, file);
    if (rel.startsWith(`..${sep}`) || rel === '..' || isAbsolute(rel)) { response.writeHead(403).end(); return; }
    if (pathname === '/favicon.ico') { response.writeHead(204).end(); return; }
    if (!existsSync(file) || !statSync(file).isFile()) { response.writeHead(404).end(); return; }
    const actual = realpathSync(file);
    if (!actual.startsWith(realpathSync(site) + sep)) { response.writeHead(403).end(); return; }
    response.writeHead(200, { 'Content-Type': { '.html': 'text/html', '.js': 'text/javascript', '.wasm': 'application/wasm', '.json': 'application/json' }[extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store' });
    response.end(readFileSync(file));
  } catch { response.writeHead(400).end(); }
});
function check(name, detail) { report.checks.push({ name, detail }); console.log(`PASS ${name}`); }
const state = async () => {
  await page.waitForFunction(() => globalThis.gameengineProbe?.state(), undefined, { timeout: 30000 });
  const value = await page.evaluate(() => globalThis.gameengineProbe.state());
  assert.match(value.hash, /^[0-9a-f]{16}$/);
  report.states.push(value);
  return value;
};
const advance = async (steps = 8) => {
  const before = await state();
  await page.waitForFunction(previous => {
    const value = globalThis.gameengineProbe?.state();
    return value && Number(value.step) >= Number(previous.step) + previous.steps && value.frames > previous.frames;
  }, { ...before, steps }, { timeout: 30000 });
};
async function shot(name, { art = false } = {}) {
  const path = join(out, `${name}.png`);
  const bytes = await page.screenshot({ path });
  const pixels = await page.evaluate(async base64 => {
    const image = new Image(); image.src = `data:image/png;base64,${base64}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = 96; canvas.height = 64;
    const context = canvas.getContext('2d', { willReadFrequently: true });
    context.drawImage(image, 0, 0, 96, 64);
    const data = context.getImageData(0, 0, 96, 64).data, colors = new Set();
    let white = 0, center = 0;
    for (let y = 12; y < 56; y++) for (let x = 4; x < 92; x++) {
      const i = (y * 96 + x) * 4;
      colors.add(`${data[i] >> 3},${data[i + 1] >> 3},${data[i + 2] >> 3}`);
      if (data[i] > 245 && data[i + 1] > 245 && data[i + 2] > 245) white++;
      center++;
    }
    return { colors: colors.size, whiteFraction: white / center };
  }, bytes.toString('base64'));
  if (art) { assert.ok(pixels.colors > 90, `${name}: arena lacks scene color diversity ${JSON.stringify(pixels)}`); assert.ok(pixels.whiteFraction < 0.35, `${name}: arena is covered by white sprite placeholders`); }
  const digest = createHash('sha256').update(bytes).digest('hex');
  report.screenshots.push({ name, path: relative(root, path), pixels, sha256: digest });
  return digest;
}
async function hold(keys, milliseconds = 180) {
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  for (const key of [...keys].reverse()) await page.keyboard.up(key);
  await advance(4);
}
try {
  assert.ok(existsSync(join(site, 'index.html')), 'Build the real WebGPU probe export with npm run verify:web first.');
  await new Promise((done, reject) => { server.once('error', reject); server.listen(0, '127.0.0.1', done); });
  // Playwright's normal launch enables focus emulation: even inactive tabs appear
  // visible. Attach without defaults to our OWN isolated Chrome profile instead,
  // preserving real browser visibility/lifecycle behavior for this acceptance test.
  const chrome = process.env.CHROME_PATH ?? (process.platform === 'darwin'
    ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
    : process.platform === 'win32' ? `${process.env.PROGRAMFILES}/Google/Chrome/Application/chrome.exe` : '/usr/bin/google-chrome');
  assert.ok(existsSync(chrome), 'Install Google Chrome, or set CHROME_PATH to its executable.');
  mkdirSync(join(root, '.gameengine/browser-profiles'), { recursive: true });
  profile = mkdtempSync(join(root, '.gameengine/browser-profiles/smoke-'));
  chromeProcess = spawn(chrome, ['--remote-debugging-port=0', '--remote-debugging-address=127.0.0.1',
    `--user-data-dir=${profile}`, '--no-first-run', '--no-default-browser-check',
    '--enable-unsafe-webgpu', '--window-size=1152,750', '--disable-backgrounding-occluded-windows', 'about:blank'], { stdio: 'ignore' });
  const portFile = join(profile, 'DevToolsActivePort');
  for (let attempts = 0; !existsSync(portFile); attempts++) {
    if (attempts > 300 || chromeProcess.exitCode !== null) throw new Error('Isolated Chrome failed to expose its local debugging endpoint.');
    await new Promise(done => setTimeout(done, 100));
  }
  const chromePort = Number(readFileSync(portFile, 'utf8').split('\n')[0]);
  browser = await chromium.connectOverCDP(`http://127.0.0.1:${chromePort}`, { noDefaults: true });
  const context = browser.contexts()[0];
  page = context.pages()[0] ?? await context.newPage();
  await page.setViewportSize({ width: 1152, height: 672 });
  await page.bringToFront();
  page.on('pageerror', error => report.errors.push(error.message));
  page.on('console', message => {
    if (report.console.length < 250) report.console.push({ type: message.type(), text: message.text() });
    if (message.type() === 'error' || /validation error|\[Error\]|panicked|Aborted|device lost/i.test(message.text())) report.errors.push(message.text());
  });
  page.on('requestfailed', request => report.errors.push(`Request failed: ${request.url()} ${request.failure()?.errorText}`));
  cdp = await context.newCDPSession(page);
  await cdp.send('WebAudio.enable');
  cdp.on('WebAudio.contextCreated', ({ context: value }) => report.audio.push({ event: 'created', ...value }));
  cdp.on('WebAudio.contextChanged', ({ context: value }) => report.audio.push({ event: 'changed', ...value }));
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const adapter = await page.evaluate(async () => { const adapter = await navigator.gpu?.requestAdapter(); return adapter ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, device: adapter.info.device, description: adapter.info.description, fallback: adapter.info.isFallbackAdapter } : null; });
  assert.ok(adapter, 'Chrome could not obtain a WebGPU adapter.');
  assert.equal(adapter.fallback, false, 'Native GPU required; software WebGPU does not establish Metal rendering.');
  report.adapter = adapter;
  await page.locator('#start:enabled').waitFor({ timeout: 120000 });
  await page.locator('#start').click();
  await advance(90);
  await shot('01-ready'); // The title panel intentionally dims most arena pixels.
  check('native WebGPU startup', { adapter, state: await state() });
  await page.keyboard.press('Enter'); await advance(25);
  await shot('02-fight', { art: true });
  check('match starts and advances', await state());
  await hold(['d']); await hold(['ArrowLeft']);
  await hold(['w'], 70); await hold(['ArrowUp'], 70); await advance(60);
  await hold(['s'], 100); await hold(['ArrowDown'], 100);
  for (const key of ['f', 'g', 'h', 'v', 'b', 'n', 'j', 'k', 'l', 'u', 'i', 'o']) await hold([key], 65);
  await shot('03-two-player-controls', { art: true });
  check('both keyboard seats and six normals exercised', { player1: 'WASD / FGH / VBN', player2: 'arrows / JKL / UIO' });
  await page.keyboard.down('s'); await page.waitForTimeout(55); await page.keyboard.down('d'); await page.waitForTimeout(55); await page.keyboard.up('s'); await page.waitForTimeout(55); await page.keyboard.down('f'); await page.waitForTimeout(55); await page.keyboard.up('f'); await page.keyboard.up('d'); await advance(15);
  await shot('04-quarter-circle', { art: true });
  check('quarter-circle input sequence exercised', 'down, down-forward, forward + light punch');
  await page.keyboard.press('Escape'); await advance(5); await page.waitForTimeout(500);
  const paused = await shot('05-paused'); await page.waitForTimeout(250); const still = await shot('06-paused-still');
  assert.equal(still, paused, 'Paused scene or timer continued animating after transitions settled.');
  check('pause freezes visible fight', { screenshotHash: paused });
  await page.keyboard.press('Escape'); await advance(20); await shot('07-resumed', { art: true });
  check('resume restores advancing scene', await state());
  for (const [name, width, height] of [['compact', 800, 600], ['ultrawide', 1680, 720]]) {
    await page.setViewportSize({ width, height });
    await page.waitForFunction(({ width, height }) => { const c = document.querySelector('canvas'); return c.width === width && c.height === height; }, { width, height });
    await advance(8); await shot(`08-${name}`, { art: true });
    check(`resize ${name}`, { width, height });
  }
  await page.keyboard.down('d'); await page.waitForTimeout(100);
  await page.evaluate(() => document.querySelector('canvas').blur());
  await page.waitForTimeout(100); await page.keyboard.up('d');
  await page.locator('canvas').focus(); await advance(8);
  await shot('09-focus-reset', { art: true });
  check('held-key blur and refocus exercised', 'Canvas blur traversed browser reset-input path; no synthetic key state edits.');
  const other = await context.newPage(); await other.goto('about:blank'); await other.bringToFront();
  const hidden = await page.evaluate(() => document.hidden);
  assert.equal(hidden, true, 'Chrome failed to hide the real inactive game tab; focus emulation must remain disabled.');
  check('tab lifecycle method', 'Real inactive Chrome tab: native document.hidden=true, no visibility mocks.');
  await page.waitForTimeout(150);
  const held = await state(); await page.waitForTimeout(250); const afterHold = await state();
  assert.equal(afterHold.step, held.step, 'Simulation advanced while browser page was hidden/frozen.');
  assert.equal(afterHold.frames, held.frames, 'Renderer advanced while browser page was hidden/frozen.');
  await page.bringToFront(); await other.close(); await advance(15);
  await shot('10-lifecycle-resumed', { art: true });
  check('tab lifecycle suspend/resume', { hidden, held, resumed: await state() });
  const audioRunning = report.audio.some(value => value.contextType === 'realtime' && value.contextState === 'running');
  assert.ok(audioRunning, 'No running real-time WebAudio context observed after user startup and match audio.');
  check('browser audio unlocked', 'Chrome WebAudio reported a running realtime context; audible output still requires human playtest.');
  assert.equal(report.errors.length, 0, report.errors.join('\n'));
  check('console and WebGPU validation clean', { errors: 0 });
  report.ok = true;
} catch (error) {
  report.error = error.stack ?? String(error);
  process.exitCode = 1;
  console.error(report.error);
  await page?.screenshot({ path: join(out, 'failure.png'), timeout: 5000 }).catch(() => {});
} finally {
  report.finished = new Date().toISOString();
  writeFileSync(join(out, 'report.json'), JSON.stringify(report, null, 2) + '\n');
  await browser?.close();
  if (chromeProcess && chromeProcess.exitCode === null) {
    chromeProcess.kill('SIGTERM');
    await new Promise(done => { const timer = setTimeout(done, 2000); chromeProcess.once('exit', () => { clearTimeout(timer); done(); }); });
  }
  if (profile) rmSync(profile, { recursive: true, force: true });
  if (server.listening) await new Promise(done => server.close(done));
  console.log(`Browser evidence: ${join(out, 'report.json')}`);
}
