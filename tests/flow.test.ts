import { expect, worldTest, renderTest } from '@gameengine/test';
import { press } from './ui-flow.helpers.ts';
import { CombatInput, Fighter, MatchIntent, MatchState, MenuState } from '../src/schema.gen.ts';

worldTest('match flow: round intro is timed and pause preserves its countdown', async ({ input, loaded, step, world }) => {
  await loaded();
  input.emit(MatchIntent, { action: 8 }); await step(2);
  input.emit(MatchIntent, { action: 0 }); await step(1);
  expect(world.resource(MatchState).phase).toBe(4);
  expect(world.resource(MatchState).remaining).toBe(5940);
  await step(20);
  input.emit(MatchIntent, { action: 2 }); await step(1);
  const ticks = world.resource(MatchState).phaseTicks;
  await step(100);
  expect(world.resource(MatchState).phase).toBe(3);
  expect(world.resource(MatchState).phaseTicks).toBe(ticks);
  input.emit(MatchIntent, { action: 3 }); await step(1);
  expect(world.resource(MatchState).phase).toBe(4);
  await step(90);
  expect(world.resource(MatchState).phase).toBe(1);
  expect(world.resource(MatchState).remaining).toBeLessThan(5940);
});

worldTest('match flow: two round wins complete a match and rematch clears its score', async ({ input, loaded, step, world }) => {
  await loaded();
  input.emit(MatchIntent, { action: 8 }); await step(2);
  input.emit(MatchIntent, { action: 0 }); await step(92);
  world.setResource(MatchState, { p2Health: 0 }); await step(1);
  expect(world.resource(MatchState).phase).toBe(2);
  expect(world.resource(MatchState).p1Wins).toBe(1);
  await step(150);
  expect(world.resource(MatchState).phase).toBe(4);
  expect(world.resource(MatchState).round).toBe(2);
  await step(92);
  world.setResource(MatchState, { p2Health: 0 }); await step(1);
  expect(world.resource(MatchState).p1Wins).toBe(2);
  await step(150);
  expect(world.resource(MatchState).phase).toBe(5);
  expect(world.resource(MatchState).matchWinner).toBe(0);
  input.emit(MatchIntent, { action: 1 }); await step(1);
  expect(world.resource(MatchState).phase).toBe(4);
  expect(world.resource(MatchState).round).toBe(1);
  expect(world.resource(MatchState).p1Wins).toBe(0);
  expect(world.resource(MatchState).p2Wins).toBe(0);
  expect(world.resource(MatchState).p1Score).toBe(0);
});

worldTest('match flow: a draw repeats its round and awards neither player', async ({ input, loaded, step, world }) => {
  await loaded();
  input.emit(MatchIntent, { action: 8 }); await step(2);
  input.emit(MatchIntent, { action: 0 }); await step(92);
  world.setResource(MatchState, { remaining: 1 }); await step(1);
  expect(world.resource(MatchState).winner).toBe(2);
  await step(150);
  expect(world.resource(MatchState).phase).toBe(4);
  expect(world.resource(MatchState).round).toBe(1);
  expect(world.resource(MatchState).p1Wins).toBe(0);
  expect(world.resource(MatchState).p2Wins).toBe(0);
});

worldTest('match flow: held movement survives the automatic next round without another input edge', async ({ input, loaded, step, world }) => {
  await loaded();
  input.emit(MatchIntent, { action: 8 }); await step(2);
  input.action('start'); await step(92);
  input.action('p1.right'); await step(10);
  const player = world.entities(Fighter).find(e => world.get(e, Fighter).player === 0)!;
  expect(world.get(player, Fighter).x).toBeGreaterThan(296);
  // End this round while the physical input stays held, then let the real lifecycle advance.
  world.setResource(MatchState, { remaining: 1 }); await step(1);
  expect(world.resource(MatchState).phase).toBe(2);
  await step(150);
  expect(world.resource(MatchState).phase).toBe(4);
  expect(world.resource(CombatInput).actions[0]).toBe(2);
  await step(105);
  expect(world.resource(MatchState).phase).toBe(1);
  expect(world.get(player, Fighter).x).toBeGreaterThan(296);
  input.action('p1.right', 0); await step(2);
  const stopped = world.get(player, Fighter).x; await step(10);
  expect(world.get(player, Fighter).x).toBe(stopped);
});

renderTest('arcade menus select difficulty training and decrease or increase audio with pointer arrows', async (c) => {
  c.input.view(1152, 672, 1); await c.loaded(); await c.step(2);
  await press(c, 'press-start'); await press(c, 'solo'); await press(c, 'difficulty');
  expect(c.world.resource(MatchState).difficulty).toBe(2);
  await press(c, 'back'); await press(c, 'options');
  const music = c.world.resource(MenuState).music;
  await press(c, 'music.down'); expect(c.world.resource(MenuState).music).toBe(Math.max(0, music - 10));
  await press(c, 'music.up'); expect(c.world.resource(MenuState).music).toBe(music);
  const effects = c.world.resource(MenuState).sfx;
  await press(c, 'effects.down'); expect(c.world.resource(MenuState).sfx).toBe(Math.max(0, effects - 10));
  await press(c, 'effects.up'); expect(c.world.resource(MenuState).sfx).toBe(effects);
  await press(c, 'back'); await press(c, 'training'); await press(c, 'fight'); await c.step(92);
  expect(c.world.resource(MatchState).phase).toBe(1);
});
renderTest('options capture Enter and Escape without starting or resuming a fight', async (c) => {
  c.input.view(1152, 672, 1); await c.loaded(); await c.step(2);
  await press(c, 'press-start'); await press(c, 'options');
  c.input.key(38, true); await c.step(2); c.input.key(38, false); await c.step(1);
  expect(c.world.resource(MatchState).phase).toBe(0); expect(c.world.resource(MenuState).screen).toBe(5);
  c.input.key(39, true); await c.step(2); c.input.key(39, false); await c.step(1);
  expect(c.world.resource(MenuState).screen).toBe(1);
  await press(c, 'local'); await press(c, 'fight'); await c.step(92); await press(c, 'pause'); await press(c, 'options');
  const remaining = c.world.resource(MatchState).remaining;
  c.input.key(38, true); await c.step(2); c.input.key(38, false); await c.step(1);
  expect(c.world.resource(MatchState).phase).toBe(3);
  c.input.key(39, true); await c.step(2); c.input.key(39, false); await c.step(1);
  expect(c.world.resource(MenuState).screen).toBe(3); expect(c.world.resource(MatchState).remaining).toBe(remaining);
});
