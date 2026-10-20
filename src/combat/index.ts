/** Fixed-step fighting simulation. Coordinates retain the reference's pixel, y-down convention. */
import { defineSystem, query, read, write, type EntityId, type SystemContext } from '@gameengine/runtime';
import { CombatEffect, CombatInput, Fighter, MatchIntent, MatchState, Projectile, type FighterValue, type ProjectileValue, type CombatInputViews, type MatchStateViews } from '../schema.gen.ts';
import { FIGHTERS } from '../data/fighters.ts';
import { AIR_ATTACK, BLOCK_HIGH, BLOCK_LOW, CROUCH_ATTACK, DRAGON, HURRICANE, KNOCKDOWN, THROW, THROW_TECH, WAKEUP, extendedDuration, extendedFrame, isAirAttack, isCrouchAttack, motionMatches, moveForState, type AirPoseContext } from './moves.ts';
import type { Box, FighterDefinition, FighterFrame } from '../data/fighter-types.ts';

export const STATE_NAMES = Object.freeze([
  'idle', 'walk-forwards', 'walk-backwards', 'jump-start', 'jump-up', 'jump-forwards',
  'jump-backwards', 'jump-land', 'crouch', 'crouch-down', 'crouch-up', 'idle-turn',
  'crouch-turn', 'light-punch', 'medium-punch', 'heavy-punch', 'light-kick', 'medium-kick',
  'heavy-kick', 'hurt-head-light', 'hurt-head-medium', 'hurt-head-heavy', 'hurt-body-light',
  'hurt-body-medium', 'hurt-body-heavy', 'special-1', 'winner-pose',
  'block-high', 'block-low', 'crouch-light-punch', 'crouch-medium-punch', 'crouch-heavy-punch',
  'crouch-light-kick', 'crouch-medium-kick', 'crouch-heavy-kick', 'air-light-punch', 'air-medium-punch',
  'air-heavy-punch', 'air-light-kick', 'air-medium-kick', 'air-heavy-kick', 'throw', 'knockdown',
  'wakeup', 'dragon-punch', 'hurricane', 'throw-tech',
] as const);
const IDLE = 0, FORWARD = 1, BACK = 2, JUMP_START = 3, JUMP_UP = 4, JUMP_FORWARD = 5,
  JUMP_BACK = 6, LAND = 7, CROUCH = 8, DOWN = 9, UP = 10, TURN = 11, CROUCH_TURN = 12,
  FIRST_ATTACK = 13, LAST_ATTACK = 18, HURT = 19, SPECIAL = 25;
const LEFT = 1, RIGHT = 2, JUMP = 4, DUCK = 8;
const ACTIONS = Object.freeze(['left', 'right', 'up', 'down', 'lp', 'mp', 'hp', 'lk', 'mk', 'hk', 'throw']);
const KEYS = Object.freeze([[1, 4, 23, 19, 6, 7, 8, 22, 2, 14, 18], [50, 51, 52, 53, 10, 11, 12, 21, 9, 15, 16]]);
const DAMAGE = Object.freeze([12, 20, 28]);
const SCORE = Object.freeze([100, 300, 500]);
const SPEED = Object.freeze([150, 220, 300]);

