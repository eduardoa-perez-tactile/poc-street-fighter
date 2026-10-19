import test from 'node:test';
import assert from 'node:assert/strict';
import { DEFAULT_KEYS, GamepadBridge, sanitizeSettings } from '../web/controls.mjs';
const settings = () => sanitizeSettings(null);
const pad = (index, buttons = [], axes = [0, 0]) => ({ index, connected: true, mapping: 'standard', buttons: Array.from({ length: 17 }, (_, i) => ({ pressed: buttons.includes(i) })), axes });

test('standard browser controls produce SDL button events and release on disconnect', () => {
  const events = [], bridge = new GamepadBridge(event => events.push(event));
  bridge.poll([pad(0, [0, 4, 8, 9, 12])], settings());
  assert.deepEqual(events.filter(event => event[0] === 5).map(event => [event[5], event[7]]), [[0, 1], [9, 1], [4, 1], [6, 1], [11, 1]]);
  events.length = 0; bridge.poll([], settings());
  assert.deepEqual(events.map(event => event[7]), [0, 0, 0, 0, 0]);
});
test('axis deadzone, player seats and blur release use recorded input events', () => {
  const events = [], bridge = new GamepadBridge(event => events.push(event));
  bridge.poll([pad(4, [], [0.1, 0]), pad(8, [1], [-0.8, 0.7])], settings());
  assert.ok(events.some(event => event[0] === 5 && event[1] === 1 && event[5] === 1 && event[7] === 1));
  assert.deepEqual(events.filter(event => event[0] === 6).map(event => [event[1], event[3], event[5]]), [[1, -1, 0], [1, 1, 1]]);
  events.length = 0; bridge.poll([pad(4), pad(8, [1], [-0.8, 0.7])], settings(), false);
  assert.equal(events.filter(event => event[0] === 6 && event[3] === 0).length, 2);
});
test('controller remapping preserves attack meaning and emits edges only', () => {
  const events = [], bridge = new GamepadBridge(event => events.push(event)), custom = settings(); custom.buttons[0] = [5, 2, 4, 1, 3, 0];
  bridge.poll([pad(0, [5])], custom); bridge.poll([pad(0, [5])], custom);
  assert.equal(events.length, 1); assert.equal(events[0][5], 0);
});
test('untrusted persisted settings cannot assign duplicate or reserved keyboard bindings', () => {
  assert.deepEqual(sanitizeSettings({ keys: {} }).keys, DEFAULT_KEYS);
  assert.deepEqual(sanitizeSettings({ keys: [Array(11).fill('KeyA'), Array(11).fill('KeyB')] }).keys, DEFAULT_KEYS);
  const keys = DEFAULT_KEYS.map(row => [...row]); keys[0][0] = 'Escape';
  assert.deepEqual(sanitizeSettings({ keys }).keys, DEFAULT_KEYS);
  assert.equal(sanitizeSettings({ deadzone: 9 }).deadzone, 0.5);
});

test('controller seats stay stable when the first pad disconnects', () => {
  const events = [], bridge = new GamepadBridge(event => events.push(event));
  bridge.poll([pad(0), pad(1, [0])], settings()); events.length = 0;
  bridge.poll([pad(1, [0])], settings());
  assert.equal(bridge.slots[1], 1); assert.equal(bridge.slots[0], null);
  assert.equal(events.length, 0);
  bridge.poll([pad(1, [0]), pad(4, [2])], settings());
  assert.equal(bridge.slots[0], 4); assert.ok(events.some(event => event[1] === 0 && event[5] === 2 && event[7] === 1));
});
test('focus suspension emits neutral before rearming a physically held pad', () => {
  const events = [], bridge = new GamepadBridge(event => events.push(event));
  bridge.poll([pad(0, [0], [0.8, 0])], settings()); events.length = 0;
  bridge.suspend(); // No poll occurred while the real browser tab was hidden.
  bridge.poll([pad(0, [0], [0.8, 0])], settings());
  assert.ok(events.some(event => event[0] === 5 && event[7] === 0));
  assert.ok(events.some(event => event[0] === 6 && event[3] === 0));
  events.length = 0; bridge.poll([pad(0, [0], [0.8, 0])], settings());
  assert.ok(events.some(event => event[0] === 5 && event[7] === 1));
  assert.ok(events.some(event => event[0] === 6 && event[3] === 1));
});
test('throw keys are configurable and Back stays reserved for throw', () => {
  const defaults = settings(); assert.equal(defaults.keys[0][10], 'KeyR'); assert.equal(defaults.keys[1][10], 'KeyP');
  const custom = settings(); custom.buttons[0][0] = 8;
  assert.deepEqual(sanitizeSettings(custom).buttons[0], settings().buttons[0]);
});

test('configured stick deadzone determines the actual digital movement threshold', () => {
  const events = [], bridge = new GamepadBridge(event => events.push(event));
  bridge.poll([pad(0, [], [0.25, 0])], settings());
  assert.ok(events.some(event => event[0] === 6 && event[3] === 1));
  events.length = 0; const custom = settings(); custom.deadzone = 0.3;
  bridge.poll([pad(0, [], [0.25, 0])], custom);
  assert.ok(events.some(event => event[0] === 6 && event[3] === 0));
});
