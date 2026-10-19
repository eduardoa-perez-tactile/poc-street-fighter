import { expect, worldTest, renderTest } from '@gameengine/test';
import { CombatInput, Fighter, MatchIntent, MatchState } from '../src/schema.gen.ts';

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

renderTest('match menus select modes difficulty and adjust saved audio settings', async ({ input, loaded, step, world, render, ui, audio }) => {
  input.view(1152, 672, 1); await loaded(); await step(2);
  render.stats({ width: 1152, height: 672 });
  await ui.press('training'); await step(2);
  expect(world.resource(MatchState).mode).toBe(2);
  render.stats({ width: 1152, height: 672 });
  await ui.press('difficulty'); await step(2);
  expect(world.resource(MatchState).difficulty).toBe(2);
  render.stats({ width: 1152, height: 672 });
  await ui.press('settings'); await step(2);
  render.stats({ width: 1152, height: 672 });
  const musicBefore = audio.status().buses.Music!;
  await ui.press('music-down'); await step(2);
  expect(audio.status().buses.Music!).toBeLessThan(musicBefore);
  render.stats({ width: 1152, height: 672 });
  const sfxBefore = audio.status().buses.SFX!;
  await ui.press('sfx-down'); await step(2);
  expect(audio.status().buses.SFX!).toBeLessThan(sfxBefore);
  render.stats({ width: 1152, height: 672 });
  await ui.press('close-settings'); await step(2);
  render.stats({ width: 1152, height: 672 });
  await ui.press('start'); await step(2);
  expect(world.resource(MatchState).phase).toBe(1);
});

renderTest('settings modal captures Enter and Escape without starting or resuming a fight', async ({ input, loaded, step, world, render, ui }) => {
  input.view(1152, 672, 1); await loaded(); await step(2);
  render.stats({ width: 1152, height: 672 });
  await ui.press('settings'); await step(2);
  expect(world.resource(MatchState).settingsOpen).toBe(true);
  input.key(38, true); await step(2); input.key(38, false); await step(1);
  expect(world.resource(MatchState).phase).toBe(0);
  expect(world.resource(MatchState).settingsOpen).toBe(true);
  input.key(39, true); await step(2); input.key(39, false); await step(1);
  expect(world.resource(MatchState).phase).toBe(0);
  expect(world.resource(MatchState).settingsOpen).toBe(false);
  render.stats({ width: 1152, height: 672 });
  await ui.press('start'); await step(92);
  input.key(39, true); await step(2); input.key(39, false); await step(1);
  expect(world.resource(MatchState).phase).toBe(3);
  render.stats({ width: 1152, height: 672 });
  await ui.press('settings'); await step(2);
  const remaining = world.resource(MatchState).remaining;
  input.key(38, true); await step(2); input.key(38, false); await step(1);
  expect(world.resource(MatchState).phase).toBe(3);
  input.key(39, true); await step(2); input.key(39, false); await step(1);
  expect(world.resource(MatchState).settingsOpen).toBe(false);
  expect(world.resource(MatchState).phase).toBe(3);
  expect(world.resource(MatchState).remaining).toBe(remaining);
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
