import { Sprite, VisualOffset } from '@gameengine/runtime';
import { expect, renderTest } from '@gameengine/test';
import { Fighter, MatchState } from '../src/schema.gen.ts';
import { ArrangeFight } from '../src/combat/fight.cheats.ts';
import { CROUCH_ATTACK, DRAGON, HURRICANE, THROW, WAKEUP, moveForState } from '../src/combat/moves.ts';
import { FIGHTERS } from '../src/data/fighters.ts';
import { frameForFighter } from '../src/combat/index.ts';
import { beginLocal } from './ui-flow.helpers.ts';

renderTest('animation rendering: wakeup keeps original recovery poses upright', async c => {
  c.input.view(1152, 672, 1); await c.loaded(); await c.step(2); await beginLocal(c);
  await c.cheat(ArrangeFight, { distance: 36 });
  c.input.action('p2.throw'); await c.step(6); c.input.action('p2.throw', 0);
  const ryu = c.world.entities(Fighter).find(e => c.world.get(e, Fighter).player === 0)!;
  let seen = 0;
  for (let step = 0; step < 100; step++) {
    await c.step(1);
    if (c.world.get(ryu, Fighter).state !== WAKEUP) continue;
    c.render.expectDrawCalls('<=', 30, { width: 1152, height: 672 });
    const pose = c.world.get(ryu, VisualOffset);
    expect(pose.position[1]).toBe(0);
    expect(pose.rotation).toEqual([0, 0, 0, 1]);
    seen++;
    if (seen === 7) c.render.expectScreenshot('recovery', { width: 768, height: 448 });
  }
  expect(seen).toBe(12);
}, { memory: 'phone-low' });

renderTest('animation rendering: original stomach recoil sprites stay visible and upright', async c => {
  c.input.view(1152, 672, 1); await c.loaded(); await c.step(2); await beginLocal(c);
  await c.cheat(ArrangeFight, { distance: 180 });
  const fighters = c.world.entities(Fighter);
  for (const [state, key] of [[22, 'hit-stomach-1'], [24, 'hit-stomach-2'], [24, 'hit-stomach-3']] as const) {
    for (const entity of fighters) {
      const f = c.world.get(entity, Fighter), def = FIGHTERS[f.fighterId]!;
      let tick = 0;
      while (tick < 60 && !frameForFighter(def, state, tick).sprite.endsWith(`/${key}`)) tick++;
      expect(tick).toBeLessThan(60);
      c.world.insert(entity, Fighter, { state, frame: tick, y: 216, vx: 0, vy: 0, stun: 12 });
    }
    // Freeze combat on the inspected source pose while allowing presentation to draw it.
    c.world.setResource(MatchState, { hitStop: 2 }); await c.step(1);
    c.render.expectDrawCalls('<=', 30, { width: 1152, height: 672 });
    for (const entity of fighters) {
      expect(c.world.get(entity, Sprite).image?.endsWith(`/${key}`)).toBe(true);
      expect(c.world.get(entity, Sprite).visible).toBe(true);
      expect(c.world.get(entity, VisualOffset).rotation).toEqual([0, 0, 0, 1]);
    }
    if (key === 'hit-stomach-2') c.render.expectScreenshot('body-recoil', { width: 768, height: 448 });
  }
}, { memory: 'phone-low' });

renderTest('animation rendering: both fighters draw original move families without fallback rotation', async c => {
  c.input.view(1152, 672, 1); await c.loaded(); await c.step(2); await beginLocal(c);
  await c.cheat(ArrangeFight, { distance: 240 });
  const fighters = c.world.entities(Fighter);
  const uppercut = moveForState(CROUCH_ATTACK + 2)!;
  const poses = [[THROW, 5, 'extra-throw-2'], [DRAGON, 24, 'extra-dragon-4'],
    [CROUCH_ATTACK + 2, uppercut.startup, 'extra-crouch-punch-6'], [WAKEUP, 3, 'extra-rise-3'],
    [HURRICANE, 10, 'extra-hurricane-5']] as const;
  for (const [state, frame, key] of poses) {
    for (const entity of fighters) c.world.insert(entity, Fighter, { state, frame, y: state === HURRICANE ? 180 : 216, vx: 0, vy: 0, stun: 0 });
    c.world.setResource(MatchState, { hitStop: 2 }); await c.step(1);
    c.render.expectDrawCalls('<=', 30, { width: 1152, height: 672 });
    for (const entity of fighters) {
      expect(c.world.get(entity, Sprite).image?.endsWith(`/${key}`)).toBe(true);
      expect(c.world.get(entity, Sprite).visible).toBe(true);
      expect(c.world.get(entity, VisualOffset).position[1]).toBe(0);
      expect(c.world.get(entity, VisualOffset).rotation).toEqual([0, 0, 0, 1]);
    }
    if (state === HURRICANE) c.render.expectScreenshot('spin-poses', { width: 768, height: 448 });
  }
}, { memory: 'phone-low' });
