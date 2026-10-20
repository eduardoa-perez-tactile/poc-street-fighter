/** Deterministic frontend focus and navigation; views only render these models and raise intents. */
import { STAGES } from '../data/stages.ts';
import { defineSystem, write, type SystemContext } from '@gameengine/runtime';
import { MatchIntent, MatchState, MenuIntent, MenuState, type MatchStateViews, type MenuStateViews } from '../schema.gen.ts';

export const MENU_SCREEN = Object.freeze({ title: 0, main: 1, setup: 2, pause: 3, moves: 4, options: 5, results: 6 });
export const MENU_ACTION = Object.freeze({ confirm: 0, back: 1, up: 2, down: 3, left: 4, right: 5, select: 6, open: 7, music: 8, sfx: 9, browser: 10 });
const UP = 1, DOWN = 2, LEFT = 4, RIGHT = 8, CONFIRM = 16, BACK = 32;
const KEY_CODES = Object.freeze([23, 52, 19, 53, 1, 50, 4, 51, 38, 39]);
const PAD_CODES = Object.freeze([11, 12, 13, 14, 0, 1, 6]);
const ACTION_NAMES = Object.freeze(['menu.up', 'menu.down', 'menu.left', 'menu.right', 'menu.confirm', 'menu.back']);
function bit(value: number, index: number, down: boolean): number { return down ? value | 1 << index : value & ~(1 << index); }
function held(menu: MenuStateViews): number {
  const k = menu.keyboard[0]!, rawPad = menu.pad[0]!, rawAxis = menu.axis[0]!;
  const p = (rawPad & 127) | (rawPad >>> 8 & 127);
  let value = (rawAxis & 15) | (rawAxis >>> 8 & 15);
  if (k & 3 || p & 1) value |= UP;
  if (k & 12 || p & 2) value |= DOWN;
  if (k & 48 || p & 4) value |= LEFT;
  if (k & 192 || p & 8) value |= RIGHT;
  if (k & 256 || p & 80) value |= CONFIRM;
  if (k & 512 || p & 32) value |= BACK;
  return value | (k >>> 10 & 63);
}
export function menuItemCount(screen: number, mode: number, browser: boolean): number {
  return screen === 1 ? 4 : screen === 2 ? mode === 0 ? 6 : 5 : screen === 3 ? 5 : screen === 5 ? browser ? 5 : 3 : screen === 6 ? 2 : 1;
}
export function showMenu(menu: MenuStateViews, screen: number, cursor = 0): void {
  menu.screen[0] = screen; menu.cursor[0] = cursor; menu.repeat[0] = 0;
}
export function openOptions(menu: MenuStateViews, match: MatchStateViews): void {
  if (menu.screen[0] !== 5) { menu.returnScreen[0] = menu.screen[0]!; menu.returnCursor[0] = menu.cursor[0]!; }
  showMenu(menu, 5); match.settingsOpen[0] = 1;
}
export function closeOptions(menu: MenuStateViews, match: MatchStateViews): void {
  match.settingsOpen[0] = 0;
  const screen = match.phase[0] === 3 ? 3 : menu.returnScreen[0] === 0 ? 0 : 1;
  showMenu(menu, screen, menu.returnCursor[0]!);
}
function available(screen: number, phase: number): boolean {
  return screen <= 2 ? phase === 0 : screen === 3 || screen === 4 ? phase === 3 : screen === 5 ? phase === 0 || phase === 3 : screen === 6 && phase === 5;
}
function back(ctx: SystemContext, menu: MenuStateViews, match: MatchStateViews): void {
  const screen = menu.screen[0]!;
  if (screen === 5) closeOptions(menu, match);
  else if (screen === 1) showMenu(menu, 0);
  else if (screen === 2) showMenu(menu, 1, match.mode[0]!);
  else if (screen === 3) ctx.events.emit(MatchIntent, { action: 3 });
  else if (screen === 4) showMenu(menu, 3, 1);
  else if (screen === 6) { ctx.events.emit(MatchIntent, { action: 6 }); showMenu(menu, 1); }
}
function adjust(menu: MenuStateViews, match: MatchStateViews, direction: number): void {
  if (menu.screen[0] === 2) {
    const row = menu.cursor[0]!;
    if (row === 0 || row === 1) {
      match.p1Fighter[0] = 1 - match.p1Fighter[0]!; match.p2Fighter[0] = 1 - match.p1Fighter[0]!;
      menu.p1Ready[0] = 0; menu.p2Ready[0] = match.mode[0] === 1 ? 0 : 1;
    }
    else if (row === 2) match.stageId[0] = (match.stageId[0]! + direction + STAGES.length) % STAGES.length;
    else if (row === 3 && match.mode[0] === 0) match.difficulty[0] = (match.difficulty[0]! + direction + 3) % 3;
  }
  if (menu.screen[0] === 5) {
    const target = menu.cursor[0] === 0 ? menu.music : menu.cursor[0] === 1 ? menu.sfx : undefined;
    if (target) target[0] = Math.max(0, Math.min(100, target[0]! + direction * 10));
  }
}
function confirm(ctx: SystemContext, menu: MenuStateViews, match: MatchStateViews): void {
  const screen = menu.screen[0]!, cursor = menu.cursor[0]!;
  if (screen === 0) showMenu(menu, 1);
  else if (screen === 1) {
    if (cursor === 3) openOptions(menu, match);
    else { match.mode[0] = cursor; menu.p1Ready[0] = 0; menu.p2Ready[0] = cursor === 1 ? 0 : 1; showMenu(menu, 2); }
  } else if (screen === 2) {
    if (cursor === 0) { menu.p1Ready[0] = 1; menu.cursor[0] = match.mode[0] === 1 ? 1 : 2; }
    else if (cursor === 1) { menu.p2Ready[0] = 1; menu.cursor[0] = 2; }
    else if (cursor === 2 || (match.mode[0] === 0 && cursor === 3)) adjust(menu, match, 1);
    else if (cursor === (match.mode[0] === 0 ? 4 : 3)) {
      if (!menu.p1Ready[0]) menu.cursor[0] = 0;
      else if (!menu.p2Ready[0] && match.mode[0] === 1) menu.cursor[0] = 1;
      else ctx.events.emit(MatchIntent, { action: 0 });
    }
    else back(ctx, menu, match);
  } else if (screen === 3) {
    if (cursor === 0) ctx.events.emit(MatchIntent, { action: 3 });
    else if (cursor === 1) showMenu(menu, 4);
    else if (cursor === 2) openOptions(menu, match);
    else if (cursor === 3) ctx.events.emit(MatchIntent, { action: 5 });
    else { ctx.events.emit(MatchIntent, { action: 6 }); showMenu(menu, 1); }
  } else if (screen === 4) back(ctx, menu, match);
  else if (screen === 5) {
    if (cursor <= 1) adjust(menu, match, 1);
    else if (menu.browserAvailable[0] && (cursor === 2 || cursor === 3)) {
      menu.browserAction[0] = cursor - 2; menu.browserRequest[0] = menu.browserRequest[0]! + 1;
    } else back(ctx, menu, match);
  } else if (screen === 6) {
    if (cursor === 0) ctx.events.emit(MatchIntent, { action: 1 });
    else ctx.events.emit(MatchIntent, { action: 15 });
  }
}
function apply(ctx: SystemContext, menu: MenuStateViews, match: MatchStateViews, action: number, value = 0): void {
  // Recorded preference initialization is valid before the first frontend frame.
  if (action === 8 || action === 9) {
    (action === 8 ? menu.music : menu.sfx)[0] = Math.max(0, Math.min(100, value));
    if (menu.screen[0] === MENU_SCREEN.options) menu.cursor[0] = action === 8 ? 0 : 1;
    return;
  }
  if (action === 10) { menu.browserAvailable[0] = value > 0 ? 1 : 0; return; }
  if (action === 7) {
    if (available(value, match.phase[0]!)) {
      if (value === 5) openOptions(menu, match);
      else { match.settingsOpen[0] = 0; showMenu(menu, value); }
    }
    return;
  }
  if (!available(menu.screen[0]!, match.phase[0]!)) return;
  const count = menuItemCount(menu.screen[0]!, match.mode[0]!, menu.browserAvailable[0] !== 0);
  if (action === 11 && menu.screen[0] === 2) { menu.cursor[0] = value === 1 ? 1 : 0; adjust(menu, match, 1); }
  else if (action === 0) confirm(ctx, menu, match);
  else if (action === 1) back(ctx, menu, match);
  else if (action === 2 || action === 3) menu.cursor[0] = (menu.cursor[0]! + (action === 2 ? -1 : 1) + count) % count;
  else if (action === 4 || action === 5) adjust(menu, match, action === 4 ? -1 : 1);
  else if (action === 6 && value < count) { menu.cursor[0] = value; confirm(ctx, menu, match); }
}

