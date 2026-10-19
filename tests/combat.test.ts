import { worldTest, expect, type TestWorld, type TestInput } from '@gameengine/test';
import { Sprite } from '@gameengine/runtime';
import { CombatEffect, CombatInput, Fighter, MatchIntent, MatchState, Projectile } from '../src/schema.gen.ts';
import { FIGHTERS } from '../src/data/fighters.ts';
import { actualBox, frameForFighter, STATE_NAMES } from '../src/combat/index.ts';

function fighter(world: TestWorld, player: number) {
  const entity = world.entities(Fighter).find(e => world.get(e, Fighter).player === player)!;
  return { entity, ...world.get(entity, Fighter) };
}
function close(world: TestWorld, distance = 48) {
  world.insert(fighter(world, 0).entity, Fighter, { x: 384 - distance / 2 });
  world.insert(fighter(world, 1).entity, Fighter, { x: 384 + distance / 2 });
}

async function startLocal(world: TestWorld, input: TestInput, step: (frames: number) => Promise<void>) {
  world.setResource(MatchState, { mode: 1 });
  input.emit(MatchIntent, { action: 0 });
  await step(92);
  expect(world.resource(MatchState).phase).toBe(1);
}

worldTest('combat: combat starts ready and a start intent begins a 99 second round', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2);
  expect(world.entities(Fighter).length).toBe(2);
  expect(world.resource(MatchState).phase).toBe(0);
  expect(world.resource(MatchState).remaining).toBe(5940);
  await startLocal(world, input, step);
  expect(world.resource(MatchState).phase).toBe(1);
  const before = world.resource(MatchState).remaining;
  await step(60);
  expect(world.resource(MatchState).remaining).toBe(before - 60);
});

worldTest('combat: independent keyboard seats move and key releases stop movement', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  input.key(4, true); input.key(51, true); await step(10);
  expect(fighter(world, 0).x).toBeGreaterThan(296);
  expect(fighter(world, 1).x).toBeGreaterThan(472);
  input.key(4, false); input.key(51, false); await step(1);
  const x = fighter(world, 0).x;
  await step(10); expect(fighter(world, 0).x).toBe(x);
});

worldTest('combat: crouch transitions release and a directional jump lands at the floor', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  input.action('p1.down'); await step(8);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('crouch');
  input.action('p1.down', 0); await step(8);
  input.action('p1.right'); input.action('p1.up'); await step(10);
  expect(fighter(world, 0).y).toBeLessThan(216);
  input.action('p1.right', 0); input.action('p1.up', 0); await step(70);
  expect(fighter(world, 0).y).toBe(216);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('idle');
});

worldTest('combat: body push and shared arena bounds keep both fighters visible', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  input.action('p1.right'); input.action('p2.left'); await step(120);
  expect(fighter(world, 1).x - fighter(world, 0).x).toBeGreaterThanOrEqual(31.99);
  input.action('p1.right', 0); input.action('p2.left', 0);
  input.action('p1.left'); input.action('p2.right'); await step(500);
  const a = fighter(world, 0), b = fighter(world, 1);
  expect(a.x).toBeGreaterThanOrEqual(24); expect(b.x).toBeLessThanOrEqual(744);
  expect(Math.abs(b.x - a.x)).toBeLessThanOrEqual(320.01);
});

worldTest('combat: light punch has startup, strikes once and freezes both fighters for hit stop', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step); close(world);
  input.action('p1.lp'); await step(2);
  expect(world.resource(MatchState).p2Health).toBe(144);
  await step(1);
  expect(world.resource(MatchState).p2Health).toBe(132);
  expect(world.resource(MatchState).hitStop).toBe(15);
  const before = fighter(world, 1);
  await step(10);
  expect(fighter(world, 1).x).toBe(before.x); expect(fighter(world, 1).frame).toBe(before.frame);
  await step(70);
  expect(world.resource(MatchState).p2Health).toBe(132);
  expect(world.resource(MatchState).p1Score).toBe(100);
});

