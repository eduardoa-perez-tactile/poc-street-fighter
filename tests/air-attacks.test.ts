import { expect, worldTest } from '@gameengine/test';
import { Fighter, MatchIntent, MatchState } from '../src/schema.gen.ts';
import { AIR_ATTACK, isAirAttack, moveForState } from '../src/combat/moves.ts';
import { fighterFrame } from '../src/combat/index.ts';

const buttons = ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'] as const;
for (const player of [0, 1]) for (const direction of ['neutral', 'forward', 'back'] as const) for (const [button, action] of buttons.entries()) {
  worldTest(`air attacks: p${player + 1} ${direction} ${action} keeps its flight through recovery and landing`, async c => {
    await c.loaded(); await c.step(2);
    c.world.setResource(MatchState, { mode: 1 }); c.input.emit(MatchIntent, { action: 0 }); await c.step(182);
    const entity = c.world.entities(Fighter).find(e => c.world.get(e, Fighter).player === player)!;
    const read = () => c.world.get(entity, Fighter), name = `p${player + 1}`;
    const horizontal = direction === 'neutral' ? undefined : (direction === 'forward') === (player === 0) ? 'right' : 'left';
    if (horizontal) c.input.action(`${name}.${horizontal}`);
    c.input.action(`${name}.up`);
    for (let i = 0; i < 12 && read().y === 216; i++) await c.step(1);
    expect(read().y).toBeLessThan(216);
    const jump = read().state, vx = read().vx;
    expect(jump).toBe(direction === 'neutral' ? 4 : direction === 'forward' ? 5 : 6);
    c.input.action(`${name}.up`, 0); if (horizontal) c.input.action(`${name}.${horizontal}`, 0);
    await c.step(4); c.input.action(`${name}.${action}`); await c.step(1); c.input.action(`${name}.${action}`, 0);
    expect(read().state).toBe(AIR_ATTACK + button); expect(read().airState).toBe(jump);
    let previous = read(), activeSteps = 0, recovered = false, descending = false, landed = false;
    for (let tick = 0; tick < 65; tick++) {
      await c.step(1); const f = read();
      if (isAirAttack(f.state)) {
        activeSteps++;
        const move = moveForState(f.state)!, family = direction === 'neutral' ? 'neutral' : 'diagonal';
        const kind = button < 3 ? 'punch' : 'kick', image = fighterFrame(f).sprite;
        expect(image.includes(`/extra-air-${family}-${kind}-`)).toBe(true);
        // Startup/retraction may tuck a diagonal kick, but every strength must
        // actually show an extended strike throughout its damaging window.
        if (f.frame >= move.startup && f.frame < move.startup + move.active) {
          expect(image.endsWith(`/extra-air-${family}-${kind}-strike`)).toBe(true);
        }
        const retract = [3, 4, 5][button % 3]!;
        if (f.frame >= move.startup && f.frame < move.duration - retract) {
          expect(image.endsWith(`/extra-air-${family}-${kind}-strike`)).toBe(true);
        }
        if (f.frame >= move.duration) {
          recovered = true;
          expect(image.endsWith(`/extra-air-${family}-${kind}-ready`)).toBe(true);
          expect(fighterFrame(f).hit).toEqual([0, 0, 0, 0]);
        }
      }
      if (f.y < 216) {
        expect(f.state).toBe(AIR_ATTACK + button);
        expect(f.vx).toBe(vx);
        // Normal attacks cannot restart gravity, takeoff, or horizontal movement.
        expect(f.vy).toBeGreaterThanOrEqual(previous.vy);
        expect(Math.abs(f.y - previous.y)).toBeLessThan(8);
        if (f.vy > 0) descending = true;
      } else if (!landed) {
        landed = true; expect(f.state).toBe(7); expect(f.vy).toBe(0);
      }
      previous = f;
    }
    expect(activeSteps).toBeGreaterThan(8); expect(recovered).toBe(true);
    expect(descending).toBe(true); expect(landed).toBe(true);
    expect(read().state).toBe(0); expect(read().y).toBe(216);
    expect(c.world.resource(MatchState).p1Health).toBe(144); expect(c.world.resource(MatchState).p2Health).toBe(144);
  });
}

worldTest('air attacks: impact freeze holds the attack pose and a buffered second attack cannot restart it', async c => {
  await c.loaded(); await c.step(2);
  c.world.setResource(MatchState, { mode: 1 }); c.input.emit(MatchIntent, { action: 0 }); await c.step(182);
  const entity = c.world.entities(Fighter).find(e => c.world.get(e, Fighter).player === 0)!;
  const read = () => c.world.get(entity, Fighter);
  c.input.action('p1.up');
  for (let i = 0; i < 12 && read().y === 216; i++) await c.step(1);
  c.input.action('p1.up', 0); c.input.action('p1.lp'); await c.step(4); c.input.action('p1.lp', 0);
  expect(read().state).toBe(AIR_ATTACK);
  const frozen = read(), image = fighterFrame(frozen).sprite;
  c.world.setResource(MatchState, { hitStop: 3 }); await c.step(3);
  expect(read().frame).toBe(frozen.frame); expect(read().y).toBe(frozen.y); expect(read().vy).toBe(frozen.vy);
  expect(fighterFrame(read()).sprite).toBe(image);
  while (read().frame < 12) await c.step(1);
  c.input.action('p1.hk'); await c.step(1); c.input.action('p1.hk', 0); await c.step(1);
  expect(read().state).toBe(AIR_ATTACK); expect(read().frame).toBeGreaterThanOrEqual(14);
  expect(read().airState).toBe(4); expect(read().y).toBeLessThan(216);
  expect(fighterFrame(read()).sprite.endsWith('/extra-air-neutral-punch-ready')).toBe(true);
});

worldTest('air attacks: an early forward punch stays recovered until landing and rejects a fresh second attack', async c => {
  await c.loaded(); await c.step(2);
  c.world.setResource(MatchState, { mode: 1 }); c.input.emit(MatchIntent, { action: 0 }); await c.step(182);
  const entity = c.world.entities(Fighter).find(e => c.world.get(e, Fighter).player === 0)!;
  const read = () => c.world.get(entity, Fighter);
  c.input.action('p1.right'); c.input.action('p1.up');
  for (let i = 0; i < 12 && read().y === 216; i++) await c.step(1);
  c.input.action('p1.right', 0); c.input.action('p1.up', 0);
  c.input.action('p1.lp'); await c.step(1); c.input.action('p1.lp', 0); await c.step(16);
  expect(read().y).toBeLessThan(216); expect(read().state).toBe(AIR_ATTACK);
  expect(fighterFrame(read()).sprite.endsWith('/extra-air-diagonal-punch-ready')).toBe(true);
  c.input.action('p1.hk'); await c.step(1); c.input.action('p1.hk', 0);
  while (read().y < 216) {
    expect(read().state).toBe(AIR_ATTACK);
    expect(fighterFrame(read()).sprite.endsWith('/extra-air-diagonal-punch-ready')).toBe(true);
    expect(fighterFrame(read()).hit).toEqual([0, 0, 0, 0]);
    await c.step(1);
  }
  expect(read().state).toBe(7);
});
