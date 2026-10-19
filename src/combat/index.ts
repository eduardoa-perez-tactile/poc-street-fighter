/** Fixed-step fighting simulation. Coordinates retain the reference's pixel, y-down convention. */
import { defineSystem, query, write, type EntityId } from '@gameengine/runtime';
import { CombatEffect, CombatInput, Fighter, MatchIntent, MatchState, Projectile, type FighterValue, type ProjectileValue } from '../schema.gen.ts';
import { FIGHTERS } from '../data/fighters.ts';
import type { Box, FighterDefinition, FighterFrame } from '../data/fighter-types.ts';

export const STATE_NAMES = Object.freeze([
  'idle', 'walk-forwards', 'walk-backwards', 'jump-start', 'jump-up', 'jump-forwards',
  'jump-backwards', 'jump-land', 'crouch', 'crouch-down', 'crouch-up', 'idle-turn',
  'crouch-turn', 'light-punch', 'medium-punch', 'heavy-punch', 'light-kick', 'medium-kick',
  'heavy-kick', 'hurt-head-light', 'hurt-head-medium', 'hurt-head-heavy', 'hurt-body-light',
  'hurt-body-medium', 'hurt-body-heavy', 'special-1', 'winner-pose',
] as const);
const IDLE = 0, FORWARD = 1, BACK = 2, JUMP_START = 3, JUMP_UP = 4, JUMP_FORWARD = 5,
  JUMP_BACK = 6, LAND = 7, CROUCH = 8, DOWN = 9, UP = 10, TURN = 11, CROUCH_TURN = 12,
  FIRST_ATTACK = 13, LAST_ATTACK = 18, HURT = 19, SPECIAL = 25;