for (const [action, damage] of [['mp', 20], ['hp', 28], ['lk', 12], ['mk', 20], ['hk', 28]] as const) {
  worldTest(`combat: ${action} normal uses its source active frames and strength damage`, async ({ world, step, input, loaded }) => {
  await loaded();
    await step(2); await startLocal(world, input, step); close(world, 36);
    input.action(`p1.${action}`); await step(90);
    expect(world.resource(MatchState).p2Health).toBe(144 - damage);
  });
}

worldTest('combat: simultaneous punches trade without player update priority', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step); close(world);
  input.action('p1.lp'); input.action('p2.lp'); await step(3);
  expect(world.resource(MatchState).p1Health).toBe(132);
  expect(world.resource(MatchState).p2Health).toBe(132);
  expect(world.resource(MatchState).p1Score).toBe(100);
  expect(world.resource(MatchState).p2Score).toBe(100);
});

worldTest('combat: a body contact still hits when the head hurt box misses', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step); close(world, 36);
  world.insert(fighter(world, 1).entity, Fighter, { state: 4, y: 190, vy: 0 });
  input.action('p1.lp'); await step(90);
  expect(world.resource(MatchState).p2Health).toBe(132);
});

worldTest('combat: mirrored collision boxes and sprites use the same frame selection', async ({ step, loaded }) => {
  await loaded();
  await step(1);
  const frame = frameForFighter(FIGHTERS[0], 13, 2);
  expect(frame.sprite.endsWith('light-punch-2')).toBe(true);
  const right = actualBox(frame.hit, 100, 216, 1), left = actualBox(frame.hit, 100, 216, -1);
  expect(right[0] + left[0] + left[2]).toBe(200);
});

for (const [punch, speed] of [['lp', 150], ['mp', 220], ['hp', 300]] as const) {
  worldTest(`combat: quarter circle ${punch} spawns a projectile at speed ${speed}`, async ({ world, step, input, loaded }) => {
  await loaded();
    await step(2); await startLocal(world, input, step);
    input.action('p1.down'); await step(2);
    input.action('p1.right'); await step(2);
    input.action('p1.down', 0); await step(1);
    input.action(`p1.${punch}`); await step(14);
    expect(STATE_NAMES[fighter(world, 0).state]).toBe('special-1');
    const entity = world.entities(Projectile)[0]!;
    expect(entity === undefined).toBe(false);
    const x = world.get(entity, Projectile).x;
    await step(1);
    expect(Math.abs(world.get(entity, Projectile).x - x - speed / 60)).toBeLessThan(0.001);
  });
}

worldTest('combat: expired quarter circle cannot launch a special', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  input.action('p1.down'); await step(1); input.action('p1.right'); await step(1);
  input.action('p1.down', 0); await step(30); input.action('p1.lp'); await step(15);
  expect(world.entities(Projectile).length).toBe(0);
});

worldTest('combat: opposing projectiles cancel and cannot damage after collision', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  world.spawn({ Projectile: { player: 0, x: 380, y: 159, facing: 1, strength: 0 } });
  world.spawn({ Projectile: { player: 1, x: 388, y: 159, facing: -1, strength: 2 } });
  await step(1);
  for (const entity of world.entities(Projectile)) expect(world.get(entity, Projectile).state).toBe(1);
  await step(30);
  expect(world.entities(Projectile).length).toBe(0);
  expect(world.resource(MatchState).p1Health).toBe(144);
  expect(world.resource(MatchState).p2Health).toBe(144);
});

worldTest('combat: projectile body contacts damage once and then expire', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  world.spawn({ Projectile: { player: 0, x: 458, y: 160, facing: 1, strength: 0 } });
  await step(1);
  expect(world.resource(MatchState).p2Health).toBe(116);
  await step(90);
  expect(world.resource(MatchState).p2Health).toBe(116);
  expect(world.entities(Projectile).length).toBe(0);
});

worldTest('combat: pause freezes countdown and movement then resumes', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  input.emit(MatchIntent, { action: 2 }); input.action('p1.right'); await step(1);
  const remaining = world.resource(MatchState).remaining, x = fighter(world, 0).x;
  await step(60);
  expect(world.resource(MatchState).remaining).toBe(remaining); expect(fighter(world, 0).x).toBe(x);
  input.emit(MatchIntent, { action: 3 }); await step(2);
  expect(fighter(world, 0).x).toBeGreaterThan(x);
});

