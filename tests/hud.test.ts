import { expect, renderTest } from '@gameengine/test';
import { MatchState } from '../src/schema.gen.ts';

// These presses exercise document hit testing, view intents and the real match controller.
renderTest('match panels start pause resume and restart through real buttons', async ({ input, step, world, render, ui, loaded }) => {
  input.view(1152, 672, 1);
  await loaded();
  await step(2);
  render.stats({ width: 1152, height: 672 });
  await ui.press('start');
  await step(2);
  expect(world.resource(MatchState).phase).toBe(1);
  render.stats({ width: 1152, height: 672 });
  await ui.press('pause');
  await step(2);
  expect(world.resource(MatchState).phase).toBe(3);
  const remaining = world.resource(MatchState).remaining;
  await step(60);
  expect(world.resource(MatchState).remaining).toBe(remaining);
  render.stats({ width: 1152, height: 672 });
  await ui.press('resume');
  await step(2);
  expect(world.resource(MatchState).phase).toBe(1);
  expect(world.resource(MatchState).remaining).toBeLessThan(remaining);
  render.stats({ width: 1152, height: 672 });
  await ui.press('pause');
  await step(2);
  render.stats({ width: 1152, height: 672 });
  await ui.press('restart');
  await step(2);
  expect(world.resource(MatchState).phase).toBe(1);
  expect(world.resource(MatchState).p1Health).toBe(144);
  expect(world.resource(MatchState).p2Health).toBe(144);
  expect(world.resource(MatchState).remaining).toBeGreaterThan(5900);
});

for (const [name, width, height, insets] of [
  ['compact', 1024, 768, [0, 0, 0, 0]],
  ['ultrawide', 2100, 900, [0, 0, 0, 0]],
  ['notched landscape', 2556, 1179, [177, 0, 102, 0]],
] as const) {
  renderTest(`start action fits ${name}`, async ({ input, step, render, ui, loaded }) => {
    input.view(width, height, 1, [...insets]);
    await loaded();
    await step(2);
    render.stats({ width, height });
    const start = ui.rect('start')!;
    expect(start.x).toBeGreaterThanOrEqual(insets[0]);
    expect(start.y).toBeGreaterThanOrEqual(0);
    expect(start.x + start.width).toBeLessThanOrEqual(width - insets[2]);
    expect(start.y + start.height).toBeLessThanOrEqual(height);
    await ui.press('start');
    await step(2);
    render.stats({ width, height });
    const pause = ui.rect('pause')!;
    expect(pause.x).toBeGreaterThanOrEqual(insets[0]);
    expect(pause.y).toBeGreaterThanOrEqual(0);
    expect(pause.x + pause.width).toBeLessThanOrEqual(width - insets[2]);
    expect(pause.y + pause.height).toBeLessThanOrEqual(height);
  });
}

renderTest('health bars show full half and empty health in mirrored directions', async ({ input, loaded, step, world, render }) => {
  input.view(1152, 672, 1);
  await loaded();
  input.action('start');
  await step(2);
  const points: [number, number][] = [[60, 52], [450, 52], [700, 52], [1080, 52]];
  for (const health of [144, 72, 0]) {
    world.setResource(MatchState, { p1Health: health, p2Health: health });
    await step(1);
    const colors = render.probe({ width: 1152, height: 672, points }).points.map(p => p.rgba);
    // Gold's green channel is high; depleted red has a low green channel.
    const gold = colors.map(c => c[1] > 150);
    const expected = [health > 0, health === 144, health === 144, health > 0];
    if (gold.some((value, index) => value !== expected[index])) {
      throw new Error(`Health ${health} expected gold ${JSON.stringify(expected)}, colors ${JSON.stringify(colors)}`);
    }
  }
});
