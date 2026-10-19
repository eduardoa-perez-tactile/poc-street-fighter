import { worldTest, expect, type TestWorld, type TestInput } from '@gameengine/test';
import { CombatInput, Fighter, MatchIntent, MatchState, MenuIntent, MenuState } from '../src/schema.gen.ts';
import { MENU_SCREEN } from '../src/match/menu.ts';
function command(world: TestWorld, input: TestInput, action: number, value = 0, screen = world.resource(MenuState).screen) {
  input.emit(MenuIntent, { action, value, screen, id: world.resource(MenuState).lastIntent + 1 });
}
function first(world: TestWorld) { const e = world.entities(Fighter).find(e => world.get(e, Fighter).player === 0)!; return world.get(e, Fighter); }
worldTest('menu: physical Enter advances title main setup fight only once per press', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2);
  input.key(38, true); await step(30);
  expect(world.resource(MenuState).screen).toBe(MENU_SCREEN.main); expect(world.resource(MatchState).phase).toBe(0);
  input.key(38, false); await step(1); input.key(38, true); await step(1);
  expect(world.resource(MenuState).screen).toBe(MENU_SCREEN.setup); expect(world.resource(MenuState).cursor).toBe(1);
  input.key(38, false); await step(1); input.key(38, true); await step(1); input.key(38, false); await step(2);
  expect(world.resource(MatchState).phase).toBe(4);
  await step(92); expect(world.resource(MatchState).phase).toBe(1);
  expect(first(world).state).toBe(0); expect(world.resource(MatchState).p1Score).toBe(0);
});
worldTest('menu: arrows and WASD wrap focus with delayed bounded repeat', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); command(world, input, 7, 1); await step(1);
  input.key(53, true); await step(1); expect(world.resource(MenuState).cursor).toBe(1);
  await step(14); expect(world.resource(MenuState).cursor).toBe(1);
  await step(1); expect(world.resource(MenuState).cursor).toBe(2);
  await step(6); expect(world.resource(MenuState).cursor).toBe(3);
  input.key(53, false); await step(1); input.key(19, true); await step(1); expect(world.resource(MenuState).cursor).toBe(0);
  input.key(19, false); await step(1); input.key(23, true); await step(1); expect(world.resource(MenuState).cursor).toBe(3);
});
worldTest('menu: UI intents are consumed once and stale screen clicks cannot start a match', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); command(world, input, 7, 1); await step(1);
  command(world, input, 6, 1); await step(2);
  expect(world.resource(MenuState).screen).toBe(2); expect(world.resource(MatchState).mode).toBe(1);
  command(world, input, 6, 0, 1); await step(2);
  expect(world.resource(MenuState).screen).toBe(2); expect(world.resource(MatchState).phase).toBe(0);
});
worldTest('menu: solo difficulty changes independently of the focused fight action', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); command(world, input, 7, 2); await step(1);
  expect(world.resource(MenuState).cursor).toBe(1);
  command(world, input, 2); await step(1); expect(world.resource(MenuState).cursor).toBe(0);
  command(world, input, 5); await step(1); expect(world.resource(MatchState).difficulty).toBe(2);
  command(world, input, 4); await step(1); expect(world.resource(MatchState).difficulty).toBe(1);
  command(world, input, 0); await step(1); expect(world.resource(MatchState).difficulty).toBe(2); expect(world.resource(MatchState).phase).toBe(0);
});
worldTest('menu: Escape pauses a live round and cannot immediately resume through the same held edge', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); input.emit(MatchIntent, { action: 8 }); await step(1); input.action('start'); await step(93);
  input.key(39, true); await step(8);
  expect(world.resource(MatchState).phase).toBe(3); expect(world.resource(MenuState).screen).toBe(3);
  input.key(39, false); await step(2); expect(world.resource(MatchState).phase).toBe(3);
  input.key(39, true); await step(2); expect(world.resource(MatchState).phase).toBe(1);
});
worldTest('menu: move list and options return to their pause focus without advancing simulation', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); input.emit(MatchIntent, { action: 8 }); await step(1); input.action('start'); await step(93);
  input.emit(MatchIntent, { action: 2 }); await step(1); const timer = world.resource(MatchState).remaining;
  command(world, input, 6, 1); await step(1); expect(world.resource(MenuState).screen).toBe(4);
  command(world, input, 1); await step(1); expect(world.resource(MenuState).cursor).toBe(1);
  command(world, input, 6, 2); await step(1); expect(world.resource(MenuState).screen).toBe(5);
  command(world, input, 1); await step(1); expect(world.resource(MenuState).screen).toBe(3); expect(world.resource(MenuState).cursor).toBe(2);
  expect(world.resource(MatchState).remaining).toBe(timer);
});
worldTest('menu: audio volume and browser options are adjustable through focused rows', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); command(world, input, 10, 1); await step(1); command(world, input, 7, 5); await step(1);
  const initial = world.resource(MenuState).music;
  command(world, input, 4); await step(1); expect(world.resource(MenuState).music).toBe(Math.max(0, initial - 10));
  command(world, input, 6, 1); await step(1); expect(world.resource(MenuState).sfx).toBe(80);
  command(world, input, 6, 2); await step(1); expect(world.resource(MenuState).browserRequest).toBe(1); expect(world.resource(MenuState).browserAction).toBe(0);
  command(world, input, 6, 3); await step(1); expect(world.resource(MenuState).browserRequest).toBe(2); expect(world.resource(MenuState).browserAction).toBe(1);
  command(world, input, 6, 4); await step(1); expect(world.resource(MenuState).screen).toBe(0);
});
worldTest('menu: retained pad confirm cannot leak a punch into an immediate training start', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2);
  // These are the recorded held/previous masks produced by pad A while confirming a menu.
  world.setResource(CombatInput, { pad: [16, 0], previous: [16, 0] });
  input.emit(MatchIntent, { action: 9 }); await step(1); input.emit(MatchIntent, { action: 0 }); await step(3);
  expect(world.resource(MatchState).phase).toBe(1); expect(first(world).state).toBe(0); expect(world.resource(CombatInput).pressed[0]).toBe(0);
});
worldTest('menu: match actions remain available directly for deterministic fixtures', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); input.emit(MatchIntent, { action: 8 }); await step(1);
  input.emit(MatchIntent, { action: 0 }); await step(1); expect(world.resource(MatchState).phase).toBe(4);
  await step(92); expect(world.resource(MatchState).phase).toBe(1);
});
worldTest('menu: pause resume pause resets focus and never bounces through a repeated Escape edge', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); input.emit(MatchIntent, { action: 8 }); await step(1); input.action('start'); await step(93);
  for (let cycle = 0; cycle < 3; cycle++) {
    input.key(39, true); await step(4);
    expect(world.resource(MatchState).phase).toBe(3); expect(world.resource(MenuState).cursor).toBe(0);
    input.key(39, false); await step(1);
    command(world, input, 3); await step(1); expect(world.resource(MenuState).cursor).toBe(1);
    input.key(39, true); await step(3); expect(world.resource(MatchState).phase).toBe(1);
    input.key(39, false); await step(2);
  }
});
worldTest('menu: each new pause suppresses a held Start confirm even when its page was already selected', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2); input.emit(MatchIntent, { action: 8 }); await step(1); input.action('start'); await step(93);
  for (let cycle = 0; cycle < 2; cycle++) {
    // SDL Start's frontend bit, paired with its recorded pause intent in the same update.
    world.setResource(MenuState, { pad: 64, previous: 0 });
    input.emit(MatchIntent, { action: 2 }); await step(3);
    expect(world.resource(MatchState).phase).toBe(3); expect(world.resource(MenuState).cursor).toBe(0);
    world.setResource(MenuState, { pad: 0 }); await step(1);
    input.emit(MatchIntent, { action: 3 }); await step(2); expect(world.resource(MatchState).phase).toBe(1);
  }
});
worldTest('menu: pointer audio adjustments focus the edited row and remain bounded', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2);
  command(world, input, 8, 30); await step(1);
  expect(world.resource(MenuState).screen).toBe(0); expect(world.resource(MenuState).cursor).toBe(0);
  command(world, input, 7, 5); await step(1);
  command(world, input, 9, 0); await step(1);
  expect(world.resource(MenuState).cursor).toBe(1); expect(world.resource(MenuState).sfx).toBe(0);
  // Keyboard adjustment follows the pointer's selected effects row and cannot underflow.
  command(world, input, 4); await step(1);
  expect(world.resource(MenuState).sfx).toBe(0); expect(world.resource(MenuState).music).toBe(30);
  command(world, input, 8, 100); await step(1);
  expect(world.resource(MenuState).cursor).toBe(0);
  command(world, input, 5); await step(1);
  expect(world.resource(MenuState).music).toBe(100); expect(world.resource(MenuState).sfx).toBe(0);
});
