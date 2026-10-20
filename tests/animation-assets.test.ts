import { expect, worldTest } from '@gameengine/test';
import { animationEntry, frameForFighter, STATE_NAMES } from '../src/combat/index.ts';
import { AIR_ATTACK, BLOCK_HIGH, CROUCH_ATTACK, DRAGON, HURRICANE, THROW, WAKEUP, extendedDuration, moveForState } from '../src/combat/moves.ts';
import { EXTENDED_FRAMES } from '../src/data/extended-frames.ts';
import { FIGHTERS } from '../src/data/fighters.ts';
import type { FighterFrame } from '../src/data/fighter-types.ts';
import { Fighter, MatchIntent, MatchState } from '../src/schema.gen.ts';

function metadataErrors(frame: FighterFrame, label: string): string[] {
  const errors: string[] = [];
  if (!/^fighters\/(ryu|ken)\/[a-z0-9-]+$/.test(frame.sprite)) errors.push(`${label}: invalid sprite ${frame.sprite}`);
  if (frame.rect.length !== 4 || frame.rect.some(value => !Number.isInteger(value)) ||
      frame.rect[0] < 0 || frame.rect[1] < 0 || frame.rect[2] <= 0 || frame.rect[3] <= 0) errors.push(`${label}: invalid crop`);
  // Airborne poses deliberately place their feet pivot below the visible crop.
  if (frame.origin.length !== 2 || frame.origin.some(value => !Number.isFinite(value) || value < 0)) errors.push(`${label}: invalid pivot`);
  if (frame.hurt.length !== 3) errors.push(`${label}: missing head/body/feet hurt regions`);
  for (const box of [frame.push, frame.hit, ...frame.hurt]) {
    if (box.length !== 4 || box.some(value => !Number.isFinite(value)) || box[2] < 0 || box[3] < 0) errors.push(`${label}: invalid collision box`);
  }
  return errors;
}

worldTest('animation assets: every base animation resolves its full declared timeline', async () => {
  const errors: string[] = [];
  for (const def of FIGHTERS) {
    for (const [key, frame] of Object.entries(def.frames)) errors.push(...metadataErrors(frame, `${def.name}/${key}`));
    for (let state = 0; state < BLOCK_HIGH; state++) {
      const name = STATE_NAMES[state]!, animation = def.animations[name];
      if (!animation?.length) { errors.push(`${def.name}/${name}: missing animation`); continue; }
      let elapsed = 0;
      for (let entry = 0; entry < animation.length; entry++) {
        const [key, delay] = animation[entry]!, label = `${def.name}/${name}/${entry}`;
        if (!def.frames[key]) { errors.push(`${label}: missing pose ${key}`); continue; }
        if (!Number.isInteger(delay) || delay < -1 || delay <= 0 && entry !== animation.length - 1) errors.push(`${label}: invalid duration/sentinel ${delay}`);
        // Every tick of a declared pose must retain both its sprite and collision geometry.
        for (let tick = 0; tick < Math.max(1, delay); tick++) {
          if (animationEntry(def, state, elapsed + tick) !== entry || frameForFighter(def, state, elapsed + tick) !== def.frames[key]) {
            errors.push(`${label}: timeline skips pose at tick ${elapsed + tick}`); break;
          }
        }
        if (delay > 0) elapsed += delay;
      }
      const final = animation[animation.length - 1]!;
      if (frameForFighter(def, state, elapsed + 120) !== def.frames[final[0]]) errors.push(`${def.name}/${name}: terminal pose missing`);
    }
  }
  expect(errors).toEqual([]);
});

worldTest('animation assets: all extended states use authored poses without idle fallback', async () => {
  const errors: string[] = [];
  for (let fighter = 0; fighter < FIGHTERS.length; fighter++) {
    const def = FIGHTERS[fighter]!;
    const poses = [...Object.values(def.frames), ...Object.values(EXTENDED_FRAMES[fighter]!)];
    for (let state = BLOCK_HIGH; state < STATE_NAMES.length; state++) {
      const duration = extendedDuration(state), label = `${def.name}/${STATE_NAMES[state]}`;
      if (duration === undefined || !Number.isInteger(duration) || duration <= 0) { errors.push(`${label}: missing duration`); continue; }
      for (let tick = 0; tick <= duration; tick++) {
        const frame = frameForFighter(def, state, tick);
        if (!frame) { errors.push(`${label}/${tick}: missing frame`); break; }
        errors.push(...metadataErrors(frame, `${label}/${tick}`));
        if (frame.sprite === def.frames['idle-1']!.sprite) { errors.push(`${label}/${tick}: idle fallback`); break; }
        const authored = poses.find(pose => pose.sprite === frame.sprite);
        if (!authored || JSON.stringify([authored.rect, authored.origin]) !== JSON.stringify([frame.rect, frame.origin])) {
          errors.push(`${label}/${tick}: sprite crop/pivot is not an authored pose`); break;
        }
      }
    }
  }
  expect(errors).toEqual([]);
});

