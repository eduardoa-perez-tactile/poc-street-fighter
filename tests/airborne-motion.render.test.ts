import { LocalTransform, Sprite, VisualOffset } from '@gameengine/runtime';
import { expect, renderTest, type WorldTestContext } from '@gameengine/test';
import { Fighter, FighterShadow } from '../src/schema.gen.ts';
import { ArrangeFight } from '../src/combat/fight.cheats.ts';
import { DRAGON, HURRICANE, KNOCKDOWN } from '../src/combat/moves.ts';
import { beginLocal } from './ui-flow.helpers.ts';

function fighter(c: WorldTestContext, player: number) {
  const entity = c.world.entities(Fighter).find(e => c.world.get(e, Fighter).player === player)!;
  return { entity, ...c.world.get(entity, Fighter) };
}

// Render a real frame before inspecting presentation-only offsets. A sprite must
// leave its shadow in world space, rather than only changing to a flying pose.
function sample(c: WorldTestContext, player: number) {
  c.render.expectDrawCalls('<=', 30, { width: 1152, height: 672 });
  const f = fighter(c, player);
  const body = c.world.get(f.entity, LocalTransform).position;
  const shadowEntity = c.world.entities(FighterShadow).find(e => c.world.get(e, FighterShadow).player === player)!;
  const shadow = c.world.get(shadowEntity, LocalTransform).position;
  const offset = c.world.get(shadowEntity, VisualOffset);
  expect(body[0]).toBeCloseTo(f.x / 100, 5);
  expect(body[1]).toBeCloseTo((216 - f.y) / 100, 5);
  expect(shadow[0]! + offset.position[0]!).toBeCloseTo(f.x / 100, 5);
  expect(shadow[1]! + offset.position[1]!).toBeCloseTo(-0.015, 5);
  expect(c.world.get(f.entity, Sprite).visible).toBe(true);
  if (f.y < 216 && f.state === KNOCKDOWN) {
    expect(c.world.get(f.entity, Sprite).image?.endsWith('/extra-down')).toBe(false);
  }
  if (f.y < 204) {
    expect(offset.scale[0]).toBeLessThan(1);
    const [, footY] = c.input.worldToScreen([body[0]!, body[1]!]);
    const [, shadowY] = c.input.worldToScreen([f.x / 100, -0.015]);
    expect(footY).toBeLessThan(shadowY - 6);
  }
  return f;
}

for (const player of [0, 1]) for (const move of ['dragon', 'hurricane', 'throw'] as const) {
  renderTest(`airborne rendering: P${player + 1} ${move} rises above its shadow and lands`, async c => {
    c.input.view(1152, 672, 1); await c.loaded(); await c.step(2);
    await beginLocal(c);
    await c.cheat(ArrangeFight, { distance: move === 'throw' ? 36 : 320 });
    const prefix = `p${player + 1}.`;
    const forward = player === 0 ? 'right' : 'left', back = player === 0 ? 'left' : 'right';
    if (move === 'dragon') {
      c.input.action(prefix + forward); await c.step(1); c.input.action(prefix + forward, 0);
      c.input.action(prefix + 'down'); await c.step(1);
      c.input.action(prefix + forward); c.input.action(prefix + 'hp'); await c.step(1);
      c.input.action(prefix + 'down', 0); c.input.action(prefix + forward, 0); c.input.action(prefix + 'hp', 0);
    } else if (move === 'hurricane') {
      c.input.action(prefix + 'down'); await c.step(1);
      c.input.action(prefix + back); await c.step(1);
      c.input.action(prefix + 'down', 0); await c.step(1);
      c.input.action(prefix + 'hk'); await c.step(1);
      c.input.action(prefix + back, 0); c.input.action(prefix + 'hk', 0);
    } else {
      c.input.action(prefix + 'throw'); await c.step(6); c.input.action(prefix + 'throw', 0);
    }
    const airbornePlayer = move === 'throw' ? 1 - player : player;
    expect(fighter(c, airbornePlayer).state).toBe(move === 'dragon' ? DRAGON : move === 'hurricane' ? HURRICANE : KNOCKDOWN);
    let rose = false, fell = false, apexCaptured = false, height = 0;
    for (let frame = 0; frame < 110; frame += 2) {
      await c.step(2);
      const f = sample(c, airbornePlayer);
      height = Math.max(height, 216 - f.y);
      if (f.y < 204 && f.vy < 0) rose = true;
      if (f.y < 204 && f.vy > 0) {
        fell = true;
        if (!apexCaptured) {
          apexCaptured = true;
          if (player === 0) c.render.expectScreenshot('apex', { width: 768, height: 448 });
        }
      }
    }
    expect(rose).toBe(true); expect(fell).toBe(true);
    expect(height).toBeGreaterThan(18);
    const landed = sample(c, airbornePlayer);
    expect(landed.y).toBe(216); expect(landed.vy).toBe(0);
    expect(c.world.get(landed.entity, LocalTransform).position[1]).toBe(0);
  }, { memory: 'phone-low' });
}