/** Every collision box and the rendered sprite select this same animation entry. */
export function animationEntry(def: FighterDefinition, state: number, frame: number): number {
  const animation = def.animations[STATE_NAMES[state]!] ?? def.animations.idle!;
  let remaining = frame;
  for (let i = 0; i < animation.length; i++) {
    const delay = animation[i]![1];
    if (delay <= 0 || remaining < delay) return i;
    remaining -= delay;
  }
  return animation.length - 1;
}
export function frameForFighter(def: FighterDefinition, state: number, frame: number, context?: AirPoseContext): FighterFrame {
  const extra = extendedFrame(def, state, frame, context);
  if (extra) return extra;
  const animation = def.animations[STATE_NAMES[state]!] ?? def.animations.idle!;
  return def.frames[animation[animationEntry(def, state, frame)]![0]]!;
}
/** Live fighters provide jump context to both drawing and collision selection. */
export function fighterFrame(f: Pick<FighterValue, 'fighterId' | 'state' | 'frame' | 'airState'>): FighterFrame {
  return frameForFighter(FIGHTERS[f.fighterId]!, f.state, f.frame, f);
}
function duration(def: FighterDefinition, state: number): number {
  const extra = extendedDuration(state);
  if (extra !== undefined) return extra;
  let result = 0;
  for (const [, delay] of def.animations[STATE_NAMES[state]!]!) if (delay > 0) result += delay;
  return result;
}
function looping(state: number): boolean { return state <= BACK; }
function change(f: FighterValue, state: number): void {
  if (f.state === state) return;
  f.state = state; f.frame = 0; f.age = 0; f.attackHit = false; f.projectileFired = false;
}
function makeFighter(player: number, fighterId = player): FighterValue {
  return { player, fighterId, x: player === 0 ? 296 : 472, y: 216, vx: 0, vy: 0,
    facing: player === 0 ? 1 : -1, state: IDLE, frame: 0, age: 0,
    attackHit: false, strength: 0, projectileFired: false, jumpDirection: 0, stun: 0, invulnerable: 0, airState: JUMP_UP, throwCooldown: 0, comboHits: 0 };
}
export function actualBox(box: Box, x: number, y: number, facing: number): Box {
  return [x + (facing === 1 ? box[0] : -box[0] - box[2]), y + box[1], box[2], box[3]];
}
export function overlaps(a: Box, b: Box): boolean {
  return a[2] > 0 && a[3] > 0 && b[2] > 0 && b[3] > 0 &&
    a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
}
function hitRegion(hit: Box, target: FighterValue): number {
  if (target.invulnerable > 0 || target.state === KNOCKDOWN) return -1;
  const hurt = fighterFrame(target).hurt;
  // Inspect every hurt box; a missed head does not skip a valid body/feet contact.
  for (let i = 0; i < hurt.length; i++) if (overlaps(hit, actualBox(hurt[i]!, target.x, target.y, target.facing))) return i;
  return -1;
}
function canAct(state: number): boolean { return state <= BACK; }
function setBit(value: number, bit: number, down: boolean): number { return down ? value | bit : value & ~bit; }

export const CombatSetup = defineSystem({
  name: 'CombatSetup', resources: [write(MatchState)],
  runIf: { resource: MatchState, field: 'initialized', value: false },
  run(ctx) {
    ctx.commands.spawn({ Fighter: { ...makeFighter(0) } });
    ctx.commands.spawn({ Fighter: { ...makeFighter(1) } });
    ctx.setField(MatchState, 'initialized', true);
  },
});

export const CombatControls = defineSystem({
  name: 'CombatControls', after: ['CombatSetup'],
  resources: [write(CombatInput), write(MatchState)],
  run(ctx) {
    const controls = ctx.resource(CombatInput), match = ctx.resource(MatchState);
    let intent = -1;
    for (const event of ctx.input) {
      if (event.type === 'key') {
        for (let p = 0; p < 2; p++) {
          const key = KEYS[p]!.indexOf(event.code);
          if (key !== -1) controls.keyboard[p] = setBit(controls.keyboard[p]!, 1 << key, event.down);
        }
        if (event.code === 38 || event.code === 39) {
          const bit = event.code === 38 ? 1 : 2;
          if (event.down && (match.intentKeys[0]! & bit) === 0 && (match.phase[0] === 1 || match.phase[0] === 4 || match.phase[0] === 6) && event.code === 39) intent = 2;
          match.intentKeys[0] = setBit(match.intentKeys[0]!, bit, event.down);
        }
      } else if (event.type === 'action') {
        if (event.name === 'start' && event.value > 0) intent = match.settingsOpen[0] ? -1 : match.phase[0] === 5 ? 1 : 0;
        else if (event.name === 'pause' && event.value > 0) intent = match.settingsOpen[0] ? 14 : match.phase[0] === 3 ? 3 : 2;
        else for (let p = 0; p < 2; p++) {
          const prefix = `p${p + 1}.`;
          if (event.name.startsWith(prefix)) {
            const action = ACTIONS.indexOf(event.name.slice(prefix.length));
            if (action !== -1) controls.actions[p] = setBit(controls.actions[p]!, 1 << action, event.value > 0);
          }
        }
      } else if (event.type === 'gamepadButton' && event.pad < 2) {
        const map = [4, 7, 5, 8, 10, -1, -1, -1, -1, 6, 9, 2, 3, 0, 1];
        const button = map[event.button] ?? -1;
        if (button >= 0) controls.pad[event.pad] = setBit(controls.pad[event.pad]!, 1 << button, event.down);
        if (event.button === 6 && event.down && (match.phase[0] === 1 || match.phase[0] === 4 || match.phase[0] === 6)) intent = 2;
      } else if (event.type === 'gamepadAxis' && event.pad < 2 && event.axis < 2) {
        const negative = event.axis === 0 ? LEFT : JUMP, positive = event.axis === 0 ? RIGHT : DUCK;
        controls.axis[event.pad] = setBit(setBit(controls.axis[event.pad]!, negative, event.value < -0.35), positive, event.value > 0.35);
      }
    }
    if (intent >= 0) ctx.events.emit(MatchIntent, { action: intent });
    for (let p = 0; p < 2; p++) {
      const held = controls.keyboard[p]! | controls.pad[p]! | controls.axis[p]! | controls.actions[p]!;
      controls.held[p] = held;
      controls.pressed[p] = held & ~controls.previous[p]!;
      controls.previous[p] = held;
    }
  },
});

