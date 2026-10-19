/** Browser controls feed the engine's recorded input queue; no gameplay state lives here. */
export const SETTINGS_KEY = 'sf.browser.controls.v1';
export const DEFAULT_KEYS = Object.freeze([
  ['KeyA', 'KeyD', 'KeyW', 'KeyS', 'KeyF', 'KeyG', 'KeyH', 'KeyV', 'KeyB', 'KeyN', 'KeyR'],
  ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'KeyJ', 'KeyK', 'KeyL', 'KeyU', 'KeyI', 'KeyO', 'KeyP'],
]);
export const ACTION_NAMES = ['Left', 'Right', 'Jump', 'Crouch', 'Light punch', 'Medium punch', 'Heavy punch', 'Light kick', 'Medium kick', 'Heavy kick', 'Throw'];
export const DEFAULT_BUTTONS = [0, 2, 4, 1, 3, 5];
export function sanitizeSettings(raw) {
  const result = { keys: DEFAULT_KEYS.map(row => [...row]), buttons: [DEFAULT_BUTTONS.slice(), DEFAULT_BUTTONS.slice()], deadzone: 0.2 };
  if (!raw || typeof raw !== 'object') return result;
  const flat = Array.isArray(raw.keys) && raw.keys.length === 2 && raw.keys.every(row => Array.isArray(row) && row.length === 11) ? raw.keys.flat() : null;
  if (Array.isArray(flat) && flat.length === 22 && new Set(flat).size === 22 && flat.every(code => /^(Key[A-Z]|Digit[0-9]|Arrow(Left|Right|Up|Down)|Space|Shift(Left|Right)|Control(Left|Right))$/.test(code))) result.keys = raw.keys.map(row => [...row]);
  if (Array.isArray(raw.buttons) && raw.buttons.length === 2) for (let seat = 0; seat < 2; seat++) {
    const row = raw.buttons[seat];
    if (Array.isArray(row) && row.length === 6 && new Set(row).size === 6 && row.every(n => Number.isInteger(n) && n >= 0 && n <= 15 && n !== 8 && n !== 9 && (n < 12))) result.buttons[seat] = [...row];
  }
  if (Number.isFinite(raw.deadzone)) result.deadzone = Math.max(0.1, Math.min(0.5, raw.deadzone));
  return result;
}

/** Browser standard-map buttons are translated into the game's canonical six-button layout. */
export class GamepadBridge {
  constructor(send) { this.send = send; this.slots = [null, null]; this.releasePending = false; this.previous = [{ buttons: new Map(), axes: [0, 0] }, { buttons: new Map(), axes: [0, 0] }]; }
  suspend() { this.releasePending = true; }
  poll(pads, settings, enabled = true) {
    const available = Array.from(pads ?? []).filter(pad => pad?.connected && pad.mapping === 'standard').sort((a, b) => a.index - b.index);
    for (let seat = 0; seat < 2; seat++) if (!available.some(pad => pad.index === this.slots[seat])) this.slots[seat] = null;
    for (const pad of available) if (!this.slots.includes(pad.index)) { const free = this.slots.indexOf(null); if (free >= 0) this.slots[free] = pad.index; }
    enabled = enabled && !this.releasePending;
    this.releasePending = false;
    for (let seat = 0; seat < 2; seat++) {
      const pad = enabled ? available.find(pad => pad.index === this.slots[seat]) : null, previous = this.previous[seat], buttons = new Map();
      // Canonical button IDs follow native SDL3 numbering (A B X Y Back Guide Start L3 R3 LB RB D-pad).
      const canonicalAttacks = [0, 2, 9, 1, 3, 10];
      for (let attack = 0; attack < 6; attack++) buttons.set(canonicalAttacks[attack], !!pad?.buttons[settings.buttons[seat][attack]]?.pressed);
      for (const [physical, canonical] of [[8, 4], [9, 6], [12, 11], [13, 12], [14, 13], [15, 14]]) buttons.set(canonical, !!pad?.buttons[physical]?.pressed);
      for (const [button, down] of buttons) if (down !== (previous.buttons.get(button) ?? false)) this.send([5, seat, 0, 0, 0, button, null, Number(down), 0]);
      for (let axis = 0; axis < 2; axis++) {
        const raw = Math.max(-1, Math.min(1, Number(pad?.axes[axis]) || 0));
        const value = Math.abs(raw) <= settings.deadzone ? 0 : Math.sign(raw);
        if (value !== previous.axes[axis]) this.send([6, seat, 0, value, 0, axis, null, 0, 0]);
        previous.axes[axis] = value;
      }
      previous.buttons = buttons;
    }
    return this.slots.filter(slot => slot !== null).length;
  }
}

