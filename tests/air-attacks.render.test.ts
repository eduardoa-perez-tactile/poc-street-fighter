import { LocalTransform, Sprite, VisualOffset } from '@gameengine/runtime';
import { expect, renderTest } from '@gameengine/test';
import { Fighter, MatchIntent, MatchState } from '../src/schema.gen.ts';
import { ArrangeFight } from '../src/combat/fight.cheats.ts';
import { AIR_ATTACK, isAirAttack, moveForState } from '../src/combat/moves.ts';

for (const player of [0, 1]) for (const direction of ['neutral', 'forward', 'back'] as const) {
  renderTest(`air attack rendering: p${player + 1} ${direction} all six descending normals preserve their airborne pose and anchor`, async c => {
    c.input.view(1152, 672, 1); await c.loaded(); await c.step(2);
    c.world.setResource(MatchState, { mode: 1 }); c.input.emit(MatchIntent, { action: 0 }); await c.step(182);
    const entity = c.world.entities(Fighter).find(e => c.world.get(e, Fighter).player === player)!;
    const read = () => c.world.get(entity, Fighter), name = `p${player + 1}`;
    for (const [button, action] of ['lp', 'mp', 'hp', 'lk', 'mk', 'hk'].entries()) {
      await c.cheat(ArrangeFight, { distance: 320 });
      const horizontal = direction === 'neutral' ? undefined : (direction === 'forward') === (player === 0) ? 'right' : 'left';
      if (horizontal) c.input.action(`${name}.${horizontal}`);
      c.input.action(`${name}.up`);
      for (let i = 0; i < 12 && read().y === 216; i++) await c.step(1);
      c.input.action(`${name}.up`, 0);
      if (horizontal) c.input.action(`${name}.${horizontal}`, 0);
      for (let i = 0; i < 35 && read().vy < 0; i++) await c.step(1);
      expect(read().y).toBeLessThan(216); expect(read().vy).toBeGreaterThanOrEqual(0);
      c.input.action(`${name}.${action}`); await c.step(1); c.input.action(`${name}.${action}`, 0);
      expect(read().state).toBe(AIR_ATTACK + button);
      let poses = 0;
      while (read().y < 216) {
        expect(isAirAttack(read().state)).toBe(true);
        c.render.expectDrawCalls('<=', 30, { width: 1152, height: 672 });
        const f = read(), sprite = c.world.get(entity, Sprite), visual = c.world.get(entity, VisualOffset);
        expect(sprite.visible).toBe(true); expect(sprite.flipX).toBe(player === 1);
        // A descending punch or kick must never replay the rising neutral jump.
        expect(sprite.image?.endsWith('/jump-up-2')).toBe(false);
        expect(sprite.image?.endsWith('/jump-up-3')).toBe(false);
        expect(sprite.image?.includes('/idle-')).toBe(false);
        const family = direction === 'neutral' ? 'neutral' : 'diagonal', kind = button < 3 ? 'punch' : 'kick';
        expect(sprite.image?.includes(`/extra-air-${family}-${kind}-`)).toBe(true);
        const move = moveForState(f.state)!;
        if (f.frame >= move.duration) expect(sprite.image?.endsWith(`/extra-air-${family}-${kind}-ready`)).toBe(true);
        if (f.frame >= move.startup && f.frame < move.startup + move.active) {
          expect(sprite.image?.endsWith(`/extra-air-${family}-${kind}-strike`)).toBe(true);
          // Four reviewed captures span both authored families, both attack
          // kinds and both fighters; all 36 paths still inspect actual sprites.
          if (f.frame === move.startup && (button === 2 || button === 5) &&
            (player === 0 && direction === 'neutral' || player === 1 && direction === 'forward')) {
            c.render.expectScreenshot(`${kind}-extended`, { width: 768, height: 448 });
          }
        }
        const position = c.world.get(entity, LocalTransform).position;
        expect(position[0]).toBeCloseTo(f.x / 100, 5); expect(position[1]).toBeCloseTo((216 - f.y) / 100, 5);
        expect(visual.position).toEqual([0, 0, 0]); expect(visual.rotation).toEqual([0, 0, 0, 1]);
        poses++; await c.step(1);
      }
      expect(poses).toBeGreaterThan(8);
      await c.step(40); expect(read().y).toBe(216); expect(read().state).toBe(0);
    }
  }, { memory: 'phone-low' });
}