type Contact = { attack: number; height: 'mid' | 'low' | 'high'; knockdown: boolean; thrown: boolean; direction: number; blocked: boolean; target: number; source: number; strength: number; region: number; x: number; y: number };
function canGuard(f: FighterValue, held: number, height: 'mid' | 'low' | 'high'): boolean {
  if (f.y < 216 || f.invulnerable > 0 || !(canAct(f.state) || f.state === CROUCH || f.state === DOWN || f.state === UP || f.state === TURN || f.state === CROUCH_TURN || f.state === BLOCK_HIGH || f.state === BLOCK_LOW)) return false;
  const horizontal = ((held & RIGHT) !== 0 ? 1 : 0) - ((held & LEFT) !== 0 ? 1 : 0);
  if (horizontal * f.facing >= 0) return false;
  const low = (held & DUCK) !== 0;
  return height === 'mid' || (height === 'low' ? low : !low);
}
function recordCommands(controls: CombatInputViews, fighters: readonly FighterValue[], step: number): void {
  for (let p = 0; p < 2; p++) {
    const pressed = controls.pressed[p]! & 2032;
    if (pressed) { controls.buffered[p] = pressed; controls.bufferAge[p] = 0; }
    else if (controls.buffered[p]! > 0) {
      controls.bufferAge[p] = controls.bufferAge[p]! + 1;
      if (controls.bufferAge[p]! >= 5) controls.buffered[p] = 0;
    }
    const held = controls.held[p]!, facing = fighters[p]!.facing;
    const relative = (((held & RIGHT) !== 0 ? 1 : 0) - ((held & LEFT) !== 0 ? 1 : 0)) * facing;
    const direction = (held & DUCK) !== 0 ? (relative > 0 ? 3 : relative < 0 ? 1 : 2) : (held & JUMP) !== 0 ? (relative > 0 ? 9 : relative < 0 ? 7 : 8) : relative > 0 ? 6 : relative < 0 ? 4 : 5;
    if (direction !== controls.direction[p]) {
      let count = controls.historyCount[p]!;
      if (count === 8) {
        for (let i = 0; i < 7; i++) { controls.history[p * 8 + i] = controls.history[p * 8 + i + 1]!; controls.historyStep[p * 8 + i] = controls.historyStep[p * 8 + i + 1]!; }
        count = 7;
      }
      controls.history[p * 8 + count] = direction; controls.historyStep[p * 8 + count] = step;
      controls.historyCount[p] = count + 1; controls.direction[p] = direction;
    }
  }
}
function hasMotion(controls: CombatInputViews, player: number, sequence: readonly number[], step: number): boolean {
  const base = player * 8;
  return motionMatches(Array.from(controls.history.subarray(base, base + 8)), Array.from(controls.historyStep.subarray(base, base + 8)), controls.historyCount[player]!, sequence, step);
}
function applyContact(ctx: SystemContext, match: MatchStateViews, target: FighterValue, hit: Contact): void {
  const hp = target.player === 0 ? match.p1Health : match.p2Health;
  if (hit.blocked) {
    target.comboHits = 0;
    change(target, (ctx.resource(CombatInput).held[target.player]! & DUCK) !== 0 ? BLOCK_LOW : BLOCK_HIGH);
    target.stun = 10 + hit.strength * 4; target.vx = hit.direction * 110; target.vy = 0;
    match.hitStop[0] = Math.max(match.hitStop[0]!, 8);
    ctx.events.emit(CombatEffect, { step: ctx.step, attack: hit.attack, kind: 6, player: target.player, strength: hit.strength, x: hit.x, y: hit.y });
    return;
  }
  target.comboHits = (target.stun > 0 && target.state >= HURT && target.state < SPECIAL ? target.comboHits : 0) + 1;
  const damage = hit.thrown ? 24 : DAMAGE[hit.strength]!;
  hp[0] = Math.max(0, hp[0]! - damage);
  const score = hit.source === 0 ? match.p1Score : match.p2Score;
  score[0] = score[0]! + (hit.thrown ? 300 : SCORE[hit.strength]!);
  // Grounded hits stagger; sweeps, throws, air hits and lethal blows launch a fall.
  const knockdown = hit.knockdown || target.y < 216 || hp[0] === 0;
  change(target, knockdown ? KNOCKDOWN : HURT + (hit.region === 0 ? 0 : 3) + hit.strength);
  target.frame = knockdown ? 0 : 15;
  target.stun = knockdown ? 57 : duration(FIGHTERS[target.fighterId]!, target.state) - 15;
  target.strength = hit.strength; target.vx = hit.direction * (hit.thrown ? 220 : [1000 / 6, 200, 800 / 3][hit.strength]!);
  target.vy = knockdown ? (hit.thrown ? -300 : hit.knockdown ? -240 : -280) : 0;
  target.throwCooldown = 65;
  match.hitStop[0] = 15;
  ctx.events.emit(CombatEffect, { step: ctx.step, attack: hit.attack, kind: hit.thrown ? 7 : 1, player: target.player, strength: hit.strength, x: hit.x, y: hit.y });
}

