import { expect, renderTest } from '@gameengine/test';
import { Fighter, MatchIntent, MatchState, TrainingState } from '../src/schema.gen.ts';

for (const [name, width, height] of [['normal', 1152, 672], ['compact', 1024, 768]] as const) {
  renderTest(`training footer protects the fighters on ${name}`, async ({ input, loaded, step, world, render, ui }) => {
    input.view(width, height, 1); await loaded();
    input.emit(MatchIntent, { action: 9 }); await step(2);
    input.action('start'); await step(3);
    render.stats({ width, height });
    const dummy = ui.rect('dummy')!;
    const reset = ui.rect('reset-training')!;
    const boxes = ui.rect('boxes')!;
    const pause = ui.rect('pause')!;
    const feet = world.entities(Fighter).map(e => {
      const fighter = world.get(e, Fighter);
      return input.worldToScreen([fighter.x / 100, (216 - fighter.y) / 100])[1];
    });
    for (const button of [dummy, reset, boxes]) {
      expect(button.x).toBeGreaterThanOrEqual(0);
      expect(button.y).toBeGreaterThan(Math.max(...feet));
      expect(button.x + button.width).toBeLessThanOrEqual(width);
      expect(button.y + button.height).toBeLessThanOrEqual(height);
    }
    expect(pause.x + pause.width).toBeLessThanOrEqual(width);
    expect(pause.y).toBeGreaterThanOrEqual(0);
    render.expectScreenshot(`training-${name}`, { width, height });
    await ui.press('dummy'); await step(2);
    expect(world.resource(TrainingState).dummyMode).toBe(1);
    render.stats({ width, height });
    await ui.press('boxes'); await step(2);
    expect(world.resource(TrainingState).showBoxes).toBe(true);
    render.stats({ width, height });
    await ui.press('reset-training'); await step(2);
    expect(world.resource(MatchState).p2Health).toBe(144);
    render.stats({ width, height });
    await ui.press('pause'); await step(2);
    expect(world.resource(MatchState).phase).toBe(3);
  });
}
