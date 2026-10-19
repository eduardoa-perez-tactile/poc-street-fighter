import { Sprite } from '@gameengine/runtime';
import { expect, renderTest, worldTest } from '@gameengine/test';
import { Fighter, MatchIntent, MatchState } from '../src/schema.gen.ts';
import { FinishFight } from '../src/combat/fight.cheats.ts';

for (const [name, width, height] of [['classic',1152,672],['wide',1600,900],['ultrawide',2100,900],['compact',1024,768]] as const) {
  renderTest(`arena fits ${name}`, async ({ loaded, input, step, world, render }) => {
    input.view(width,height,1);
    await loaded(); await step(2);
    input.emit(MatchIntent,{action:0}); await step(40);
    for (const entity of world.entities(Fighter)) {
      const fighter=world.get(entity,Fighter);
      const [x,y]=input.worldToScreen([fighter.x/100,(216-fighter.y)/100]);
      expect(x).toBeGreaterThan(0);expect(x).toBeLessThan(width);
      expect(y).toBeGreaterThan(0);expect(y).toBeLessThan(height);
    }
    for (const entity of world.entities(Sprite)) {
      const sprite = world.get(entity, Sprite);
      if (sprite.visible) expect(sprite.image === null).toBe(false);
    }
    render.expectDrawCalls('<=',30,{width,height});
    render.expectScreenshot('fight',{width:Math.round(width/2),height:Math.round(height/2)});
  });
}

// A recorded input-only flow (cheats are recorded inputs too) warms world, attacks, particles,
// all panel states and health-fill pipelines without unreplayable direct world mutation.
worldTest('port pipeline coverage', async ({ loaded, step, input, cheat, world }) => {
  await loaded(); await step(2);
  input.action('start');await step(3);
  input.action('p1.right');await step(22);input.action('p1.right',0);await step(1);
  input.action('p1.lp');await step(20);input.action('p1.lp',0);await step(35);
  input.action('p1.down');await step(2);input.action('p1.right');await step(2);input.action('p1.down',0);await step(2);input.action('p1.hp');await step(16);
  input.action('p1.hp',0);input.action('p1.right',0);await step(60);
  input.action('pause');await step(12);input.action('pause');await step(12);
  await cheat(FinishFight,{winner:0});await step(50);
  expect(world.resource(MatchState).phase).toBe(2);
  input.action('start');await step(10);
  await cheat(FinishFight,{winner:1});await step(50);
  input.action('start');await step(10);
  await cheat(FinishFight,{winner:2});await step(50);
});