const LEFT = 1, RIGHT = 2, JUMP = 4, DUCK = 8;
const ACTIONS = Object.freeze(['left', 'right', 'up', 'down', 'lp', 'mp', 'hp', 'lk', 'mk', 'hk']);
const KEYS = Object.freeze([[1, 4, 23, 19, 6, 7, 8, 22, 2, 14], [50, 51, 52, 53, 10, 11, 12, 21, 9, 15]]);
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
export function frameForFighter(def: FighterDefinition, state: number, frame: number): FighterFrame {
  const animation = def.animations[STATE_NAMES[state]!] ?? def.animations.idle!;
  return def.frames[animation[animationEntry(def, state, frame)]![0]]!;
}
function duration(def: FighterDefinition, state: number): number {
  let result = 0;
  for (const [, delay] of def.animations[STATE_NAMES[state]!]!) if (delay > 0) result += delay;
  return result;
}
function looping(state: number): boolean { return state <= BACK; }
function change(f: FighterValue, state: number): void {
  if (f.state === state) return;
  f.state = state; f.frame = 0; f.age = 0; f.attackHit = false; f.projectileFired = false;
}
function makeFighter(player: number): FighterValue {
  return { player, x: player === 0 ? 296 : 472, y: 216, vx: 0, vy: 0,
    facing: player === 0 ? 1 : -1, state: IDLE, frame: 0, age: 0,
    attackHit: false, strength: 0, projectileFired: false, jumpDirection: 0 };
}
export function actualBox(box: Box, x: number, y: number, facing: number): Box {
  return [x + (facing === 1 ? box[0] : -box[0] - box[2]), y + box[1], box[2], box[3]];
}
export function overlaps(a: Box, b: Box): boolean {
  return a[2] > 0 && a[3] > 0 && b[2] > 0 && b[3] > 0 &&
    a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];
}
function hitRegion(hit: Box, target: FighterValue): number {
  const hurt = frameForFighter(FIGHTERS[target.player]!, target.state, target.frame).hurt;
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
  resources: [write(CombatInput), write(MatchState)], events: [MatchIntent],
  run(ctx) {
    const controls = ctx.resource(CombatInput), match = ctx.resource(MatchState);
    let intent = -1;
    for (const event of ctx.events.read(MatchIntent)) intent = event.action;
    for (const event of ctx.input) {
      if (event.type === 'key') {
        for (let p = 0; p < 2; p++) {
          const key = KEYS[p]!.indexOf(event.code);
          if (key !== -1) controls.keyboard[p] = setBit(controls.keyboard[p]!, 1 << key, event.down);
        }
        if (event.code === 38 || event.code === 39) {
          const bit = event.code === 38 ? 1 : 2;
          if (event.down && (match.intentKeys[0]! & bit) === 0) intent = event.code === 38 ? (match.phase[0] === 2 ? 1 : 0) : (match.phase[0] === 3 ? 3 : 2);
          match.intentKeys[0] = setBit(match.intentKeys[0]!, bit, event.down);
        }
      } else if (event.type === 'action') {
        if (event.name === 'start' && event.value > 0) intent = match.phase[0] === 2 ? 1 : 0;
        else if (event.name === 'pause' && event.value > 0) intent = match.phase[0] === 3 ? 3 : 2;
        else for (let p = 0; p < 2; p++) {
          const prefix = `p${p + 1}.`;
          if (event.name.startsWith(prefix)) {
            const action = ACTIONS.indexOf(event.name.slice(prefix.length));
            if (action !== -1) controls.actions[p] = setBit(controls.actions[p]!, 1 << action, event.value > 0);
          }
        }
      } else if (event.type === 'gamepadButton' && event.pad < 2) {
        const map = [4, 7, 5, 8, 6, 9, -1, -1, -1, -1, -1, -1, 2, 3, 0, 1];
        const button = map[event.button] ?? -1;
        if (button >= 0) controls.pad[event.pad] = setBit(controls.pad[event.pad]!, 1 << button, event.down);
        if (event.button === 9 && event.down) intent = match.phase[0] === 0 ? 0 : match.phase[0] === 2 ? 1 : match.phase[0] === 3 ? 3 : 2;
      } else if (event.type === 'gamepadAxis' && event.pad < 2 && event.axis < 2) {
        const negative = event.axis === 0 ? LEFT : JUMP, positive = event.axis === 0 ? RIGHT : DUCK;
        controls.axis[event.pad] = setBit(setBit(controls.axis[event.pad]!, negative, event.value < -0.35), positive, event.value > 0.35);
      }
    }
    if ((intent === 0 && match.phase[0] === 0) || (intent === 1 && (match.phase[0] === 2 || match.phase[0] === 3))) {
      // Reset is performed by CombatRound before any gameplay updates.
      const wasResult = match.phase[0] === 2;
      match.phase[0] = 1; match.initialized[0] = 1; match.remaining[0] = 5940;
      match.winner[0] = -1; match.p1Health[0] = 144; match.p2Health[0] = 144; match.hitStop[0] = 0;
      if (intent === 1 && wasResult) match.round[0] = match.round[0]! + 1;
      match.resetStep[0] = ctx.step;
      for (let p = 0; p < 2; p++) {
        controls.keyboard[p] = 0; controls.pad[p] = 0; controls.axis[p] = 0; controls.actions[p] = 0;
        controls.previous[p] = 0; controls.motion[p] = 0; controls.motionAge[p] = 0; controls.direction[p] = 0;
      }
    } else if (intent === 2 && match.phase[0] === 1) match.phase[0] = 3;
    else if (intent === 3 && match.phase[0] === 3) match.phase[0] = 1;
    for (let p = 0; p < 2; p++) {
      const held = controls.keyboard[p]! | controls.pad[p]! | controls.axis[p]! | controls.actions[p]!;
      controls.held[p] = held;
      controls.pressed[p] = held & ~controls.previous[p]!;
      controls.previous[p] = held;
    }
  },
});

