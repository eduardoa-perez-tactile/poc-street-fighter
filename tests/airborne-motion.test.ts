import { worldTest, expect, type TestWorld, type TestInput } from '@gameengine/test';
import { Fighter, MatchIntent, MatchState, Projectile } from '../src/schema.gen.ts';
import { DRAGON, HURRICANE, KNOCKDOWN, WAKEUP } from '../src/combat/moves.ts';
function fighter(world: TestWorld, player: number) {
  const entity = world.entities(Fighter).find(e => world.get(e, Fighter).player === player)!;
  return { entity, ...world.get(entity, Fighter) };
}
async function setup(world: TestWorld, input: TestInput, step: (n: number) => Promise<void>, distance = 320) {
  await step(2); world.setResource(MatchState, { mode: 1 }); input.emit(MatchIntent, { action: 0 }); await step(182);
  for (let p = 0; p < 2; p++) world.insert(fighter(world, p).entity, Fighter, { x: 384 + (p === 0 ? -1 : 1) * distance / 2 });
}
for (const player of [0, 1]) {
  const name = `p${player + 1}`, forward = player === 0 ? 'right' : 'left', back = player === 0 ? 'left' : 'right';
  for (const special of ['dragon', 'hurricane'] as const) {
    worldTest(`airborne motion: ${name} ${special} rises falls and lands through player inputs`, async ({ world, input, step, loaded }) => {
      await loaded(); await setup(world, input, step);
      if (special === 'dragon') {
        input.action(`${name}.${forward}`); await step(1); input.action(`${name}.${forward}`, 0);
        input.action(`${name}.down`); await step(1); input.action(`${name}.${forward}`); input.action(`${name}.hp`);
      } else {
        input.action(`${name}.down`); await step(1); input.action(`${name}.${back}`); await step(1);
        input.action(`${name}.down`, 0); await step(1); input.action(`${name}.hk`);
      }
      await step(1);
      expect(fighter(world, player).state).toBe(special === 'dragon' ? DRAGON : HURRICANE);
      for (const action of [forward, back, 'down', 'hp', 'hk']) input.action(`${name}.${action}`, 0);
      let rose = false, fell = false, apex = 216;
      for (let i = 0; i < 80; i++) {
        await step(1); const f = fighter(world, player);
        if (f.y < 210) rose = true;
        if (rose && f.y > apex + 1) fell = true;
        apex = Math.min(apex, f.y);
        if (f.y < 216) expect(f.state).toBe(special === 'dragon' ? DRAGON : HURRICANE);
      }
      expect(rose).toBe(true); expect(fell).toBe(true);
      expect(fighter(world, player).y).toBe(216); expect(fighter(world, player).vy).toBe(0);
    });
  }
  worldTest(`airborne motion: ${name} lethal dragon punch keeps both flights through result hitstop`, async ({ world, input, step, loaded }) => {
    await loaded(); await setup(world, input, step, 60);
    const target = 1 - player;
    world.setResource(MatchState, target === 0 ? { p1Health: 20 } : { p2Health: 20 });
    input.action(`${name}.${forward}`); await step(1); input.action(`${name}.${forward}`, 0);
    input.action(`${name}.down`); await step(1); input.action(`${name}.${forward}`); input.action(`${name}.hp`); await step(5);
    expect(world.resource(MatchState).phase).toBe(2);
    const attacker = fighter(world, player), victim = fighter(world, target);
    expect(attacker.state).toBe(DRAGON); expect(attacker.y).toBeLessThan(216);
    expect(victim.state).toBe(KNOCKDOWN); expect(victim.vy).toBeLessThan(0);
    await step(15); expect(fighter(world, player).y).toBe(attacker.y); expect(fighter(world, target).y).toBe(victim.y);
    await step(10); expect(fighter(world, player).y).toBeLessThan(attacker.y); expect(fighter(world, target).y).toBeLessThan(victim.y);
    await step(70); expect(fighter(world, player).y).toBe(216); expect(fighter(world, player).state).toBe(26);
    expect(fighter(world, target).y).toBe(216); expect(fighter(world, target).state).toBe(KNOCKDOWN);
  });
  worldTest(`airborne motion: ${name} throw victim follows an arc then wakes only on the floor`, async ({ world, input, step, loaded }) => {
    await loaded(); await setup(world, input, step, 36);
    input.action(`${name}.throw`); await step(6);
    const target = 1 - player, start = fighter(world, target);
    expect(start.state).toBe(KNOCKDOWN); expect(start.vy).toBeLessThan(0);
    const x = start.x; await step(15);
    expect(fighter(world, target).y).toBe(216);
    let rose = false, fell = false, apex = 216;
    for (let i = 0; i < 75; i++) {
      await step(1); const f = fighter(world, target);
      if (f.y < 210) { rose = true; expect(f.state).toBe(KNOCKDOWN); expect(f.frame).toBeLessThan(18); }
      if (rose && f.y > apex + 1) fell = true;
      apex = Math.min(apex, f.y);
      if (f.state === WAKEUP) expect(f.y).toBe(216);
    }
    expect(rose).toBe(true); expect(fell).toBe(true);
    expect((fighter(world, target).x - x) * (player === 0 ? 1 : -1)).toBeGreaterThan(20);
    expect(fighter(world, target).y).toBe(216); expect(fighter(world, target).state).toBe(0);
  });
  worldTest(`airborne motion: ${name} sweep launches the target before landing and recovery`, async ({ world, input, step, loaded }) => {
    await loaded(); await setup(world, input, step, 36);
    input.action(`${name}.down`); input.action(`${name}.hk`); await step(8);
    const target = 1 - player;
    expect(fighter(world, target).state).toBe(KNOCKDOWN); expect(fighter(world, target).vy).toBeLessThan(0);
    await step(25); expect(fighter(world, target).y).toBeLessThan(216);
    await step(60); expect(fighter(world, target).y).toBe(216); expect(fighter(world, target).state).toBe(0);
  });
  for (const lethal of [false, true]) {
    worldTest(`airborne motion: ${name} projectile ${lethal ? 'KO keeps its arc during results' : 'air hit retains height and falls'}`, async ({ world, input, step, loaded }) => {
      await loaded(); await setup(world, input, step);
      const target = 1 - player, f = fighter(world, target);
      if (lethal) world.setResource(MatchState, target === 0 ? { p1Health: 20 } : { p2Health: 20 });
      else world.insert(f.entity, Fighter, { state: 4, y: 165, vy: -100 });
      world.spawn({ Projectile: { player, x: f.x, y: lethal ? 160 : 110, facing: player === 0 ? 1 : -1, strength: 2 } });
      await step(1); const hit = fighter(world, target);
      expect(hit.state).toBe(KNOCKDOWN);
      if (lethal) expect(hit.y).toBe(216);
      else { expect(hit.y).toBeGreaterThan(163); expect(hit.y).toBeLessThan(165); }
      expect(hit.vy).toBeLessThan(0);
      if (lethal) expect(world.resource(MatchState).phase).toBe(2);
      await step(15); expect(fighter(world, target).y).toBe(hit.y);
      await step(10); expect(fighter(world, target).y).toBeLessThan(hit.y);
      await step(90); const settled = fighter(world, target);
      expect(settled.y).toBe(216); expect(settled.vy).toBe(0);
      if (lethal) { expect(settled.state).toBe(KNOCKDOWN); expect(settled.frame).toBe(44); }
      else expect(settled.state).toBe(0);
    });
  }
}
worldTest('airborne motion: ordinary grounded projectile hit keeps grounded stagger', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  const f = fighter(world, 1);
  world.spawn({ Projectile: { player: 0, x: f.x, y: 160, facing: 1, strength: 2 } }); await step(1);
  expect(fighter(world, 1).state >= 19 && fighter(world, 1).state <= 24).toBe(true);
  await step(20); expect(fighter(world, 1).y).toBe(216); expect(fighter(world, 1).vy).toBe(0);
});
worldTest('airborne motion: a high knockdown cannot recover until it has landed', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step);
  world.insert(fighter(world, 1).entity, Fighter, { state: KNOCKDOWN, y: -250, vy: 0, frame: 44, age: 44 });
  await step(1); expect(fighter(world, 1).state).toBe(KNOCKDOWN); expect(fighter(world, 1).y).toBeLessThan(216);
  await step(75); expect(fighter(world, 1).y).toBe(216); expect(fighter(world, 1).state).toBe(0);
});
worldTest('airborne motion: pause freezes a thrown arc and held controls cannot cancel the fall', async ({ world, input, step, loaded }) => {
  await loaded(); await setup(world, input, step, 36);
  input.action('p1.throw'); await step(26);
  expect(fighter(world, 1).y).toBeLessThan(216);
  input.emit(MatchIntent, { action: 2 }); await step(1);
  expect(world.resource(MatchState).phase).toBe(3);
  const paused = fighter(world, 1);
  input.action('p2.up'); input.action('p2.right'); input.action('p2.hp'); await step(20);
  const still = fighter(world, 1);
  for (const key of ['x', 'y', 'vx', 'vy', 'frame', 'age'] as const) expect(still[key]).toBe(paused[key]);
  input.emit(MatchIntent, { action: 3 }); await step(3);
  expect(fighter(world, 1).y).toBeLessThan(paused.y);
  let recovered = false;
  for (let i = 0; i < 80; i++) {
    await step(1); const f = fighter(world, 1);
    if (f.state === KNOCKDOWN) { if (f.y < 216) expect(f.frame).toBeLessThan(18); }
    else if (f.state === WAKEUP) expect(f.y).toBe(216);
    else { expect(f.y).toBe(216); recovered = true; break; }
  }
  expect(recovered).toBe(true);
});
