import { defineSystem, query, read, Shape, VisualOffset, write } from '@gameengine/runtime';
import { DebugBox, Fighter, MatchState, TrainingState } from '../schema.gen.ts';
import { FIGHTERS } from '../data/fighters.ts';
import { actualBox, frameForFighter } from '../combat/index.ts';
import { KNOCKDOWN } from '../combat/moves.ts';

/** Exactly the collision geometry used by combat, drawn only when training requests it. */
export const DrawDebugBoxes = defineSystem({
  name: 'DrawDebugBoxes', stage: 'LateUpdate',
  queries: { boxes: query(read(DebugBox), write(Shape), write(VisualOffset)), fighters: query(read(Fighter)) },
  resources: [read(TrainingState), read(MatchState)], skipUnchanged: true,
  run(ctx, q) {
    const match = ctx.resource(MatchState);
    const show = ctx.resource(TrainingState).showBoxes[0] && match.mode[0] === 2 && (match.phase[0] === 1 || match.phase[0] === 3);
    for (const c of q.boxes.chunks()) for (let i = 0; i < c.length; i++) {
      const debug = c.col(DebugBox), shape = c.col(Shape), offset = c.col(VisualOffset).position;
      shape.visible[i] = 0;
      if (!show) continue;
      for (const fighters of q.fighters.chunks()) for (let j = 0; j < fighters.length; j++) {
        const fighter = fighters.get(Fighter, j);
        if (fighter.player !== debug.player[i]) continue;
        const frame = frameForFighter(FIGHTERS[fighter.fighterId]!, fighter.state, fighter.frame), index = debug.box[i]!;
        if (index > 0 && index < 4 && (fighter.invulnerable > 0 || fighter.state === KNOCKDOWN)) continue;
        const local = index === 0 ? frame.push : index === 4 ? frame.hit : frame.hurt[index - 1];
        if (!local || local[2] <= 0 || local[3] <= 0) continue;
        const [x, y, width, height] = actualBox(local, fighter.x, fighter.y, fighter.facing);
        shape.visible[i] = 1;
        shape.size[i * 2] = width / 100; shape.size[i * 2 + 1] = height / 100;
        offset[i * 3] = (x + width / 2) / 100; offset[i * 3 + 1] = (216 - y - height / 2) / 100;
      }
    }
  },
});
