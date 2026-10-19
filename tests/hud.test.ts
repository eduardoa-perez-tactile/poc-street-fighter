import { expect, renderTest } from '@gameengine/test';
import { MatchIntent, MatchState } from '../src/schema.gen.ts';
import { beginLocal, press } from './ui-flow.helpers.ts';

renderTest('arcade flow starts pauses resumes and restarts through real buttons', async (c) => {
  const { input, loaded, step, world } = c;
  input.view(1152, 672, 1); await loaded(); await step(2); await beginLocal(c);
  expect(world.resource(MatchState).phase).toBe(1);
  await press(c, 'pause'); expect(world.resource(MatchState).phase).toBe(3);
  const remaining = world.resource(MatchState).remaining; await step(60);
  expect(world.resource(MatchState).remaining).toBe(remaining);
  await press(c, 'resume'); expect(world.resource(MatchState).phase).toBe(1);
  expect(world.resource(MatchState).remaining).toBeLessThan(remaining);
  await press(c, 'pause'); await press(c, 'restart'); await step(92);
  expect(world.resource(MatchState).phase).toBe(1);
  expect(world.resource(MatchState).p1Health).toBe(144);
  expect(world.resource(MatchState).p2Health).toBe(144);
  expect(world.resource(MatchState).remaining).toBeGreaterThan(5900);
});
for (const [name, width, height, insets] of [
  ['compact', 1024, 768, [0, 0, 0, 0]], ['ultrawide', 2100, 900, [0, 0, 0, 0]], ['notched landscape', 2556, 1179, [177, 0, 102, 0]],
] as const) {
  renderTest(`arcade actions fit ${name}`, async (c) => {
    c.input.view(width, height, 1, [...insets]); await c.loaded(); await c.step(2);
    c.render.stats({ width, height });
    const start = c.ui.rect('press-start')!;
    expect(start.x).toBeGreaterThanOrEqual(insets[0]); expect(start.y).toBeGreaterThanOrEqual(0);
    expect(start.x + start.width).toBeLessThanOrEqual(width - insets[2]); expect(start.y + start.height).toBeLessThanOrEqual(height);
    await beginLocal(c, width, height); c.render.stats({ width, height });
    const pause = c.ui.rect('pause')!;
    expect(pause.x).toBeGreaterThanOrEqual(insets[0]); expect(pause.y).toBeGreaterThanOrEqual(0);
    expect(pause.x + pause.width).toBeLessThanOrEqual(width - insets[2]); expect(pause.y + pause.height).toBeLessThanOrEqual(height);
  });
}
renderTest('health bars show full half and empty health in mirrored directions', async ({ input, loaded, step, world, render }) => {
  input.view(1152, 672, 1); await loaded(); input.emit(MatchIntent, { action: 8 }); await step(2);
  input.emit(MatchIntent, { action: 0 }); await step(92);
  const points: [number, number][] = [[60, 38], [450, 38], [700, 38], [1080, 38]];
  for (const health of [144, 72, 0]) {
    world.setResource(MatchState, { p1Health: health, p2Health: health }); await step(1);
    const colors = render.probe({ width: 1152, height: 672, points }).points.map(p => p.rgba);
    const gold = colors.map(c => c[0] > 200 && c[1] > 150 && c[2] < 150);
    const expected = [health > 0, health === 144, health === 144, health > 0];
    if (gold.some((value, index) => value !== expected[index])) throw new Error(`Health ${health} expected ${JSON.stringify(expected)}, colors ${JSON.stringify(colors)}`);
  }
});
