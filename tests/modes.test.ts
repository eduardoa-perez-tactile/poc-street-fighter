import { worldTest, expect, type TestWorld } from '@gameengine/test';
import { AIState, CombatEffect, Fighter, MatchIntent, MatchState, TrainingIntent, TrainingState } from '../src/schema.gen.ts';
function fighter(world: TestWorld, player: number) {
  const entity = world.entities(Fighter).find(e => world.get(e, Fighter).player === player)!;
  return { entity, ...world.get(entity, Fighter) };
}

worldTest('modes: solo opponent approaches and attacks without player two input', async ({ world, step, input, loaded }) => {
  await loaded(); input.emit(MatchIntent, { action: 7 }); await step(2);
  input.action('start'); await step(100);
  expect(world.resource(MatchState).phase).toBe(1);
  let cpuMoved = false;
  for (let i = 0; i < 18; i++) { await step(60); if (Math.abs(fighter(world, 1).x - 472) > 20) cpuMoved = true; }
  expect(cpuMoved).toBe(true);
  expect(world.resource(MatchState).p1Health).toBeLessThan(144);
});

worldTest('modes: local versus leaves player two under human control', async ({ world, step, input, loaded }) => {
  await loaded(); input.emit(MatchIntent, { action: 8 }); await step(2);
  input.action('start'); await step(500);
  expect(fighter(world, 1).x).toBe(472);
  expect(world.resource(MatchState).p1Health).toBe(144);
  input.action('p2.left'); await step(10);
  expect(fighter(world, 1).x).toBeLessThan(472);
});

worldTest('modes: CPU motion plans and fight timer stay frozen while paused', async ({ world, step, input, loaded }) => {
  await loaded(); input.action('start'); await step(150);
  input.action('pause'); await step(2);
  const before = world.resource(MatchState).remaining;
  const aiBefore = world.resource(AIState).held[1];
  await step(120);
  expect(world.resource(MatchState).remaining).toBe(before);
  expect(world.resource(AIState).held[1]).toBe(aiBefore);
  input.action('pause', 0); input.action('pause'); await step(2);
  expect(world.resource(MatchState).phase).toBe(1);
});

worldTest('modes: difficulty selects different CPU reaction intervals', async ({ world, step, input, loaded }) => {
  await loaded(); input.emit(MatchIntent, { action: 10 }); await step(2); input.action('start'); await step(94);
  const easy = world.resource(AIState).think[1]!;
  expect(easy).toBeGreaterThanOrEqual(20);
  input.emit(MatchIntent, { action: 2 }); await step(2);
  input.emit(MatchIntent, { action: 6 }); await step(2);
  input.emit(MatchIntent, { action: 12 }); await step(2); input.action('start', 0); input.action('start'); await step(94);
  expect(world.resource(AIState).think[1]!).toBeLessThan(20);
});

worldTest('training: clock is unlimited and dummy ignores player two keyboard', async ({ world, step, input, loaded }) => {
  await loaded(); input.emit(MatchIntent, { action: 9 }); await step(2); input.action('start'); await step(100);
  input.action('p2.left'); await step(360);
  expect(fighter(world, 1).x).toBe(472);
  expect(world.resource(MatchState).remaining).toBe(5940);
});

worldTest('training: attacks report damage, restore dummy health, and reset positions through intent', async ({ world, step, input, loaded }) => {
  await loaded(); input.emit(MatchIntent, { action: 9 }); await step(2); input.action('start'); await step(100);
  input.action('p1.right'); await step(40); input.action('p1.right', 0); await step(2);
  input.action('p1.lp'); await step(100);
  expect(world.resource(TrainingState).lastDamage).toBeGreaterThan(0);
  expect(world.resource(TrainingState).maxCombo).toBeGreaterThan(0);
  expect(world.resource(MatchState).p2Health).toBe(144);
  input.emit(TrainingIntent, { action: 1, value: 0 }); await step(2);
  expect(fighter(world, 0).x).toBe(296);
  expect(world.resource(TrainingState).damage).toBe(0);
  expect(world.resource(TrainingState).lastDamage).toBe(0);
  expect(world.resource(TrainingState).maxCombo).toBe(0);
  await step(40);
  expect(fighter(world, 0).state).toBe(0);
  expect(world.resource(MatchState).p2Health).toBe(144);
});

worldTest('training: dummy high guard blocks a projectile and box display is a recorded setting', async ({ world, step, input, loaded }) => {
  await loaded(); input.emit(MatchIntent, { action: 9 }); await step(2); input.action('start'); await step(100);
  input.emit(TrainingIntent, { action: 0, value: 1 }); input.emit(TrainingIntent, { action: 2, value: 1 }); await step(3);
  input.action('p1.down'); await step(3); input.action('p1.right'); await step(3);
  input.action('p1.down', 0); await step(3); input.action('p1.lp'); await step(2);
  input.action('p1.right', 0); input.action('p1.lp', 0);
  let sawBlock = false;
  for (let i = 0; i < 150; i++) { await step(1); if (world.events(CombatEffect).some(e => e.kind === 6)) sawBlock = true; }
  expect(sawBlock).toBe(true);
  expect(world.resource(TrainingState).maxCombo).toBe(0);
  expect(world.resource(TrainingState).showBoxes).toBe(true);
  expect(world.resource(MatchState).phase).toBe(1);
});

worldTest('training: restarting a session clears damage and combo records', async ({ world, step, input, loaded }) => {
  await loaded(); input.emit(MatchIntent, { action: 9 }); await step(2); input.action('start'); await step(5);
  input.action('p1.right'); await step(40); input.action('p1.right', 0); await step(2);
  input.action('p1.lp'); await step(100);
  expect(world.resource(TrainingState).maxCombo).toBeGreaterThan(0);
  input.emit(MatchIntent, { action: 2 }); await step(2);
  input.emit(MatchIntent, { action: 5 }); await step(3);
  expect(world.resource(TrainingState).maxCombo).toBe(0);
  expect(world.resource(TrainingState).lastDamage).toBe(0);
  expect(world.resource(TrainingState).damage).toBe(0);
});