worldTest('animation assets: extended attack collision windows match visible attack timing', async () => {
  const errors: string[] = [];
  for (const def of FIGHTERS) for (let state = BLOCK_HIGH; state < STATE_NAMES.length; state++) {
    const move = moveForState(state);
    if (!move) continue;
    const label = `${def.name}/${STATE_NAMES[state]}`;
    if (![move.duration, move.startup, move.active].every(Number.isInteger) || move.startup < 0 || move.active <= 0 ||
        move.startup + move.active > move.duration) errors.push(`${label}: invalid attack window`);
    for (let tick = 0; tick <= move.duration; tick++) {
      const frame = frameForFighter(def, state, tick), visibleHit = frame.hit[2] > 0 && frame.hit[3] > 0;
      if (visibleHit !== (tick >= move.startup && tick < move.startup + move.active)) errors.push(`${label}/${tick}: incorrect active collision frame`);
    }
  }
  expect(errors).toEqual([]);
});

worldTest('animation assets: throw and hurricane use their original move poses', async () => {
  const errors: string[] = [];
  for (const def of FIGHTERS) {
    if (!frameForFighter(def, THROW, 5).sprite.endsWith('/extra-throw-2')) errors.push(`${def.name}: throw contact omits its original grab pose`);
    const spin = new Set<string>();
    const move = moveForState(HURRICANE)!;
    for (let tick = move.startup; tick < move.startup + move.active; tick++) {
      const sprite = frameForFighter(def, HURRICANE, tick).sprite;
      spin.add(sprite);
      if (sprite.endsWith('/extra-hurricane-1')) errors.push(`${def.name}/${tick}: hurricane spin inserts upright takeoff pose`);
    }
    if (spin.size !== 6) errors.push(`${def.name}: hurricane omits intermediate spin poses`);
    const expectedSpin = [2, 5, 3, 6, 4, 7].map(pose => `fighters/${def.name.toLowerCase()}/extra-hurricane-${pose}`);
    expect([8, 10, 12, 14, 16, 18].map(tick => frameForFighter(def, HURRICANE, tick).sprite)).toEqual(expectedSpin);
  }
  expect(errors).toEqual([]);
});

worldTest('animation assets: uppercuts and wakeup retain intermediate source poses', async () => {
  for (const def of FIGHTERS) {
    const root = `fighters/${def.name.toLowerCase()}/extra-`, heavy = moveForState(CROUCH_ATTACK + 2)!;
    expect([0, heavy.startup, heavy.startup + heavy.active].map(tick => frameForFighter(def, CROUCH_ATTACK + 2, tick).sprite))
      .toEqual([4, 6, 5].map(pose => `${root}crouch-punch-${pose}`));
    expect([0, 3, 6, 9].map(tick => frameForFighter(def, WAKEUP, tick).sprite))
      .toEqual([2, 3, 4, 1].map(pose => `${root}rise${pose === 1 ? '' : `-${pose}`}`));
    expect([0, 4, 12, 24, 32, 40].map(tick => frameForFighter(def, DRAGON, tick).sprite))
      .toEqual([1, 2, 3, 4, 5, 6].map(pose => `${root}dragon-${pose}`));
  }
  // Ryu's original light and medium crouch punches share a jab. Ken has distinct source poses.
  const ken = FIGHTERS[1];
  for (const [button, poses] of [[0, [1, 2, 7]], [1, [8, 3, 9]]] as const) {
    const move = moveForState(CROUCH_ATTACK + button)!;
    expect([0, move.startup, move.startup + move.active].map(tick => frameForFighter(ken, CROUCH_ATTACK + button, tick).sprite))
      .toEqual(poses.map(pose => `fighters/ken/extra-crouch-punch-${pose}`));
  }
});

worldTest('animation assets: stomach recoil head regions remain above the floor', async () => {
  const errors: string[] = [];
  for (const def of FIGHTERS) for (const key of ['hit-stomach-2', 'hit-stomach-3']) {
    const head = def.frames[key]!.hurt[0]!;
    if (head[1] + head[3] >= 0) errors.push(`${def.name}/${key}: head hurt region reaches below the feet pivot`);
  }
  expect(errors).toEqual([]);
});

worldTest('animation assets: descending air normals resume descending jump poses', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2);
  world.setResource(MatchState, { mode: 1 }); input.emit(MatchIntent, { action: 0 }); await step(190);
  const fighters = world.entities(Fighter);
  for (const airState of [4, 5, 6]) {
    for (const entity of fighters) {
      const f = world.get(entity, Fighter);
      world.insert(entity, Fighter, { state: AIR_ATTACK, frame: 13, airState, y: 150, vy: 200,
        x: f.player === 0 ? 224 : 544, vx: 0, stun: 0 });
    }
    await step(1);
    for (const entity of fighters) {
      const f = world.get(entity, Fighter);
      expect(f.state).toBe(airState); expect(f.y).toBeGreaterThan(150); expect(f.y).toBeLessThan(216);
      expect(f.frame).toBeGreaterThan(20);
      expect(animationEntry(FIGHTERS[f.fighterId]!, f.state, f.frame)).toBeGreaterThan(2);
    }
  }
});