/** Move the simulated feet, so sprites, shadows and every collision box share the arc. */
function advanceFlight(f: FighterValue, def: FighterDefinition, launched = false): boolean {
  // f32 storage can round a descending foot to the floor one step before crossing it.
  if (f.y >= 216 && f.vy >= 0) { f.y = 216; f.vy = 0; return true; }
  if (!launched) f.vy += def.gravity / 60;
  f.y += f.vy / 60;
  if (f.y < 216) return false;
  f.y = 216; f.vy = 0;
  return true;
}
function fallFrame(f: FighterValue): void {
  // age remains the recovery clock; never draw the prone pose before the feet land.
  f.frame = f.y < 216 || f.vy < 0 ? Math.min(f.age, 17) : Math.min(f.age, 44);
}

export const CombatRound = defineSystem({
  name: 'CombatRound', after: ['MatchCommands'], queries: { fighters: query(write(Fighter)), shots: query(read(Projectile)) },
  resources: [write(MatchState), write(CombatInput)],
  run(ctx, q) {
    const match = ctx.resource(MatchState), controls = ctx.resource(CombatInput);
    const activeShots = [false, false];
    for (const c of q.shots.chunks()) for (let i = 0; i < c.length; i++) if (c.col(Projectile).state[i] === 0) activeShots[c.col(Projectile).player[i]!] = true;
    const fighters: FighterValue[] = [];
    for (const c of q.fighters.chunks()) for (let i = 0; i < c.length; i++) { const f = c.get(Fighter, i); fighters[f.player] = f; }
    if (!fighters[0] || !fighters[1]) return;
    const reset = match.resetStep[0] === ctx.step;
    if (reset) for (let p = 0; p < 2; p++) fighters[p] = makeFighter(p, p === 0 ? match.p1Fighter[0]! : match.p2Fighter[0]!);
    const persist = () => { for (const c of q.fighters.chunks()) for (let i = 0; i < c.length; i++) c.set(Fighter, i, fighters[c.col(Fighter).player[i]!]!); };
    // A reset places the fighters exactly once; retained physical inputs resume next tick.
    if (reset) { persist(); return; }
    if (match.phase[0] === 1) recordCommands(controls, fighters, ctx.step);
    if (match.phase[0] !== 1 || match.hitStop[0]! > 0) {
      if (match.phase[0] === 2 || match.phase[0] === 5) {
        // A lethal contact keeps its impact freeze and ballistic fall in the result phase.
        if (match.hitStop[0]! > 0) {
          match.freezeStep[0] = ctx.step; match.hitStop[0] = match.hitStop[0]! - 1; return;
        }
        for (const f of fighters) {
          const health = f.player === 0 ? match.p1Health[0]! : match.p2Health[0]!;
          if (health === 0) {
            // KO owns the fall for the entire result; it never enters the normal wakeup path.
            change(f, KNOCKDOWN); f.age++;
            advanceFlight(f, FIGHTERS[f.fighterId]!);
            f.x = Math.max(24, Math.min(744, f.x + f.vx / 60));
            if (f.y === 216 && f.vy === 0) f.vx = 0;
            fallFrame(f);
          } else if (match.winner[0] === f.player) {
            const opponentHealth = f.player === 0 ? match.p2Health[0]! : match.p1Health[0]!;
            if (opponentHealth === 0 && (f.y < 216 || f.vy !== 0)) {
              // A winning airborne special finishes its flight before the victory pose.
              f.frame++; f.age++; advanceFlight(f, FIGHTERS[f.fighterId]!);
              if (f.state === KNOCKDOWN) fallFrame(f);
              if (f.state === HURRICANE && f.frame >= 32) f.vx = 0;
              f.x = Math.max(24, Math.min(744, f.x + f.vx / 60));
              if (f.y < 216) continue;
            }
            f.x = Math.max(24, Math.min(744, f.x)); f.y = 216; f.vx = 0; f.vy = 0;
            change(f, 26);
            f.frame = Math.min(duration(FIGHTERS[f.fighterId]!, 26), f.frame + 1);
          } else {
            // A timeout does not leave the non-winner hanging in a jump or attack pose.
            f.x = Math.max(24, Math.min(744, f.x)); f.y = 216; f.vx = 0; f.vy = 0;
            change(f, IDLE); f.frame = 0;
          }
        }
      }
      if (match.phase[0] === 1 && match.hitStop[0]! > 0) {
        match.freezeStep[0] = ctx.step; match.hitStop[0] = match.hitStop[0]! - 1;
        match.remaining[0] = Math.max(0, match.remaining[0]! - 1); finishMatch(ctx, match);
      }
      if (reset || match.phase[0] === 2 || match.phase[0] === 5) persist();
      return;
    }
    for (const f of fighters) {
      const def = FIGHTERS[f.fighterId]!, held = controls.held[f.player]!, opponent = fighters[1 - f.player]!;
      if (!reset) {
        f.frame++; f.age++;
        f.invulnerable = Math.max(0, f.invulnerable - 1); f.throwCooldown = Math.max(0, f.throwCooldown - 1); f.stun = Math.max(0, f.stun - 1);
        const end = duration(def, f.state);
        if ((f.state === BLOCK_HIGH || f.state === BLOCK_LOW) && f.stun === 0) { f.vx = 0; change(f, (held & DUCK) !== 0 ? CROUCH : IDLE); }
        else if (f.state === KNOCKDOWN && f.age >= end && f.y === 216 && f.vy === 0) { change(f, WAKEUP); f.invulnerable = 12; f.vx = 0; }
        // An air normal ends in its recovered aerial pose until landing. Resuming
        // the somersault here would snap the body upside down and allow a second normal.
        else if (isAirAttack(f.state)) f.frame = Math.min(f.frame, end);
        else if (looping(f.state) && f.frame >= end) f.frame = 0;
        else if (end === 0) f.frame = 0;
        else if (f.frame >= end && f.state !== KNOCKDOWN && !((f.state === DRAGON || f.state === HURRICANE) && (f.y < 216 || f.vy < 0)) && f.state !== CROUCH && f.state !== JUMP_START && !(f.state >= JUMP_UP && f.state <= JUMP_BACK)) {
          change(f, f.state === DOWN || f.state === CROUCH_TURN ? CROUCH : IDLE);
          f.stun = 0;
        }
      }
      const horizontal = ((held & RIGHT) !== 0 ? 1 : 0) - ((held & LEFT) !== 0 ? 1 : 0), forward = horizontal * f.facing;
      const landingReady = f.state === LAND && f.frame >= 2;
      const groundedAct = f.y === 216 && f.vy === 0 && (canAct(f.state) || f.state === CROUCH || f.state === DOWN || f.state === UP || f.state === TURN || f.state === CROUCH_TURN || landingReady);
      const airAct = f.state >= JUMP_UP && f.state <= JUMP_BACK;
      const buffered = controls.buffered[f.player]!;
      let button = -1;
      for (let i = 0; i < 6; i++) if ((buffered & (16 << i)) !== 0) { button = i; break; }
      let started = false;
      if ((groundedAct || (f.state >= FIRST_ATTACK && f.state <= FIRST_ATTACK + 2)) && f.stun === 0 && button >= 0) {
        const dp = button < 3 && hasMotion(controls, f.player, [6, 2, 3], ctx.step);
        const fireball = button < 3 && !activeShots[f.player] && hasMotion(controls, f.player, [2, 3, 6], ctx.step);
        const hurricane = button >= 3 && hasMotion(controls, f.player, [2, 1, 4], ctx.step);
        const special = dp ? DRAGON : fireball ? SPECIAL : hurricane ? HURRICANE : -1;
        if (special >= 0) {
          change(f, special); f.strength = button % 3; f.vx = 0;
          if (dp) f.invulnerable = 6;
          controls.historyCount[f.player] = 0;
          ctx.events.emit(CombatEffect, { step: ctx.step, attack: hurricane ? 1 : 0, kind: dp ? 8 : hurricane ? 9 : 2, player: f.player, strength: f.strength, x: f.x, y: f.y });
          started = true;
        } else if (groundedAct) {
          change(f, ((held & DUCK) !== 0 || f.state === CROUCH || f.state === DOWN ? CROUCH_ATTACK : FIRST_ATTACK) + button);
          f.strength = button % 3; f.vx = 0;
          ctx.events.emit(CombatEffect, { step: ctx.step, attack: button >= 3 ? 1 : 0, kind: 0, player: f.player, strength: f.strength, x: f.x, y: f.y });
          started = true;
        }
      } else if (groundedAct && f.stun === 0 && (buffered & 1024) !== 0) {
        change(f, THROW); f.vx = 0; f.strength = 1; started = true;
        ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 0, player: f.player, strength: 1, x: f.x, y: f.y });
      } else if (airAct && button >= 0) {
        f.airState = f.state; change(f, AIR_ATTACK + button); f.strength = button % 3; started = true;
        ctx.events.emit(CombatEffect, { step: ctx.step, attack: button >= 3 ? 1 : 0, kind: 0, player: f.player, strength: f.strength, x: f.x, y: f.y });
      }
      if (started) controls.buffered[f.player] = 0;
      else if (groundedAct && f.stun === 0) {
        const facing = opponent.x >= f.x ? 1 : -1;
        if (f.facing !== facing) { f.facing = facing; change(f, (held & DUCK) !== 0 ? CROUCH_TURN : TURN); }
        else if ((held & JUMP) !== 0 && f.state !== DOWN && f.state !== CROUCH && f.state !== UP && f.state !== CROUCH_TURN) { f.vx = 0; change(f, JUMP_START); }
        else if ((held & DUCK) !== 0) { f.vx = 0; if (f.state !== CROUCH && f.state !== DOWN && f.state !== CROUCH_TURN) change(f, DOWN); }
        else if (f.state === CROUCH) change(f, UP);
        else if (f.state !== DOWN && f.state !== UP && f.state !== TURN && f.state !== CROUCH_TURN && !(f.state === LAND && !landingReady)) {
          if (horizontal !== 0) { change(f, forward > 0 ? FORWARD : BACK); f.vx = (def.initialVelocity.x[STATE_NAMES[f.state]!] ?? 0) * f.facing; }
          else if (f.state !== LAND || f.frame >= duration(def, LAND)) { change(f, IDLE); f.vx = 0; }
        }
      }
      let launched = false;
      if (f.state === JUMP_START && f.frame >= duration(def, JUMP_START)) {
        f.jumpDirection = horizontal; launched = true;
        change(f, horizontal === 0 ? JUMP_UP : horizontal * f.facing > 0 ? JUMP_FORWARD : JUMP_BACK);
        f.airState = f.state; f.vy = def.initialVelocity.jump; f.vx = (def.initialVelocity.x[STATE_NAMES[f.state]!] ?? 0) * f.facing;
      }
      if (f.state === DRAGON && f.frame === 4) { f.vy = -330 - 25 * f.strength; f.vx = 95 * f.facing; launched = true; }
      if (f.state === HURRICANE && f.frame === 8) { f.vy = -220 - 15 * f.strength; launched = true; }
      const airborne = f.y < 216 || f.vy !== 0;
      if (airborne && advanceFlight(f, def, launched)) {
        f.vx = 0;
        if (f.state !== DRAGON && f.state !== HURRICANE && f.state !== KNOCKDOWN) change(f, LAND);
        ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 5, player: f.player, strength: 0, x: f.x, y: f.y });
      }
      if (f.state === KNOCKDOWN) fallFrame(f);
      if (f.state === HURRICANE) f.vx = f.frame >= 8 && f.frame < 32 ? (150 + f.strength * 35) * f.facing : 0;
      f.x = Math.max(24, Math.min(744, f.x + f.vx / 60));
      if (f.state >= HURT && f.state < SPECIAL || f.state === BLOCK_HIGH || f.state === BLOCK_LOW || (f.state === KNOCKDOWN && f.y === 216 && f.vy === 0) || f.state === THROW_TECH) {
        const friction = f.strength === 2 ? 800 : 600; f.vx = Math.sign(f.vx) * Math.max(0, Math.abs(f.vx) - friction / 60);
      }
      if (f.state === SPECIAL && !f.projectileFired && animationEntry(def, f.state, f.frame) >= 3) {
        f.projectileFired = true;
        ctx.commands.spawn({ Projectile: { player: f.player, x: f.x + 76 * f.facing, y: f.y - 57, facing: f.facing, strength: f.strength, state: 0, frame: 0 } });
      }
    }
    const a = fighters[0]!, b = fighters[1]!;
    const boxA = actualBox(fighterFrame(a).push, a.x, a.y, a.facing), boxB = actualBox(fighterFrame(b).push, b.x, b.y, b.facing);
    if (overlaps(boxA, boxB)) {
      const sign = a.x <= b.x ? 1 : -1, overlap = sign === 1 ? boxA[0] + boxA[2] - boxB[0] : boxB[0] + boxB[2] - boxA[0];
      const oldA = a.x, oldB = b.x;
      a.x = Math.max(24, Math.min(744, a.x - sign * overlap / 2)); b.x = Math.max(24, Math.min(744, b.x + sign * overlap / 2));
      const remainder = overlap - Math.abs(a.x - oldA) - Math.abs(b.x - oldB);
      if (remainder > 0) {
        if (a.x === 24 || a.x === 744) b.x = Math.max(24, Math.min(744, b.x + sign * remainder));
        else a.x = Math.max(24, Math.min(744, a.x - sign * remainder));
      }
    }
    if (Math.abs(a.x - b.x) > 320) { const mid = (a.x + b.x) / 2, sign = Math.sign(a.x - b.x); a.x = mid + sign * 160; b.x = mid - sign * 160; }
    const contacts: Contact[] = [];
    for (const f of fighters) {
      const target = fighters[1 - f.player]!, move = moveForState(f.state);
      if (f.attackHit || !(f.state >= FIRST_ATTACK && f.state <= LAST_ATTACK || move)) continue;
      const hit = actualBox(fighterFrame(f).hit, f.x, f.y, f.facing);
      const thrown = f.state === THROW;
      const region = thrown ? (f.frame >= 5 && f.frame < 7 && target.y === 216 && target.throwCooldown === 0 && target.invulnerable === 0 && target.state !== KNOCKDOWN && target.state !== WAKEUP && Math.abs(target.x - f.x) <= 42 ? 1 : -1) : hitRegion(hit, target);
      if (region >= 0) {
        f.attackHit = true;
        const height = move?.height ?? 'mid';
        contacts.push({ attack: move?.attack ?? (f.state >= 16 ? 1 : 0), height, knockdown: move?.knockdown ?? false, thrown, direction: f.facing, blocked: !thrown && canGuard(target, controls.held[target.player]!, height), target: target.player, source: f.player, strength: f.strength, region, x: hit[0] + hit[2] / 2, y: hit[1] + hit[3] / 2 });
      }
    }
    if (contacts.length === 2 && contacts.every(c => c.thrown)) {
      for (const f of fighters) { change(f, THROW_TECH); f.vx = -f.facing * 150; f.throwCooldown = 45; f.invulnerable = 18; }
      ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 10, player: 0, strength: 0, x: (a.x + b.x) / 2, y: 160 });
    } else {
      // A connected throw beats a simultaneous strike; other strikes still trade symmetrically.
      const throwSources = contacts.filter(c => c.thrown).map(c => c.source);
      for (const hit of contacts) if (!throwSources.includes(hit.target) || hit.thrown) applyContact(ctx, match, fighters[hit.target]!, hit);
    }
    persist();
    match.remaining[0] = Math.max(0, match.remaining[0]! - 1); finishMatch(ctx, match);
  },
});