worldTest('combat: KO records one result and next round clears buffered attacks and projectiles', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step); close(world);
  world.setResource(MatchState, { p2Health: 12 });
  input.action('p1.lp'); await step(3);
  expect(world.resource(MatchState).phase).toBe(2); expect(world.resource(MatchState).winner).toBe(0);
  expect(world.resource(MatchState).p1Wins).toBe(1);
  await step(60); expect(world.resource(MatchState).p1Wins).toBe(1);
  await step(185);
  expect(world.resource(MatchState).phase).toBe(1); expect(world.resource(MatchState).round).toBe(2);
  expect(world.resource(MatchState).p2Health).toBe(144); expect(fighter(world, 0).x).toBe(296);
  expect(world.resource(CombatInput).held[0]).toBe(16);
  expect(world.resource(CombatInput).buffered[0]).toBe(0);
  expect(fighter(world, 0).state).toBe(0);
  expect(world.entities(Projectile).length).toBe(0);
});

worldTest('combat: simultaneous KO produces a stable draw', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step); close(world);
  world.setResource(MatchState, { p1Health: 12, p2Health: 12 });
  input.action('p1.lp'); input.action('p2.lp'); await step(3);
  expect(world.resource(MatchState).winner).toBe(2); expect(world.resource(MatchState).phase).toBe(2);
});

worldTest('combat: timeout compares health and equal health draws', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  world.setResource(MatchState, { remaining: 1, p1Health: 130, p2Health: 100 }); await step(1);
  expect(world.resource(MatchState).winner).toBe(0);
  await step(242);
  world.setResource(MatchState, { remaining: 1 }); await step(1);
  expect(world.resource(MatchState).winner).toBe(2);
});

worldTest('combat: left facing player recognizes a mirrored quarter circle', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  input.action('p2.down'); await step(1);
  input.action('p2.left'); await step(1);
  input.action('p2.down', 0); await step(1);
  input.action('p2.hp'); await step(14);
  const shot = world.entities(Projectile).map(e => world.get(e, Projectile)).find(p => p.player === 1)!;
  expect(shot === undefined).toBe(false); expect(shot.facing).toBe(-1); expect(shot.strength).toBe(2);
});

worldTest('combat: paused restart resets the round without awarding or advancing it', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step);
  world.setResource(MatchState, { p1Health: 72 });
  input.emit(MatchIntent, { action: 2 }); await step(1);
  input.emit(MatchIntent, { action: 5 }); await step(92);
  expect(world.resource(MatchState).phase).toBe(1); expect(world.resource(MatchState).p1Health).toBe(144);
  expect(world.resource(MatchState).round).toBe(1); expect(world.resource(MatchState).p1Wins).toBe(0);
});

worldTest('combat: projectiles remain frozen through the final fighter hit stop tick', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step); close(world);
  const shot = world.spawn({ Projectile: { player: 0, x: 100, y: 100, facing: 1, strength: 0 } });
  input.action('p1.lp'); await step(3);
  expect(world.resource(MatchState).hitStop).toBe(15);
  const x = world.get(shot, Projectile).x;
  await step(15);
  expect(world.resource(MatchState).hitStop).toBe(0);
  expect(world.get(shot, Projectile).x).toBe(x);
  await step(1);
  expect(world.get(shot, Projectile).x).toBeGreaterThan(x);
});

// Reference asymmetry is intentional: Ryu head-light = 15+3+8; Ken = 15+3+4+9.
for (const [target, recoveryAfterFreeze] of [[0, 11], [1, 16]] as const) {
  worldTest(`combat: impact freeze consumes ${target === 0 ? 'Ryu' : 'Ken'} source hurt delay without extra stun`, async ({ world, step, input, loaded }) => {
    await loaded();
    await step(2); await startLocal(world, input, step); close(world);
    input.action(`p${target === 0 ? 2 : 1}.lp`); await step(3);
    expect(STATE_NAMES[fighter(world, target).state]).toBe('hurt-head-light');
    expect(fighter(world, target).frame).toBe(15);
    await step(15);
    expect(fighter(world, target).frame).toBe(15);
    await step(recoveryAfterFreeze - 1);
    expect(STATE_NAMES[fighter(world, target).state]).toBe('hurt-head-light');
    await step(1);
    expect(STATE_NAMES[fighter(world, target).state]).toBe('idle');
  });
}

