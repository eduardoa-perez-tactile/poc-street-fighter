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
async function clickCanvas(x, y) {
  const bounds = await page.locator('canvas').boundingBox();
  assert.ok(bounds, 'Game canvas is missing.');
  await page.mouse.click(bounds.x + bounds.width * x, bounds.y + bounds.height * y);
  await advance(4);
}
async function virtualPad(buttons = [], axes = [0, 0]) {
  await page.evaluate(({ buttons, axes }) => {
    globalThis.__sfVirtualPads = [{ index: 0, id: 'Automated standard controller', connected: true, mapping: 'standard', axes,
      buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: buttons.includes(i), touched: buttons.includes(i), value: Number(buttons.includes(i)) })) }];
  }, { buttons, axes });
}
async function padPulse(button, duration = 90) { await virtualPad([button]); await page.waitForTimeout(duration); await virtualPad([]); await advance(4); }
async function hold(keys, milliseconds = 180) {
  for (const key of keys) await page.keyboard.down(key);
  await page.waitForTimeout(milliseconds);
  for (const key of [...keys].reverse()) await page.keyboard.up(key);
  await advance(4);
}
try {
  assert.ok(existsSync(join(site, 'index.html')), 'Build the real WebGPU probe export with npm run verify:web first.');
  if (existsSync(join(site, 'playtest-build.json'))) report.build = JSON.parse(readFileSync(join(site, 'playtest-build.json'), 'utf8'));
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
  await page.addInitScript(() => {
    globalThis.__sfVirtualPads = [];
    Object.defineProperty(navigator, 'getGamepads', { configurable: true, value: () => globalThis.__sfVirtualPads });
  });
  report.controllerFixture = 'W3C standard virtual device through navigator.getGamepads; actual physical hardware remains a human playtest.';
  await page.goto(`http://127.0.0.1:${server.address().port}/`);
  const adapter = await page.evaluate(async () => { const adapter = await navigator.gpu?.requestAdapter(); return adapter ? { vendor: adapter.info.vendor, architecture: adapter.info.architecture, device: adapter.info.device, description: adapter.info.description, fallback: adapter.info.isFallbackAdapter } : null; });
  assert.ok(adapter, 'Chrome could not obtain a WebGPU adapter.');
  assert.equal(adapter.fallback, false, 'Native GPU required; software WebGPU does not establish Metal rendering.');
  report.adapter = adapter;
  await page.locator('#start:enabled').waitFor({ timeout: 120000 });
  assert.equal(await page.locator('#start').textContent(), 'ENTER THE ARENA');
  await shot('00-browser-launch');
  await page.locator('#start').click();
  await advance(90);
  await shot('01-ready'); // The title panel intentionally dims most arena pixels.
  check('native WebGPU startup', { adapter, state: await state() });
  assert.equal(await page.locator('#sf-tools').count(), 0, 'Permanent browser chrome must not shrink the playfield.');
  await page.evaluate(() => window.postMessage({ type: 'sf-browser-options-v1', action: 'controls' }, location.origin));
  await page.waitForTimeout(80);
  assert.equal(await page.locator('#sf-controls').evaluate(node => node.open), false, 'Parent-page spoof must fail iframe source validation.');
  await page.keyboard.press('Enter'); await advance(4); await shot('01-main-menu');
  for (let i = 0; i < 3; i++) { await page.keyboard.press('ArrowDown'); await advance(2); }
  await page.keyboard.press('Enter'); await advance(4); await shot('01-options-menu');
  for (let i = 0; i < 2; i++) { await page.keyboard.press('ArrowDown'); await advance(2); }
  await page.keyboard.press('Enter');
  await page.locator('#sf-controls[open]').waitFor();
  await page.waitForTimeout(200); const controlsHeld = await state(); await page.waitForTimeout(150);
  assert.equal((await state()).step, controlsHeld.step, 'The fight advanced behind the browser controls dialog.');
  await page.getByRole('button', { name: 'P1 Throw key', exact: true }).click(); await page.keyboard.press('t');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('sf.browser.controls.v1')));
  assert.equal(saved.keys[0][10], 'KeyT');
  await shot('01-browser-controls');
  await page.locator('#sf-reset-controls').click(); await page.locator('#sf-close-controls').click(); await advance(4);
  check('persistent remapping and controls-dialog suspension', { throwRemapped: saved.keys[0][10] });
  await page.keyboard.press('ArrowDown'); await advance(2); await page.keyboard.press('Enter');
  await page.locator('#sf-fullscreen-sheet[open]').waitFor();
  // A manually attached macOS Chrome can immediately leave fullscreen without
  // a focused browser window. Use the standard automation focus override only
  // for this API check, then restore native visibility before lifecycle tests.
  await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: true });
  try {
    await page.locator('#sf-fullscreen').click();
    await page.waitForFunction(() => !!document.fullscreenElement);
    await page.waitForTimeout(500);
    assert.equal(await page.evaluate(() => !!document.fullscreenElement), true, 'Fullscreen exited before the persistence check.');
    await advance(4); await page.evaluate(() => document.exitFullscreen());
    assert.equal(await page.evaluate(() => !!document.fullscreenElement), false);
  } finally { await cdp.send('Emulation.setFocusEmulationEnabled', { enabled: false }); }
  await advance(4);
  await page.setViewportSize({ width: 1152, height: 672 });
  check('browser fullscreen enters and exits', { persistedMilliseconds: 500, focus: 'Standard CDP focus during this check only; native visibility restored afterward.' });
  await page.keyboard.press('Escape'); await advance(4); // Options -> Main, focus OPTIONS.
  await virtualPad(); await padPulse(12); await padPulse(12); // D-pad UP twice -> LOCAL.
  await padPulse(0); await shot('01-local-setup');
  // Skip character and stage confirmations: Fight accepts the displayed selections.
  for (let row = 0; row < 3; row++) await padPulse(13);
  await padPulse(9); await advance(8); await shot('01-versus');
  await advance(200);
  await shot('02-fight', { art: true });
  assert.equal(await page.evaluate(() => globalThis.__sfBrowserOptions.controllers), 1);
  check('Fight starts local match without character or stage confirmation', await state());
  await virtualPad([], [0.25, 0]); await advance(8); await virtualPad(); await advance(4);
  await padPulse(14); await padPulse(0); await padPulse(8);
  check('controller stick, D-pad, attack and throw input exercised', 'Real browser queue receives canonical SDL button/axis events from the virtual W3C device.');
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
    await page.waitForFunction(({ width, height }) => { const c = document.querySelector('canvas'); const rect = c.getBoundingClientRect(); return c.width === Math.round(rect.width) && c.height === Math.round(rect.height) && rect.width === width; }, { width, height });
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
  // Play a complete local first-to-two match through the browser input path.
  // P2 remains neutral; P1 walks into range and pulses heavy punch after recovery.
  await virtualPad([], [1, 0]); await page.waitForTimeout(700);
  for (let attack = 0; attack < 42; attack++) {
    await virtualPad([4], [1, 0]); await page.waitForTimeout(90);
    // Keep the physical stick held across automatic round transitions. A reset
    // must preserve source input, rather than require the player to wiggle it.
    await virtualPad([], [1, 0]); await page.waitForTimeout(740);
  }
  await virtualPad(); await advance(8);
  await shot('11-first-to-two-result');
  await padPulse(9); await advance(135);
  await shot('12-controller-rematch', { art: true });
  check('first-to-two local match and controller rematch exercised', 'Forty-two recovered heavy punches against neutral P2 with the stick continuously held across round resets, then actual controller START; result/rematch screenshots require visual verification.');
  await page.setViewportSize({ width: 1152, height: 672 }); await advance(5);
  await page.keyboard.press('Escape'); await advance(4);
  for (let i = 0; i < 4; i++) { await page.keyboard.press('ArrowDown'); await advance(2); }
  await page.keyboard.press('Enter'); await advance(5); await shot('11-return-main');
  for (let i = 0; i < 2; i++) { await page.keyboard.press('ArrowDown'); await advance(2); }
  await page.keyboard.press('Enter'); await advance(4); await shot('12-training-setup');
  for (let row = 0; row < 3; row++) { await page.keyboard.press('ArrowDown'); await advance(2); }
  await page.keyboard.press('Enter'); await advance(12);
  await shot('12-training', { art: true });
  await clickCanvas(0.908, 0.951); await shot('12-training-collision-boxes', { art: true });
  await clickCanvas(0.630, 0.951);
  await hold(['d'], 350); await hold(['s', 'n'], 100); await advance(55);
  await shot('13-training-attack', { art: true });
  await clickCanvas(0.771, 0.951); await clickCanvas(0.908, 0.951);
  check('Fight starts training without character or stage confirmation or round intro', await state());
  await page.keyboard.press('Escape'); await advance(4); await shot('13-pause-menu');
  await page.keyboard.press('ArrowDown'); await advance(2); await page.keyboard.press('Enter'); await advance(4);
  await shot('13-move-list'); await page.keyboard.press('Escape'); await advance(4);
  await page.keyboard.press('ArrowDown'); await advance(2); await page.keyboard.press('Enter'); await advance(4);
  const audioBefore = await shot('15-audio-settings');
  await page.keyboard.press('ArrowLeft'); await advance(3); await page.keyboard.press('ArrowDown'); await advance(2); await page.keyboard.press('ArrowLeft'); await advance(3);
  const audioChanged = await shot('16-audio-adjusted');
  assert.notEqual(audioChanged, audioBefore, 'Audio settings controls produced no visible change.');
  await page.keyboard.press('ArrowRight'); await advance(3); await page.keyboard.press('ArrowUp'); await advance(2); await page.keyboard.press('ArrowRight'); await advance(3);
  await page.keyboard.press('Escape'); await advance(4); // Options -> Pause, cursor OPTIONS.
  await page.keyboard.press('ArrowDown'); await advance(2); await page.keyboard.press('ArrowDown'); await advance(2);
  await page.keyboard.press('Enter'); await advance(5); // Main menu, cursor SOLO.
  await page.keyboard.press('Enter'); await advance(4); await shot('14-solo-setup');
  for (let row = 0; row < 3; row++) { await page.keyboard.press('ArrowDown'); await advance(2); } // Difficulty.
  await page.keyboard.press('ArrowRight'); await advance(2);
  await page.keyboard.press('ArrowDown'); await advance(2); // Difficulty -> Fight.
  await page.keyboard.press('Enter'); await advance(440); await shot('14-solo-cpu', { art: true });
  check('Fight starts solo without character or stage confirmation', 'Only difficulty changed; Enter on Fight starts the match, followed by five seconds of autonomous CPU.');
  check('pause, move list and options navigation', 'Actual keyboard routes through pause/moves/options/back/main; audio levels changed and restored.');
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
