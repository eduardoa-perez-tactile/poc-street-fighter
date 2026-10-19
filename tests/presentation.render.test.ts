import { CameraShake } from '@gameengine/runtime';
import { expect, renderTest } from '@gameengine/test';
import { CameraImpact, MatchIntent } from '../src/schema.gen.ts';
import { ArrangeFight } from '../src/combat/fight.cheats.ts';

renderTest('heavy impact adds camera trauma once and settles', async ({ loaded, input, step, world, render, cheat }) => {
  await loaded();
  input.emit(MatchIntent, { action: 8 }); await step(2);
  input.action('start'); await step(95);
  await cheat(ArrangeFight, { distance: 48 });
  const camera = world.entities(CameraImpact)[0]!;
  input.action('p1.hp'); await step(8); input.action('p1.hp', 0);
  render.expectDrawCalls('<=', 30);
  const trauma = world.get(camera, CameraShake).trauma;
  expect(trauma).toBeGreaterThan(0);
  expect(trauma).toBeLessThan(0.4);
  const cursor = world.get(camera, CameraImpact).lastStep;
  expect(cursor).toBeGreaterThan(0);
  render.expectDrawCalls('<=', 30);
  expect(world.get(camera, CameraImpact).lastStep).toBe(cursor);
  expect(world.get(camera, CameraShake).trauma).toBeLessThanOrEqual(trauma);
  await step(90);
  expect(world.get(camera, CameraShake).trauma).toBe(0);
});