export function installControls(canvas, queue) {
  let settings;
  try { settings = sanitizeSettings(JSON.parse(localStorage.getItem(SETTINGS_KEY))); } catch { settings = sanitizeSettings(null); }
  const style = document.createElement('style');
  style.textContent = `@font-face{font-family:SFMenu;src:url('./PixelifySans-Bold.ttf')}#gameengine-canvas{height:100%}#sf-controls,#sf-fullscreen-sheet{width:min(760px,92vw);max-height:88vh;box-sizing:border-box;overflow:auto;border:3px solid #fff3b0;border-radius:0;background:#292cb4;color:#fff3b0;padding:24px;font:18px SFMenu,monospace;box-shadow:10px 10px 0 #100b2f}#sf-controls::backdrop,#sf-fullscreen-sheet::backdrop{background:#100b2fcc}#sf-controls h2,#sf-fullscreen-sheet h2{margin:0 0 12px;color:#ffd34d;font-size:32px}#sf-controls p,#sf-fullscreen-sheet p{line-height:1.4}#sf-controls .sf-maps{display:grid;grid-template-columns:1fr 1fr;gap:24px}#sf-controls label{display:flex;justify-content:space-between;align-items:center;gap:12px;margin:6px 0}#sf-controls button,#sf-controls select,#sf-fullscreen-sheet button{font:inherit;padding:6px 12px;background:#191267;color:#fff3b0;border:2px solid #fff3b0;border-radius:0}#sf-controls button:focus-visible,#sf-controls select:focus-visible,#sf-fullscreen-sheet button:focus-visible{outline:3px solid #f04b67;outline-offset:2px}#sf-controls .sf-actions{display:flex;gap:12px;margin-top:20px;position:sticky;bottom:-24px;padding:12px 0;background:#292cb4}#sf-controls [role=status]{min-height:24px;color:#ffd34d}#sf-fullscreen-sheet button{margin:8px}@media(max-width:600px){#sf-controls .sf-maps{grid-template-columns:1fr}#sf-controls,#sf-fullscreen-sheet{padding:16px}}`;
  document.head.append(style);
  const dialog = document.createElement('dialog'); dialog.id = 'sf-controls';
  dialog.innerHTML = '<h2>CONTROL CONFIG</h2><p>Select an action, then press its new key.</p><div class="sf-maps"></div><label>Stick deadzone<input id="sf-deadzone" aria-label="Stick deadzone" type="range" min="0.1" max="0.5" step="0.05"></label><p>Standard controllers: A/X/LB punches, B/Y/RB kicks, D-pad or left stick moves, START pauses, Back/Select throws. Controller seats stay assigned until unplugged.</p><div id="sf-remap-status" role="status" aria-live="polite"></div><div class="sf-actions"><button type="button" id="sf-reset-controls">RESET DEFAULTS</button><button type="button" id="sf-close-controls">DONE</button></div>';
  document.body.append(dialog);
  let pending, padCount = -1;
  const bridge = new GamepadBridge(event => queue.push(event));
  const status = dialog.querySelector('#sf-remap-status');
  function persist() { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch { status.textContent = 'Storage is unavailable; controls apply for this session.'; } }
  function render() {
    const maps = dialog.querySelector('.sf-maps'); maps.replaceChildren();
    for (let seat = 0; seat < 2; seat++) {
      const section = document.createElement('section'); const title = document.createElement('h3'); title.textContent = `PLAYER ${seat + 1}`; section.append(title);
      ACTION_NAMES.forEach((name, action) => {
        const label = document.createElement('label'); label.append(document.createTextNode(name));
        const button = document.createElement('button'); button.type = 'button'; button.textContent = settings.keys[seat][action].replace('Key', ''); button.setAttribute('aria-label', `P${seat + 1} ${name} key`);
        button.onclick = () => { pending = { seat, action }; status.textContent = `Press a key for P${seat + 1} ${name}. Escape cancels.`; }; label.append(button); section.append(label);
      });
      const titlePad = document.createElement('h4'); titlePad.textContent = 'Controller buttons'; section.append(titlePad);
      ACTION_NAMES.slice(4, 10).forEach((name, attack) => {
        const label = document.createElement('label'); label.append(document.createTextNode(name)); const select = document.createElement('select'); select.setAttribute('aria-label', `P${seat + 1} ${name} button`);
        for (const [value, name] of [[0,'A / Cross'],[1,'B / Circle'],[2,'X / Square'],[3,'Y / Triangle'],[4,'LB / L1'],[5,'RB / R1'],[6,'LT / L2'],[7,'RT / R2'],[10,'Left stick'],[11,'Right stick']]) { const option = document.createElement('option'); option.value = String(value); option.textContent = name; select.append(option); }
        select.value = String(settings.buttons[seat][attack]); select.onchange = () => { const next = Number(select.value), old = settings.buttons[seat][attack], duplicate = settings.buttons[seat].indexOf(next); if (duplicate >= 0) settings.buttons[seat][duplicate] = old; settings.buttons[seat][attack] = next; persist(); render(); }; label.append(select); section.append(label);
      }); maps.append(section);
    }
    dialog.querySelector('#sf-deadzone').value = String(settings.deadzone);
  }
  const wake = () => document.dispatchEvent(new Event('sf-controls-visibility'));
  const fullscreenSheet = document.createElement('dialog'); fullscreenSheet.id = 'sf-fullscreen-sheet';
  fullscreenSheet.innerHTML = '<h2>FULLSCREEN</h2><p>Use the full screen for your next fight.</p><button id="sf-fullscreen">ENTER FULLSCREEN</button><button id="sf-fullscreen-close">BACK</button><p id="sf-fullscreen-status" role="status"></p>';
  document.body.append(fullscreenSheet);
  const openControls = () => { if (dialog.open || fullscreenSheet.open) return; queue.reset(); dialog.showModal(); render(); wake(); };
  const openFullscreen = () => { if (dialog.open || fullscreenSheet.open) return; queue.reset(); fullscreenSheet.querySelector('#sf-fullscreen').textContent = document.fullscreenElement ? 'EXIT FULLSCREEN' : 'ENTER FULLSCREEN'; fullscreenSheet.showModal(); wake(); };
  Object.defineProperty(globalThis, '__sfBrowserOptions', { configurable: true, value: Object.freeze({ protocol: 1, controls: true, fullscreen: !!document.documentElement.requestFullscreen, get controllers() { return Math.max(0, padCount); } }) });
  window.addEventListener('message', event => {
    if (event.origin !== location.origin || !Array.from(document.querySelectorAll('iframe')).some(frame => frame.contentWindow === event.source)) return;
    if (event.data?.type !== 'sf-browser-options-v1') return;
    if (event.data.action === 'controls') openControls();
    else if (event.data.action === 'fullscreen' && document.documentElement.requestFullscreen) openFullscreen();
  });
  fullscreenSheet.querySelector('#sf-fullscreen-close').onclick = () => fullscreenSheet.close();
  fullscreenSheet.addEventListener('close', () => { canvas.focus(); wake(); });
  dialog.querySelector('#sf-close-controls').onclick = () => { dialog.close(); };
  dialog.addEventListener('close', () => { pending = undefined; canvas.focus(); wake(); });
  dialog.querySelector('#sf-reset-controls').onclick = () => { settings = sanitizeSettings(null); persist(); render(); status.textContent = 'Default controls restored.'; };
  dialog.querySelector('#sf-deadzone').oninput = event => { settings.deadzone = Number(event.target.value); persist(); };
  dialog.addEventListener('keydown', event => {
    if (!pending) return;
    event.preventDefault(); event.stopPropagation();
    if (event.code === 'Escape') { pending = undefined; status.textContent = 'Remap cancelled.'; return; }
    const candidate = sanitizeSettings({ ...settings, keys: settings.keys.map(row => [...row]) });
    const original = settings.keys[pending.seat][pending.action];
    for (let seat = 0; seat < 2; seat++) for (let action = 0; action < 11; action++) if (candidate.keys[seat][action] === event.code) candidate.keys[seat][action] = original;
    candidate.keys[pending.seat][pending.action] = event.code;
    const checked = sanitizeSettings(candidate);
    if (checked.keys[pending.seat][pending.action] !== event.code) { status.textContent = 'Choose a letter, arrow, digit, Shift, Control or Space.'; return; }
    settings = checked; pending = undefined; persist(); render(); status.textContent = 'Controls saved.';
  });
  const remapHeld = new Map();
  const remap = event => {
    if (dialog.open || event.repeat) return;
    let target = remapHeld.get(event.code);
    if (event.type === 'keydown') {
      for (let seat = 0; seat < 2; seat++) { const action = settings.keys[seat].indexOf(event.code); if (action >= 0) target = DEFAULT_KEYS[seat][action]; }
      // Unbound original keys must not retain their original actions after a remap.
      if (!target && DEFAULT_KEYS.flat().includes(event.code)) target = '';
      if (target !== undefined) remapHeld.set(event.code, target);
    } else remapHeld.delete(event.code);
    if (target === undefined) return;
    event.preventDefault(); event.stopImmediatePropagation();
    if (target) queue.push([3, 0, 0, 0, 0, 0, target, Number(event.type === 'keydown'), 0]);
  };
  canvas.addEventListener('keydown', remap, true); canvas.addEventListener('keyup', remap, true);
  canvas.addEventListener('blur', () => { remapHeld.clear(); bridge.suspend(); });
  window.addEventListener('blur', () => { remapHeld.clear(); queue.reset(); bridge.suspend(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) bridge.suspend(); });
  fullscreenSheet.querySelector('#sf-fullscreen').onclick = async () => {
    // Close the modal first: removing a top-layer dialog after entering
    // fullscreen can make Chrome immediately leave fullscreen again.
    fullscreenSheet.close();
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); canvas.focus(); }
    catch { fullscreenSheet.showModal(); fullscreenSheet.querySelector('#sf-fullscreen-status').textContent = 'Fullscreen is unavailable. Use BACK to return.'; wake(); }
  };
  return {
    hidden: () => document.hidden || dialog.open || fullscreenSheet.open,
    poll() {
      const count = bridge.poll(navigator.getGamepads?.() ?? [], settings, !dialog.open && !fullscreenSheet.open && !document.hidden && document.hasFocus() && document.activeElement === canvas);
      padCount = count;
    },
  };
}
