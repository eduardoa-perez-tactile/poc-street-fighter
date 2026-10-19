/** Additional fighting rules use inspected source-sheet poses; timings/boxes are newly authored gameplay. */
import { EXTENDED_FRAMES } from '../data/extended-frames.ts';
import type { Box, FighterDefinition, FighterFrame } from '../data/fighter-types.ts';

export const BLOCK_HIGH = 27, BLOCK_LOW = 28, CROUCH_ATTACK = 29, AIR_ATTACK = 35,
  THROW = 41, KNOCKDOWN = 42, WAKEUP = 43, DRAGON = 44, HURRICANE = 45, THROW_TECH = 46;
export interface Move {
  duration: number; startup: number; active: number; strength: number; attack: number;
  height: 'mid' | 'low' | 'high'; knockdown: boolean; hit: Box;
}
export function isAirAttack(state: number): boolean { return state >= AIR_ATTACK && state < THROW; }
export function isCrouchAttack(state: number): boolean { return state >= CROUCH_ATTACK && state < AIR_ATTACK; }
export function moveForState(state: number): Move | undefined {
  if (isCrouchAttack(state) || isAirAttack(state)) {
    const air = isAirAttack(state), button = state - (air ? AIR_ATTACK : CROUCH_ATTACK), strength = button % 3, kick = button >= 3;
    return { duration: [14, 21, 29][strength]!, startup: [3, 5, 7][strength]!, active: [3, 4, 5][strength]!, strength,
      attack: kick ? 1 : 0, height: air ? 'high' : kick ? 'low' : 'mid', knockdown: !air && button === 5,
      hit: air ? [8, -70, 44 + strength * 10, 35] : kick ? [8, -24, 48 + strength * 12, 24] : [6, -48, 38 + strength * 12, 20] };
  }
  if (state === DRAGON) return { duration: 52, startup: 4, active: 18, strength: 2, attack: 0, height: 'mid', knockdown: true, hit: [0, -100, 58, 82] };
  if (state === HURRICANE) return { duration: 44, startup: 8, active: 24, strength: 2, attack: 1, height: 'mid', knockdown: true, hit: [-16, -76, 88, 36] };
  if (state === THROW) return { duration: 25, startup: 5, active: 2, strength: 1, attack: 0, height: 'mid', knockdown: true, hit: [0, -70, 42, 70] };
  return undefined;
}
export function extendedDuration(state: number): number | undefined {
  return moveForState(state)?.duration ?? (state === KNOCKDOWN ? 45 : state === WAKEUP ? 12 : state === THROW_TECH ? 18 : state === BLOCK_HIGH || state === BLOCK_LOW ? 9999 : undefined);
}
export function extendedFrame(def: FighterDefinition, state: number, frame: number): FighterFrame | undefined {
  const move = moveForState(state);
  let key: string;
  if (state === BLOCK_HIGH) key = 'extra-block-high';
  else if (state === BLOCK_LOW) key = 'extra-block-low';
  else if (state === KNOCKDOWN) key = frame < 6 ? 'extra-fall-1' : frame < 12 ? 'extra-fall-2' : frame < 18 ? 'extra-fall-3' : 'extra-down';
  else if (state === WAKEUP) key = frame < 6 ? 'extra-rise' : 'crouch-1';
  else if (state === THROW_TECH) key = 'idle-turn-2';
  else if (state === THROW) key = frame < 5 ? 'med-punch-1' : frame < 10 ? 'med-punch-3' : 'med-punch-1';
  else if (state === DRAGON) key = frame < 4 ? 'extra-dragon-1' : frame < 12 ? 'extra-dragon-2' : frame < 24 ? 'extra-dragon-3' : frame < 38 ? 'jump-up-3' : 'extra-dragon-1';
  else if (state === HURRICANE) key = frame < 8 || frame >= 32 ? 'extra-hurricane-1' : `extra-hurricane-${[2, 3, 4, 1][Math.floor((frame - 8) / 3) % 4]}`;
  else if (isCrouchAttack(state)) {
    const button = state - CROUCH_ATTACK, active = frame >= move!.startup && frame < move!.startup + move!.active;
    key = button < 3 ? active ? 'extra-crouch-punch-3' : frame < move!.startup ? 'extra-crouch-punch-1' : 'extra-crouch-punch-2' : active ? `extra-crouch-kick-${button === 5 ? 3 : 2}` : 'extra-crouch-kick-1';
  }
  else if (isAirAttack(state)) {
    const button = state - AIR_ATTACK;
    key = frame < move!.startup ? 'jump-up-2' : frame >= move!.startup + move!.active ? 'jump-up-3' : button < 3 ? `extra-air-punch-${button + 1}` : `extra-air-kick-${button - 2}`;
  } else return undefined;
  const authored = (EXTENDED_FRAMES[def.name === 'Ken' ? 1 : 0] as Readonly<Record<string, Pick<FighterFrame, 'sprite' | 'rect' | 'origin'>>>)[key];
  const base: FighterFrame = authored ? { ...def.frames['idle-1']!, ...authored } : def.frames[key] ?? def.frames['idle-1']!;
  const hit: Box = move && frame >= move.startup && frame < move.startup + move.active ? move.hit : [0, 0, 0, 0];
  // Hurt geometry follows posture with separately authored collision geometry for the newly playable source poses.
  const posture = isCrouchAttack(state) || state === BLOCK_LOW ? def.frames['crouch-3']! : isAirAttack(state) ? def.frames['jump-up-2']! : base;
  return { ...base, push: posture.push, hurt: posture.hurt, hit };
}

/** Match a bounded suffix, allowing repeated/neutral input but no unrelated directional inputs. */
export function motionMatches(directions: readonly number[], steps: readonly number[], count: number, sequence: readonly number[], now: number): boolean {
  if (count < sequence.length) return false;
  let cursor = sequence.length - 1;
  for (let i = count - 1; i >= 0 && cursor >= 0; i--) {
    if (now - steps[i]! > 24) return false;
    const direction = directions[i]!;
    if (direction === 5) continue;
    if (direction === sequence[cursor]) cursor--;
    else return false;
  }
  return cursor < 0;
}