export const MenuNavigation = defineSystem({
  name: 'MenuNavigation', stage: 'PostUpdate', resources: [write(MenuState), write(MatchState)], events: [MenuIntent],
  run(ctx) {
    const menu = ctx.resource(MenuState), match = ctx.resource(MatchState), phase = match.phase[0]!;
    const phaseChanged = menu.lastPhase[0] !== phase;
    menu.lastPhase[0] = phase;
    let revealed = false;
    if (phase === 3 && (phaseChanged || (menu.screen[0] !== 3 && menu.screen[0] !== 4 && menu.screen[0] !== 5))) { showMenu(menu, 3); revealed = true; }
    else if (phase === 5 && (phaseChanged || menu.screen[0] !== 6)) { showMenu(menu, 6); revealed = true; }
    else if (phase === 0 && menu.screen[0]! >= 3 && menu.screen[0] !== 5) showMenu(menu, 1);
    let edges = 0;
    for (const event of ctx.input) {
      const before = held(menu);
      if (event.type === 'key') {
        const index = KEY_CODES.indexOf(event.code); if (index >= 0) menu.keyboard[0] = bit(menu.keyboard[0]!, index, event.down);
      } else if (event.type === 'gamepadButton' && event.pad < 2) {
        const index = PAD_CODES.indexOf(event.button); if (index >= 0) menu.pad[0] = bit(menu.pad[0]!, index + event.pad * 8, event.down);
      } else if (event.type === 'gamepadAxis' && event.pad < 2 && event.axis < 2) {
        const negative = event.axis === 0 ? LEFT : UP, positive = event.axis === 0 ? RIGHT : DOWN;
        const shift = event.pad * 8;
        menu.axis[0] = (menu.axis[0]! & ~((negative | positive) << shift)) | ((event.value < -0.5 ? negative : event.value > 0.5 ? positive : 0) << shift);
      } else if (event.type === 'action') {
        const index = ACTION_NAMES.indexOf(event.name);
        if (index >= 0) menu.keyboard[0] = bit(menu.keyboard[0]!, 10 + index, event.value > 0);
        else if (event.name.startsWith('menu.open.') && event.value > 0) apply(ctx, menu, match, 7, Number(event.name.slice(10)));
      }
      edges |= held(menu) & ~before;
    }
    const down = held(menu), pressed = (down & ~menu.previous[0]!) | edges;
    menu.previous[0] = down;
    for (const event of ctx.events.read(MenuIntent)) {
      if (event.id <= menu.lastIntent[0]!) continue;
      menu.lastIntent[0] = event.id;
      if (event.action >= 8 || event.screen === menu.screen[0]) apply(ctx, menu, match, event.action, event.value);
    }
    if (revealed || !(phase === 0 || phase === 3 || phase === 5)) { menu.repeat[0] = 0; return; }
    const direction = down & 15;
    let repeat = false;
    if (direction === 0 || (pressed & 15) !== 0) menu.repeat[0] = 0;
    else { menu.repeat[0] = menu.repeat[0]! + 1; repeat = menu.repeat[0]! >= 15 && (menu.repeat[0]! - 15) % 6 === 0; }
    if (pressed & BACK) apply(ctx, menu, match, 1);
    else if (pressed & CONFIRM) apply(ctx, menu, match, 0);
    else {
      const navigate = (pressed & 15) | (repeat ? direction : 0);
      if (navigate & UP) apply(ctx, menu, match, 2);
      else if (navigate & DOWN) apply(ctx, menu, match, 3);
      else if (navigate & LEFT) apply(ctx, menu, match, 4);
      else if (navigate & RIGHT) apply(ctx, menu, match, 5);
    }
  },
});
