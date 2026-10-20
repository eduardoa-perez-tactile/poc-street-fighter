import { Sprite } from '@gameengine/runtime';
import { expect, renderTest, worldTest } from '@gameengine/test';
import { Fighter, MatchIntent, MatchState, MenuIntent, MenuState, TrainingIntent } from '../src/schema.gen.ts';
import { ArrangeFight, FinishFight } from '../src/combat/fight.cheats.ts';

for (const [name, width, height] of [['classic',1152,672],['wide',1600,900],['ultrawide',2100,900],['compact',1024,768]] as const) {
  renderTest(`arena fits ${name}`, async ({ loaded, input, step, world, render }) => {
    input.view(width,height,1);
    await loaded(); await step(2);
    input.emit(MatchIntent,{action:8}); await step(2);
    input.emit(MatchIntent,{action:0}); await step(220);
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
  const menu = async (action: number, value = 0) => {
    const state = world.resource(MenuState);
    input.emit(MenuIntent, { action, value, id: state.lastIntent + 1, screen: state.screen });
    await step(5);
  };
  await menu(0); // Title -> main menu.
  await menu(7, 2); // Fixed matchup setup.
  await menu(1);
  await menu(7, 5); // Options; actual audio changes are recorded inputs too.
  await menu(4);
  await menu(1);
  input.emit(MatchIntent,{action:8}); await step(2);
  input.action('start'); await step(185);
  await cheat(ArrangeFight,{distance:48});
  input.action('p1.lp'); await step(20); input.action('p1.lp',0); await step(35);
  input.action('p1.down'); await step(2); input.action('p1.right'); await step(2);
  input.action('p1.down',0); await step(2); input.action('p1.hp'); await step(16);
  input.action('p1.hp',0); input.action('p1.right',0); await step(60);
  input.emit(MatchIntent,{action:2}); await step(12);
  await menu(7, 4); // Move list, then return to the paused arena.
  await menu(1);
  input.emit(MatchIntent,{action:3}); await step(12);
  await cheat(FinishFight,{winner:0}); await step(50);
  expect(world.resource(MatchState).phase).toBe(2);
  await step(200);
  await cheat(FinishFight,{winner:0}); await step(151);
  expect(world.resource(MatchState).phase).toBe(5);
  input.emit(MatchIntent,{action:1}); await step(185);
  await cheat(FinishFight,{winner:1}); await step(241);
  await cheat(FinishFight,{winner:1}); await step(151);
  expect(world.resource(MatchState).matchWinner).toBe(1);
  input.emit(MatchIntent,{action:1}); await step(185);
  await cheat(FinishFight,{winner:2}); await step(151);
  input.emit(MatchIntent,{action:2}); await step(2);
  input.emit(MatchIntent,{action:6}); await step(2);
  input.emit(MatchIntent,{action:9}); await step(2);
  input.emit(MatchIntent,{action:0}); await step(3);
  input.emit(TrainingIntent,{action:2,value:1}); await step(5);
  await cheat(ArrangeFight,{distance:48});
  input.action('p1.down'); input.action('p1.hk'); await step(95);
  input.action('p1.down',0); input.action('p1.hk',0);
  input.emit(TrainingIntent,{action:1,value:0}); await step(3);
  input.emit(TrainingIntent,{action:0,value:1}); await step(3);
  input.emit(TrainingIntent,{action:2,value:0}); await step(3);
});

// Recorded inputs visit every stage, including a fresh versus transition for each match.
worldTest('arcade stage pipeline coverage', async ({ loaded, step, input, world }) => {
  await loaded(); await step(2);
  input.emit(MatchIntent, { action: 8 }); await step(2);
  for (let stageId = 0; stageId < 5; stageId++) {
    const send = async (action: number, value = 0) => {
      const menu = world.resource(MenuState);
      input.emit(MenuIntent, { action, value, screen: menu.screen, id: menu.lastIntent + 1 });
      await step(3);
    };
    await send(7, 2);
    if (stageId > 0) await send(6, 2);
    input.emit(MatchIntent, { action: 0 }); await step(190);
    expect(world.resource(MatchState).stageId).toBe(stageId);
    input.emit(MatchIntent, { action: 2 }); await step(3);
    input.emit(MatchIntent, { action: 6 }); await step(3);
  }
});
