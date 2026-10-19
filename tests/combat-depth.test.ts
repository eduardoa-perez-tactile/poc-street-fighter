import { worldTest, expect, type TestWorld, type TestInput } from '@gameengine/test';
import { CombatEffect, CombatInput, Fighter, MatchIntent, MatchState, Projectile } from '../src/schema.gen.ts';
import { FIGHTERS } from '../src/data/fighters.ts';
import { FinishFight } from '../src/combat/fight.cheats.ts';
import { frameForFighter, STATE_NAMES } from '../src/combat/index.ts';
import { AIR_ATTACK, BLOCK_HIGH, BLOCK_LOW, CROUCH_ATTACK, DRAGON, HURRICANE, KNOCKDOWN, THROW_TECH, WAKEUP } from '../src/combat/moves.ts';
function fighter(world: TestWorld, player: number) {
  const entity = world.entities(Fighter).find(e => world.get(e, Fighter).player === player)!;
  return { entity, ...world.get(entity, Fighter) };
}
async function setup(world: TestWorld, input: TestInput, step: (frames: number) => Promise<void>, distance = 36) {
  await step(2); world.setResource(MatchState, { mode: 1 }); input.emit(MatchIntent, { action: 0 }); await step(92);
  for (let p = 0; p < 2; p++) world.insert(fighter(world, p).entity, Fighter, { x: 384 + (p === 0 ? -1 : 1) * distance / 2 });
}
worldTest('combat depth: holding back blocks a standing strike with blockstun and pushback', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  input.action('p2.right'); input.action('p1.lp'); await step(3);
  expect(world.resource(MatchState).p2Health).toBe(144);
  expect(fighter(world, 1).state).toBe(BLOCK_HIGH); expect(fighter(world, 1).stun).toBe(10);
  expect(world.events(CombatEffect).some(e => e.kind === 6)).toBe(true);
  const x = fighter(world, 1).x;
  input.action('p2.hp'); await step(8);
  expect(fighter(world, 1).state).toBe(BLOCK_HIGH);
  await step(5); expect(fighter(world, 1).x).toBeGreaterThan(x);
});
for (const [lowGuard, damage] of [[false, 12], [true, 0]] as const) {
  worldTest(`combat depth: crouching light kick ${lowGuard ? 'is guarded by down-back' : 'beats standing back guard'}`, async ({ world, input, step, loaded }) => {
    await loaded(); await setup(world, input, step);
    input.action('p2.right'); if (lowGuard) input.action('p2.down');
    input.action('p1.down'); input.action('p1.lk'); await step(4);
    expect(world.resource(MatchState).p2Health).toBe(144 - damage);
    expect(fighter(world, 0).state).toBe(CROUCH_ATTACK + 3);
    if (lowGuard) expect(fighter(world, 1).state).toBe(BLOCK_LOW);
  });
}
worldTest('combat depth: airborne overhead defeats low guard', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  world.insert(fighter(world, 0).entity, Fighter, { state: 4, y: 195, vy: 0 });
  input.action('p2.right'); input.action('p2.down'); input.action('p1.lk'); await step(4);
  expect(fighter(world, 0).state).toBe(AIR_ATTACK + 3);
  expect(world.resource(MatchState).p2Health).toBe(132);
});
worldTest('combat depth: blocking a projectile takes nonlethal chip and destroys the shot', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 120);
  world.setResource(MatchState, { p2Health: 3 }); input.action('p2.right'); await step(1);
  let target = fighter(world, 1);
  world.spawn({ Projectile: { player: 0, x: target.x - 8, y: 160, facing: 1, strength: 0 } }); await step(1);
  expect(world.resource(MatchState).p2Health).toBe(1); expect(fighter(world, 1).state).toBe(BLOCK_HIGH);
  await step(8); target = fighter(world, 1);
  world.spawn({ Projectile: { player: 0, x: target.x - 8, y: 160, facing: 1, strength: 0 } }); await step(1);
  expect(world.resource(MatchState).p2Health).toBe(1); expect(world.resource(MatchState).phase).toBe(1);
});
worldTest('combat depth: a buffered attack fires when recovery ends inside five frames', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 176);
  world.insert(fighter(world, 0).entity, Fighter, { state: 13, frame: 7 });
  input.action('p1.hp'); await step(1); input.action('p1.hp', 0); await step(2);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('heavy-punch'); expect(fighter(world, 0).frame).toBe(0);
});
worldTest('combat depth: buffered attacks expire after five frames instead of repeating later', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 176);
  world.insert(fighter(world, 0).entity, Fighter, { state: 13, frame: 1 });
  input.action('p1.hp'); await step(1); input.action('p1.hp', 0); await step(9);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('idle'); expect(world.resource(CombatInput).buffered[0]).toBe(0);
});
worldTest('combat depth: heavy crouching kick sweeps into protected knockdown and wakeup', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  input.action('p1.down'); input.action('p1.hk'); await step(8);
  expect(world.resource(MatchState).p2Health).toBe(116); expect(fighter(world, 1).state).toBe(KNOCKDOWN);
  await step(15 + 45); expect(fighter(world, 1).state).toBe(WAKEUP); expect(fighter(world, 1).invulnerable).toBe(12);
  await step(12); expect(STATE_NAMES[fighter(world, 1).state]).toBe('idle');
});
worldTest('combat depth: a throw bypasses guard and knocks down for twenty four damage', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  input.action('p2.down'); input.action('p2.right'); input.action('p1.throw'); await step(6);
  expect(world.resource(MatchState).p2Health).toBe(120); expect(fighter(world, 1).state).toBe(KNOCKDOWN);
  expect(world.events(CombatEffect).some(e => e.kind === 7)).toBe(true);
});
worldTest('combat depth: simultaneous throws tech symmetrically with no damage', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  input.action('p1.throw'); input.action('p2.throw'); await step(6);
  expect(fighter(world, 0).state).toBe(THROW_TECH); expect(fighter(world, 1).state).toBe(THROW_TECH);
  expect(world.resource(MatchState).p1Health).toBe(144); expect(world.resource(MatchState).p2Health).toBe(144);
});
worldTest('combat depth: throws whiff outside range and cannot grab airborne targets', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 90);
  input.action('p1.throw'); await step(7); expect(world.resource(MatchState).p2Health).toBe(144);
  input.action('p1.throw', 0); await step(25);
  world.insert(fighter(world, 1).entity, Fighter, { x: fighter(world, 0).x + 36, state: 4, y: 160, vy: -100 });
  input.action('p1.throw'); await step(7); expect(world.resource(MatchState).p2Health).toBe(144);
});
worldTest('combat depth: dragon punch motion launches with startup invulnerability and a knockdown hit', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 60);
  input.action('p1.right'); await step(1); input.action('p1.right', 0); input.action('p1.down'); await step(1);
  input.action('p1.right'); input.action('p1.hp'); await step(1);
  expect(fighter(world, 0).state).toBe(DRAGON); expect(fighter(world, 0).invulnerable).toBe(6);
  await step(4); expect(fighter(world, 0).y).toBeLessThan(216);
  expect(world.resource(MatchState).p2Health).toBe(116); expect(fighter(world, 1).state).toBe(KNOCKDOWN);
});
worldTest('combat depth: hurricane quarter circle back travels and hits once', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 80);
  input.action('p1.down'); await step(1); input.action('p1.left'); await step(1); input.action('p1.down', 0); await step(1);
  input.action('p1.hk'); await step(1); input.action('p1.left', 0);
  expect(fighter(world, 0).state).toBe(HURRICANE);
  const x = fighter(world, 0).x; await step(30);
  expect(fighter(world, 0).x).toBeGreaterThan(x); expect(world.resource(MatchState).p2Health).toBe(116);
  await step(50); expect(world.resource(MatchState).p2Health).toBe(116);
});
worldTest('combat depth: input during impact freeze buffers only the final five frames', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 176);
  world.setResource(MatchState, { hitStop: 3 });
  input.action('p1.mp'); await step(1); input.action('p1.mp', 0); await step(3);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('medium-punch');
});
for (const [button, damage] of [['lp', 12], ['mp', 20], ['hp', 28], ['lk', 12], ['mk', 20], ['hk', 28]] as const) {
  for (const posture of ['crouch', 'air'] as const) {
    worldTest(`combat depth: ${posture} ${button} has a working strength-specific active hit`, async ({ world, input, step, loaded }) => {
      await loaded(); await setup(world, input, step);
      if (posture === 'crouch') input.action('p1.down');
      else world.insert(fighter(world, 0).entity, Fighter, { state: 4, y: 190, vy: 0 });
      input.action(`p1.${button}`); await step(12);
      expect(world.resource(MatchState).p2Health).toBe(144 - damage);
      expect(fighter(world, 0).attackHit).toBe(true);
    });
  }
}
worldTest('combat depth: a standing back guard blocks an airborne overhead', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  world.insert(fighter(world, 0).entity, Fighter, { state: 4, y: 195, vy: 0 });
  input.action('p2.right'); input.action('p1.lk'); await step(4);
  expect(world.resource(MatchState).p2Health).toBe(144); expect(fighter(world, 1).state).toBe(BLOCK_HIGH);
});
worldTest('combat depth: a late blockstun input executes from the five-frame buffer', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 176);
  world.insert(fighter(world, 1).entity, Fighter, { state: BLOCK_HIGH, stun: 4 });
  input.action('p2.hp'); await step(1); input.action('p2.hp', 0); await step(3);
  expect(STATE_NAMES[fighter(world, 1).state]).toBe('heavy-punch'); expect(fighter(world, 1).frame).toBe(0);
});
worldTest('combat depth: dragon startup invulnerability rejects an overlapping projectile', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 176);
  input.action('p1.right'); await step(1); input.action('p1.right', 0); input.action('p1.down'); await step(1);
  input.action('p1.right'); input.action('p1.hp'); await step(1);
  const f = fighter(world, 0);
  world.spawn({ Projectile: { player: 1, x: f.x + 4, y: 160, facing: -1, strength: 2 } }); await step(1);
  expect(fighter(world, 0).state).toBe(DRAGON); expect(world.resource(MatchState).p1Health).toBe(144);
});
worldTest('combat depth: R is the first-player throw key', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  input.key(18, true); await step(6);
  expect(world.resource(MatchState).p2Health).toBe(120); expect(fighter(world, 1).state).toBe(KNOCKDOWN);
});
worldTest('combat depth: a completed quarter circle can cancel a standing punch into Hadouken', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 176);
  input.action('p1.down'); await step(1); input.action('p1.right'); await step(1); input.action('p1.down', 0); await step(1);
  world.insert(fighter(world, 0).entity, Fighter, { state: 15, frame: 10 });
  input.action('p1.lp'); await step(1);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('special-1');
});
for (const [frame, stun, combo] of [[29, 2, 2], [30, 1, 1]] as const) {
  worldTest(`combat depth: a projectile on ${combo === 2 ? 'the last stunned' : 'the first actionable'} frame ${combo === 2 ? 'continues' : 'resets'} the true combo`, async ({ world, input, step, loaded }) => {
    await loaded(); await setup(world, input, step, 176);
    const target = fighter(world, 1);
    world.insert(target.entity, Fighter, { state: 19, frame, stun, comboHits: 1, vx: 0 });
    world.spawn({ Projectile: { player: 0, x: target.x + 8, y: 160, facing: 1, strength: 2 } }); await step(1);
    expect(world.resource(MatchState).p2Health).toBe(116); expect(fighter(world, 1).comboHits).toBe(combo);
  });
}
worldTest('combat depth: one active Hadouken per player prevents projectile stacking and recovers after impact', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 320);
  const quarterCircle = async () => {
    input.action('p1.down'); await step(1); input.action('p1.right'); await step(1); input.action('p1.down', 0); await step(1);
    input.action('p1.lp'); await step(1); input.action('p1.lp', 0); input.action('p1.right', 0);
  };
  await quarterCircle(); await step(54);
  const active = world.entities(Projectile).filter(e => world.get(e, Projectile).state === 0);
  expect(active.length).toBe(1);
  await quarterCircle(); expect(STATE_NAMES[fighter(world, 0).state] === 'special-1').toBe(false);
  expect(world.entities(Projectile).filter(e => world.get(e, Projectile).state === 0).length).toBe(1);
  world.insert(active[0]!, Projectile, { state: 1, frame: 0 });
  // The denied special became a crouching normal; finish its real recovery before trying again.
  await step(15);
  await quarterCircle(); expect(STATE_NAMES[fighter(world, 0).state]).toBe('special-1');
  await step(14);
  expect(world.entities(Projectile).filter(e => world.get(e, Projectile).state === 0).length).toBe(1);
});

