import { expect, renderTest } from '@gameengine/test';
import { MatchState, MenuState } from '../src/schema.gen.ts';
import { press } from './ui-flow.helpers.ts';

for (const swapped of [false, true]) for (const [name, mode, phase] of [['solo', 0, 6], ['local', 1, 6], ['training', 2, 1]] as const) {
  renderTest(`fight action: pointer starts ${name} with ${swapped ? 'swapped' : 'untouched'} selections`, async (c) => {
    c.input.view(1152, 672, 1); await c.loaded(); await c.step(2);
    await press(c, 'press-start'); await press(c, name);
    if (swapped) await press(c, 'swap-p1');
    const before = c.world.resource(MatchState);
    expect(before.mode).toBe(mode);
    expect(c.world.resource(MenuState).p1Ready).toBe(false);
    const selection = [before.p1Fighter, before.p2Fighter, before.stageId];
    await press(c, 'fight');
    const match = c.world.resource(MatchState);
    expect(match.phase).toBe(phase);
    expect([match.p1Fighter, match.p2Fighter, match.stageId]).toEqual(selection);
    expect(c.world.resource(MenuState).p1Ready).toBe(true);
    expect(c.world.resource(MenuState).p2Ready).toBe(true);
  });
}