// Structural typing keeps finish logic shared without owning mutable module state.
function finishMatch(ctx: { step: number; events: { emit: (token: typeof CombatEffect, value: { step: number; attack: number; kind: number; player: number; strength: number; x: number; y: number }) => void } },
  match: { mode: Uint32Array; phaseTicks: Uint32Array; phase: Uint32Array; remaining: Uint32Array; p1Health: Uint32Array; p2Health: Uint32Array; winner: Int32Array; p1Wins: Uint32Array; p2Wins: Uint32Array }): void {
  if (match.mode[0] === 2 || match.phase[0] !== 1 || (match.p1Health[0]! > 0 && match.p2Health[0]! > 0 && match.remaining[0]! > 0)) return;
  match.phase[0] = 2; match.phaseTicks[0] = 150;
  const winner = match.p1Health[0] === match.p2Health[0] ? 2 : match.p1Health[0]! > match.p2Health[0]! ? 0 : 1;
  match.winner[0] = winner;
  if (winner === 0) match.p1Wins[0] = match.p1Wins[0]! + 1;
  if (winner === 1) match.p2Wins[0] = match.p2Wins[0]! + 1;
  ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 4, player: winner, strength: 0, x: 384, y: 150 });
}

export const CombatProjectiles = defineSystem({
  name: 'CombatProjectiles', after: ['CombatRound'],
  queries: { shots: query(write(Projectile)), fighters: query(write(Fighter)) }, resources: [write(MatchState), write(CombatInput)],
  run(ctx, q) {
    const match = ctx.resource(MatchState);
    const shots: { entity: EntityId; value: ProjectileValue }[] = [];
    const reset = match.resetStep[0] === ctx.step;
    for (const c of q.shots.chunks()) for (let i = 0; i < c.length; i++) shots.push({ entity: c.entity(i), value: c.get(Projectile, i) });
    if (reset || match.phase[0] === 2 || match.phase[0] === 5) { for (const shot of shots) ctx.commands.despawn(shot.entity); return; }
    if (match.phase[0] !== 1 || match.hitStop[0]! > 0 || match.freezeStep[0] === ctx.step) return;
    for (const shot of shots) {
      const s = shot.value;
      if (s.state === 0) s.x += SPEED[s.strength]! * s.facing / 60;
      s.frame++;
    }
    for (let i = 0; i < shots.length; i++) for (let j = i + 1; j < shots.length; j++) {
      const a = shots[i]!.value, b = shots[j]!.value;
      if (a.state === 0 && b.state === 0 && a.player !== b.player && Math.abs(a.x - b.x) < 30 && Math.abs(a.y - b.y) < 24) {
        a.state = 1; a.frame = 0; b.state = 1; b.frame = 0;
        ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 3, player: a.player, strength: 0, x: (a.x + b.x) / 2, y: a.y });
      }
    }
    const fighters: FighterValue[] = [];
    for (const c of q.fighters.chunks()) for (let i = 0; i < c.length; i++) {
      const f = c.get(Fighter, i); fighters[f.player] = f;
    }
    const contacts: Contact[] = [];
    for (const shot of shots) {
      const s = shot.value, target = fighters[1 - s.player];
      if (s.state !== 0 || !target) continue;
      const region = hitRegion([s.x - 15, s.y - 13, 30, 24], target);
      if (region >= 0) {
        contacts.push({ attack: 0, height: 'mid', knockdown: false, thrown: false, direction: s.facing, blocked: canGuard(target, ctx.resource(CombatInput).held[target.player]!, 'mid'), target: target.player, source: s.player, strength: 2, region, x: s.x, y: s.y });
        s.state = 1; s.frame = 0;
      }
    }
    for (const hit of contacts) {
      const target = fighters[hit.target]!;
      if (hit.blocked) {
        const hp = target.player === 0 ? match.p1Health : match.p2Health;
        hp[0] = Math.max(1, hp[0]! - 2);
      }
      applyContact(ctx, match, target, hit);
    }
    for (const c of q.fighters.chunks()) for (let i = 0; i < c.length; i++) c.set(Fighter, i, fighters[c.col(Fighter).player[i]!]!);
    finishMatch(ctx, match);
    for (const shot of shots) {
      const s = shot.value;
      if (s.x < -56 || s.x > 824 || (s.state === 1 && s.frame >= 23)) ctx.commands.despawn(shot.entity);
      else ctx.commands.insert(shot.entity, Projectile, s);
    }
  },
});
