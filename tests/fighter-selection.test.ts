import { expect, worldTest } from '@gameengine/test';
import { Fighter, MatchIntent, MatchState } from '../src/schema.gen.ts';

worldTest('selection: swapping fighters preserves input seats and the choice across rounds', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2);
  world.setResource(MatchState, { mode: 1, p1Fighter: 1, p2Fighter: 0 });
  input.emit(MatchIntent, { action: 0 }); await step(190);
  const seat = (player: number) => world.entities(Fighter).find(e => world.get(e, Fighter).player === player)!;
  expect(world.get(seat(0), Fighter).fighterId).toBe(1);
  expect(world.get(seat(1), Fighter).fighterId).toBe(0);
  const p1 = world.get(seat(0), Fighter).x, p2 = world.get(seat(1), Fighter).x;
  input.action('p1.right'); await step(8); input.action('p1.right', 0); await step(1);
  expect(world.get(seat(0), Fighter).x).toBeGreaterThan(p1);
  expect(world.get(seat(1), Fighter).x).toBe(p2);
  world.setResource(MatchState, { remaining: 1, p1Health: 144, p2Health: 100 }); await step(1);
  await step(250);
  expect(world.resource(MatchState).round).toBe(2);
  expect(world.get(seat(0), Fighter).fighterId).toBe(1);
  expect(world.get(seat(1), Fighter).fighterId).toBe(0);
});

worldTest('selection: rematch retains fighters and stage while resetting the score', async ({ loaded, world, input, step }) => {
  await loaded(); await step(2);
  world.setResource(MatchState, { mode: 1, p1Fighter: 1, p2Fighter: 0, stageId: 1 });
  input.emit(MatchIntent, { action: 0 }); await step(190);
  world.setResource(MatchState, { phase: 5, p1Wins: 2, p1Score: 1000 });
  input.emit(MatchIntent, { action: 1 }); await step(190);
  const match = world.resource(MatchState);
  expect(match.phase).toBe(1); expect(match.p1Wins).toBe(0); expect(match.p1Score).toBe(0);
  expect(match.stageId).toBe(1); expect(match.p1Fighter).toBe(1); expect(match.p2Fighter).toBe(0);
});