worldTest('combat: rendered active punch and damage begin on the same simulation tick', async ({ world, step, input, loaded }) => {
  await loaded();
  await step(2); await startLocal(world, input, step); close(world);
  input.action('p1.lp');
  for (let frame = 0; frame <= 2; frame++) {
    await step(1);
    const attacker = fighter(world, 0), pose = frameForFighter(FIGHTERS[0], attacker.state, attacker.frame);
    expect(attacker.frame).toBe(frame);
    expect(world.get(attacker.entity, Sprite).image).toBe(pose.sprite);
    expect(pose.hit[2] > 0).toBe(frame === 2);
    expect(world.resource(MatchState).p2Health).toBe(frame === 2 ? 132 : 144);
  }
});

worldTest('combat: Enter and Escape retain independent key edges while held together', async ({ world, step, input, loaded }) => {
  await loaded(); await step(2);
  await startLocal(world, input, step);
  input.key(38, true); await step(1); expect(world.resource(MatchState).phase).toBe(1);
  input.key(39, true); await step(2); expect(world.resource(MatchState).phase).toBe(3);
  input.key(39, false); await step(1);
  input.key(39, true); await step(2); expect(world.resource(MatchState).phase).toBe(1);
  // Autorepeat on the still-held Escape key cannot pause the resumed round again.
  input.key(39, true); await step(2); expect(world.resource(MatchState).phase).toBe(1);
  input.key(38, false); await step(1);
  input.key(39, true); await step(2); expect(world.resource(MatchState).phase).toBe(1);
});

worldTest('combat: jump samples direction at launch and first moves by the source initial velocity', async ({ world, step, input, loaded }) => {
  await loaded(); await step(2); await startLocal(world, input, step);
  input.action('p1.up'); await step(1);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('jump-start');
  expect(fighter(world, 0).frame).toBe(0);
  await step(2); expect(fighter(world, 0).y).toBe(216);
  input.action('p1.right'); await step(1);
  const launched = fighter(world, 0);
  expect(STATE_NAMES[launched.state]).toBe('jump-forwards');
  expect(launched.frame).toBe(0);
  expect(launched.y).toBe(209); expect(launched.vy).toBe(-420);
  expect(Math.abs(launched.x - 298.8)).toBeLessThan(0.001);
  await step(1);
  expect(Math.abs(fighter(world, 0).y - (209 + (-420 + 1000 / 60) / 60))).toBeLessThan(0.001);
});

worldTest('combat: landing accepts held movement after two source landing frames and emits one landing effect', async ({ world, step, input, loaded }) => {
  await loaded(); await step(2); await startLocal(world, input, step);
  input.action('p1.up'); await step(1); input.action('p1.up', 0);
  let ticks = 0;
  while (STATE_NAMES[fighter(world, 0).state] !== 'jump-land' && ticks++ < 80) await step(1);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('jump-land');
  expect(fighter(world, 0).frame).toBe(0);
  const effects = world.events(CombatEffect).filter(e => e.kind === 5 && e.player === 0);
  expect(effects.length).toBe(1);
  const x = fighter(world, 0).x;
  input.action('p1.right'); await step(1);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('jump-land'); expect(fighter(world, 0).x).toBe(x);
  await step(1);
  expect(STATE_NAMES[fighter(world, 0).state]).toBe('walk-forwards');
  expect(fighter(world, 0).x).toBe(x + 3);
});

for (const [action, attack] of [['lp', 0], ['lk', 1]] as const) {
  worldTest(`combat: ${action} effects preserve attack type for audio selection`, async ({ world, step, input, loaded }) => {
    await loaded(); await step(2); await startLocal(world, input, step); close(world, 36);
    input.action(`p1.${action}`); await step(1);
    expect(world.events(CombatEffect).find(e => e.kind === 0)!.attack).toBe(attack);
    let ticks = 0;
    while (world.resource(MatchState).hitStop === 0 && ticks++ < 20) await step(1);
    expect(world.events(CombatEffect).find(e => e.kind === 1)!.attack).toBe(attack);
  });
}