worldTest('combat depth: KO fall reaches prone and stays dead throughout the final match result', async ({ world, input, step, loaded, cheat }) => {
  await loaded(); await step(2);
  input.emit(MatchIntent, { action: 8 }); await step(1);
  input.emit(MatchIntent, { action: 0 }); await step(92);
  // FinishFight is a recorded input; both the first-round fall and final result replay.
  for (let round = 0; round < 2; round++) {
    await cheat(FinishFight, { winner: 1 }); await step(20);
    const loser = fighter(world, 0);
    expect(loser.state).toBe(KNOCKDOWN);
    expect(frameForFighter(FIGHTERS[0], loser.state, loser.frame).sprite.endsWith('/extra-down')).toBe(true);
    expect(loser.y).toBe(216); expect(world.resource(MatchState).p1Health).toBe(0);
    await step(130);
    if (round === 0) await step(92);
  }
  expect(world.resource(MatchState).phase).toBe(5);
  input.action('p1.up'); input.action('p1.hp'); await step(60);
  const loser = fighter(world, 0);
  expect(loser.state).toBe(KNOCKDOWN); expect(loser.frame).toBe(44);
  expect(frameForFighter(FIGHTERS[0], loser.state, loser.frame).sprite.endsWith('/extra-down')).toBe(true);
  expect(world.resource(MatchState).p1Health).toBe(0); expect(loser.y).toBe(216);
  expect(STATE_NAMES[fighter(world, 1).state]).toBe('winner-pose');
});

worldTest('combat depth: double KO falls both fighters and a timeout loser settles on the floor', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  world.setResource(MatchState, { p1Health: 12, p2Health: 12 });
  input.action('p1.lp'); input.action('p2.lp'); await step(23);
  expect(world.resource(MatchState).winner).toBe(2);
  for (let player = 0; player < 2; player++) {
    const f = fighter(world, player);
    expect(f.state).toBe(KNOCKDOWN); expect(frameForFighter(FIGHTERS[player]!, f.state, f.frame).sprite.endsWith('/extra-down')).toBe(true);
  }
  // A separate alive timeout pose never remains suspended in the air.
  world.setResource(MatchState, { phase: 2, phaseTicks: 150, winner: 1, p1Health: 100, p2Health: 120 });
  world.insert(fighter(world, 0).entity, Fighter, { state: 4, y: 140, vy: -100 }); await step(1);
  expect(fighter(world, 0).y).toBe(216); expect(STATE_NAMES[fighter(world, 0).state]).toBe('idle');
});
