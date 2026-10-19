import { query, write } from '@gameengine/runtime';
import { defineCheat } from '@gameengine/runtime/cheats';
import { Fighter, MatchState } from '../schema.gen.ts';

/** Recorded fixture setup for replays and visual QA; stripped from release builds. */
export const ArrangeFight = defineCheat({
  id: 'fight.arrange', group: 'Fight QA', title: 'Arrange fighters',
  params: { distance: { type: 'int', min: 32, max: 320, default: 64 } },
  query: query(write(Fighter)),
  run(_ctx, { distance }, q) {
    for (const c of q.chunks()) for (let i = 0; i < c.length; i++) {
      const player = c.col(Fighter).player[i]!;
      c.set(Fighter, i, { x: 384 + (player === 0 ? -1 : 1) * distance / 2, y: 216, state: 0, frame: 0, age: 0, vx: 0, vy: 0, facing: player === 0 ? 1 : -1, attackHit: false });
    }
  },
});
export const FinishFight = defineCheat({
  id: 'fight.finish', group: 'Fight QA', title: 'Finish the round',
  params: { winner: { type: 'int', min: 0, max: 2, default: 0 } },
  resources: [write(MatchState)],
  run(ctx, { winner }) {
    ctx.set(MatchState, { phase: 1, remaining: 1, hitStop: 0, p1Health: winner === 1 ? 0 : 144, p2Health: winner === 0 ? 0 : 144 });
  },
});