type Contact = { attack: number; target: number; source: number; strength: number; region: number; x: number; y: number };
export const CombatRound = defineSystem({
  name: 'CombatRound', after: ['CombatControls'], query: query(write(Fighter)),
  resources: [write(MatchState), write(CombatInput)],
  run(ctx, q) {
    const match = ctx.resource(MatchState), controls = ctx.resource(CombatInput);
    const fighters: { entity: EntityId; value: FighterValue }[] = [];
    for (const chunk of q.chunks()) for (let i = 0; i < chunk.length; i++) fighters.push({ entity: chunk.entity(i), value: chunk.get(Fighter, i) });
    fighters.sort((a, b) => a.value.player - b.value.player);
    if (fighters.length !== 2) return;
    const reset = match.resetStep[0] === ctx.step && match.phase[0] === 1;
    if (reset) for (const f of fighters) f.value = makeFighter(f.value.player);
    if (match.phase[0] !== 1 || match.hitStop[0]! > 0) {
      if (match.phase[0] === 2 && match.winner[0]! < 2) {
        const winner = fighters[match.winner[0]!]!.value;
        change(winner, 26); winner.vx = 0;
        winner.frame = Math.min(duration(FIGHTERS[winner.player]!, 26), winner.frame + 1);
      }
      if (match.phase[0] === 1 && match.hitStop[0]! > 0) {
        match.freezeStep[0] = ctx.step;
        match.hitStop[0] = match.hitStop[0]! - 1;
        match.remaining[0] = Math.max(0, match.remaining[0]! - 1);
        finishMatch(ctx, match);
      }
      if (reset || match.phase[0] === 2) for (const c of q.chunks()) for (let i = 0; i < c.length; i++) c.set(Fighter, i, fighters[c.col(Fighter).player[i]!]!.value);
      return;
    }
    const contacts: Contact[] = [];
    for (const entry of fighters) {
      const f = entry.value, opponent = fighters[1 - f.player]!.value, def = FIGHTERS[f.player]!;
      // Advance retained states before selecting the pose/boxes. A transition later in this
      // step keeps frame zero, so presentation and contact resolution always use one frame.
      if (!reset) {
        f.frame++; f.age++;
        const end = duration(def, f.state);
        if (looping(f.state) && f.frame >= end) f.frame = 0;
        else if (end === 0) f.frame = 0;
        else if (f.frame >= end && f.state !== CROUCH && f.state !== JUMP_START && !(f.state >= JUMP_UP && f.state <= JUMP_BACK)) {
          change(f, f.state === DOWN || f.state === CROUCH_TURN ? CROUCH : IDLE);
        }
      }
      const held = controls.held[f.player]!, pressed = controls.pressed[f.player]!;
      const horizontal = ((held & RIGHT) !== 0 ? 1 : 0) - ((held & LEFT) !== 0 ? 1 : 0);
      const forward = horizontal * f.facing;
      const direction = (held & DUCK) !== 0 ? (forward > 0 ? 3 : forward < 0 ? 1 : 2) : forward > 0 ? 6 : 5;
      controls.motionAge[f.player] = Math.min(31, controls.motionAge[f.player]! + 1);
      if (controls.motionAge[f.player]! > 24) controls.motion[f.player] = 0;
      if (direction !== controls.direction[f.player]) {
        const motion = controls.motion[f.player]!;
        if (direction === 2) { controls.motion[f.player] = 1; controls.motionAge[f.player] = 0; }
        else if (direction === 3 && motion === 1) controls.motion[f.player] = 2;
        else if (direction === 6 && motion === 2) controls.motion[f.player] = 3;
        else if (direction !== 5) controls.motion[f.player] = 0;
        controls.direction[f.player] = direction;
      }
      const landingReady = f.state === LAND && f.frame >= 2;
      const acting = canAct(f.state) || (landingReady && (held !== 0 || (opponent.x >= f.x ? 1 : -1) !== f.facing));
      const attack = (pressed | (landingReady ? held : 0)) & 1008;
      let button = -1;
      for (let i = 0; i < 6; i++) if ((attack & (16 << i)) !== 0) { button = i; break; }
      const canSpecial = acting || f.state === TURN || f.state === CROUCH || f.state === DOWN || f.state === UP || f.state === CROUCH_TURN || (f.state >= 13 && f.state <= 15);
      if (button >= 0 && button < 3 && canSpecial && controls.motion[f.player] === 3 && controls.motionAge[f.player]! <= 24) {
        change(f, SPECIAL); f.strength = button; f.vx = 0; controls.motion[f.player] = 0;
        ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 2, player: f.player, strength: button, x: f.x, y: f.y });
      } else if (button >= 0 && acting && (held & DUCK) === 0) {
        change(f, FIRST_ATTACK + button); f.strength = button % 3; f.vx = 0;
        ctx.events.emit(CombatEffect, { step: ctx.step, attack: button >= 3 ? 1 : 0, kind: 0, player: f.player, strength: f.strength, x: f.x, y: f.y });
      } else if (acting) {
        const facing = opponent.x >= f.x ? 1 : -1;
        if (f.facing !== facing) { f.facing = facing; change(f, TURN); }
        else if ((held & JUMP) !== 0) { f.vx = 0; change(f, JUMP_START); }
        else if ((held & DUCK) !== 0) { f.vx = 0; change(f, DOWN); }
        else if (horizontal !== 0) {
          change(f, forward > 0 ? FORWARD : BACK);
          f.vx = (def.initialVelocity.x[STATE_NAMES[f.state]!] ?? 0) * f.facing;
        } else { f.vx = 0; change(f, IDLE); }
      } else if (f.state === CROUCH) {
        if ((held & DUCK) === 0) change(f, UP);
        else if ((opponent.x >= f.x ? 1 : -1) !== f.facing) { f.facing *= -1; change(f, CROUCH_TURN); }
      }
      let launched = false;
      if (f.state === JUMP_START && f.frame >= duration(def, JUMP_START)) {
        f.jumpDirection = horizontal; launched = true;
        change(f, f.jumpDirection === 0 ? JUMP_UP : f.jumpDirection * f.facing > 0 ? JUMP_FORWARD : JUMP_BACK);
        f.vy = def.initialVelocity.jump;
        f.vx = (def.initialVelocity.x[STATE_NAMES[f.state]!] ?? 0) * f.facing;
      }
      if (f.state >= JUMP_UP && f.state <= JUMP_BACK) {
        if (!launched) f.vy += def.gravity / 60;
        f.y += f.vy / 60;
        if (f.y >= 216) {
          f.y = 216; f.vy = 0; f.vx = 0; change(f, LAND);
          ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 5, player: f.player, strength: 0, x: f.x, y: f.y });
        }
      }
      f.x = Math.max(24, Math.min(744, f.x + f.vx / 60));
      if (f.state >= HURT && f.state < SPECIAL) {
        const friction = f.strength === 2 ? 800 : 600;
        f.vx = Math.sign(f.vx) * Math.max(0, Math.abs(f.vx) - friction / 60);
      }
      if (f.state === SPECIAL && !f.projectileFired && animationEntry(def, f.state, f.frame) >= 3) {
        f.projectileFired = true;
        ctx.commands.spawn({ Projectile: { player: f.player, x: f.x + 76 * f.facing, y: f.y - 57, facing: f.facing, strength: f.strength, state: 0, frame: 0 } });
      }
    }
    // Symmetric body separation. Camera constraints are derived from arena state only.
    const a = fighters[0]!.value, b = fighters[1]!.value;
    const boxA = actualBox(frameForFighter(FIGHTERS[0], a.state, a.frame).push, a.x, a.y, a.facing);
    const boxB = actualBox(frameForFighter(FIGHTERS[1], b.state, b.frame).push, b.x, b.y, b.facing);
    if (overlaps(boxA, boxB)) {
      const sign = a.x <= b.x ? 1 : -1;
      const overlap = sign === 1 ? boxA[0] + boxA[2] - boxB[0] : boxB[0] + boxB[2] - boxA[0];
      const oldA = a.x, oldB = b.x;
      a.x = Math.max(24, Math.min(744, a.x - sign * overlap / 2));
      b.x = Math.max(24, Math.min(744, b.x + sign * overlap / 2));
      const remainder = overlap - Math.abs(a.x - oldA) - Math.abs(b.x - oldB);
      if (remainder > 0) {
        if (a.x === 24 || a.x === 744) b.x = Math.max(24, Math.min(744, b.x + sign * remainder));
        else a.x = Math.max(24, Math.min(744, a.x - sign * remainder));
      }
    }
    if (Math.abs(a.x - b.x) > 320) { const mid = (a.x + b.x) / 2; a.x = mid + Math.sign(a.x - b.x) * 160; b.x = mid + Math.sign(b.x - a.x) * 160; }
    // Snapshot both attacks before applying either hit: trades never depend on entity iteration.
    for (const entry of fighters) {
      const f = entry.value, target = fighters[1 - f.player]!.value;
      if (f.state < FIRST_ATTACK || f.state > LAST_ATTACK || f.attackHit) continue;
      const box = frameForFighter(FIGHTERS[f.player]!, f.state, f.frame).hit;
      const hit = actualBox(box, f.x, f.y, f.facing), region = hitRegion(hit, target);
      if (region >= 0) {
        f.attackHit = true; contacts.push({ attack: f.state >= 16 ? 1 : 0, target: target.player, source: f.player, strength: f.strength, region, x: hit[0] + hit[2] / 2, y: hit[1] + hit[3] / 2 });
      }
    }
    for (const hit of contacts) {
      const target = fighters[hit.target]!.value, source = fighters[hit.source]!.value;
      const hp = target.player === 0 ? match.p1Health : match.p2Health, score = source.player === 0 ? match.p1Score : match.p2Score;
      hp[0] = Math.max(0, hp[0]! - DAMAGE[hit.strength]!); score[0] = score[0]! + SCORE[hit.strength]!;
      change(target, HURT + (hit.region === 0 ? 0 : 3) + hit.strength);
      // The source first hurt entry is its 15-step impact freeze, already owned by global hit-stop.
      target.frame = 15;
      target.strength = hit.strength; target.vx = source.facing * [1000 / 6, 200, 800 / 3][hit.strength]!;
      target.y = 216; target.vy = 0; match.hitStop[0] = 15;
      ctx.events.emit(CombatEffect, { step: ctx.step, attack: hit.attack, kind: 1, player: target.player, strength: hit.strength, x: hit.x, y: hit.y });
    }
    for (const c of q.chunks()) for (let i = 0; i < c.length; i++) c.set(Fighter, i, fighters[c.col(Fighter).player[i]!]!.value);
    match.remaining[0] = Math.max(0, match.remaining[0]! - 1);
    finishMatch(ctx, match);
  },
});

