import { expect, renderTest } from '@gameengine/test';
import { MatchState, MenuState } from '../src/schema.gen.ts';
import { menuCommand } from './ui-flow.helpers.ts';

const SCREENS = ['title', 'main', 'setup', 'pause', 'moves', 'options', 'results'] as const;
for (const [device, width, height] of [['compact', 1024, 768], ['ultrawide', 1680, 720], ['notched', 2556, 1179]] as const) {
  for (const [screen, name] of SCREENS.entries()) {
    renderTest(`arcade screen ${name} fits ${device}`, async (c) => {
      const insets: [number, number, number, number] = device === 'notched' ? [177, 0, 102, 0] : [0, 0, 0, 0];
      c.input.view(width, height, 1, insets); await c.loaded(); await c.step(2);
      if (screen === 3 || screen === 4) {
        c.world.setResource(MatchState, { phase: 3, resumePhase: 1 }); await c.step(2);
        if (screen === 4) await menuCommand(c, 6, 1);
      } else if (screen === 6) {
        c.world.setResource(MatchState, { phase: 5, winner: 0, matchWinner: 0, p1Wins: 2, p2Wins: 0 }); await c.step(2);
      } else if (screen !== 0) await menuCommand(c, 7, screen);
      expect(c.world.resource(MenuState).screen).toBe(screen);
      c.render.stats({ width, height });
      for (const button of c.ui.interactables()) {
        if (!button.id) continue;
        const rect = c.ui.rect(button.id)!;
        expect(rect.x).toBeGreaterThanOrEqual(insets[0]!); expect(rect.y).toBeGreaterThanOrEqual(0);
        expect(rect.x + rect.width).toBeLessThanOrEqual(width - insets[2]!); expect(rect.y + rect.height).toBeLessThanOrEqual(height);
      }
      if (device !== 'notched') c.render.expectScreenshot(`arcade-${name}-${device}`, { width, height });
    });
  }
}

for (const [name, width, height] of [['compact', 1024, 768], ['ultrawide', 1680, 720]] as const) {
  renderTest(`arcade versus introduction fits ${name}`, async (c) => {
    c.input.view(width, height, 1); await c.loaded(); await c.step(2);
    c.world.setResource(MatchState, { phase: 6, phaseTicks: 90, p1Fighter: 1, p2Fighter: 0, stageId: 1 });
    await c.step(2); c.render.stats({ width, height });
    expect(c.ui.interactables().filter(button => button.id === 'fight' || button.id === 'swap-p1').length).toBe(0);
    c.render.expectScreenshot(`arcade-versus-${name}`, { width, height });
  });
}