// Structural typing keeps finish logic shared without owning mutable module state.
function finishMatch(ctx: { step: number; events: { emit: (token: typeof CombatEffect, value: { step: number; attack: number; kind: number; player: number; strength: number; x: number; y: number }) => void } },
  match: { phase: Uint32Array; remaining: Uint32Array; p1Health: Uint32Array; p2Health: Uint32Array; winner: Int32Array; p1Wins: Uint32Array; p2Wins: Uint32Array }): void {
  if (match.phase[0] !== 1 || (match.p1Health[0]! > 0 && match.p2Health[0]! > 0 && match.remaining[0]! > 0)) return;
  match.phase[0] = 2;
  const winner = match.p1Health[0] === match.p2Health[0] ? 2 : match.p1Health[0]! > match.p2Health[0]! ? 0 : 1;
  match.winner[0] = winner;
  if (winner === 0) match.p1Wins[0] = match.p1Wins[0]! + 1;
  if (winner === 1) match.p2Wins[0] = match.p2Wins[0]! + 1;
  ctx.events.emit(CombatEffect, { step: ctx.step, attack: 0, kind: 4, player: winner, strength: 0, x: 384, y: 150 });
}

export const CombatProjectiles = defineSystem({
  name: 'CombatProjectiles', after: ['CombatRound'],
  queries: { shots: query(write(Projectile)), fighters: query(write(Fighter)) }, resources: [write(MatchState)],
  run(ctx, q) {
    const match = ctx.resource(MatchState);
    const shots: { entity: EntityId; value: ProjectileValue }[] = [];
    const reset = match.resetStep[0] === ctx.step && match.phase[0] === 1;
    for (const c of q.shots.chunks()) for (let i = 0; i < c.length; i++) shots.push({ entity: c.entity(i), value: c.get(Projectile, i) });
    if (reset || match.phase[0] === 2) { for (const shot of shots) ctx.commands.despawn(shot.entity); return; }
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
        contacts.push({ attack: 0, target: target.player, source: s.player, strength: 2, region, x: s.x, y: s.y });
        s.state = 1; s.frame = 0;
      }
    }
    for (const hit of contacts) {
      const target = fighters[hit.target]!;
      const hp = target.player === 0 ? match.p1Health : match.p2Health;
      const score = hit.source === 0 ? match.p1Score : match.p2Score;
      hp[0] = Math.max(0, hp[0]! - 28); score[0] = score[0]! + 500;
      change(target, HURT + (hit.region === 0 ? 0 : 3) + 2);
      target.frame = 15;
      target.strength = 2; target.vx = (hit.x < target.x ? 1 : -1) * (800 / 3);
      target.y = 216; target.vy = 0; match.hitStop[0] = 15;
      ctx.events.emit(CombatEffect, { step: ctx.step, attack: hit.attack, kind: 1, player: target.player, strength: 2, x: hit.x, y: hit.y });
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
