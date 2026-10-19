/** CPU decisions become the same held/pressed bits consumed by human combat. */
import { defineSystem, defineTunables, query, read, write } from '@gameengine/runtime';
import { AIState, CombatInput, Fighter, MatchState, Projectile, TrainingState, AITuningDef, type FighterValue } from '../schema.gen.ts';

const LEFT = 1, RIGHT = 2, UP = 4, DOWN = 8;
const AITuning = defineTunables(AITuningDef, 'data/ai.json');

export const CombatAI = defineSystem({
  name: 'CombatAI', runIf: [{ resource: MatchState, field: 'phase', value: 1 }, { any: [{ resource: MatchState, field: 'mode', value: 0 }, { resource: MatchState, field: 'mode', value: 2 }] }], after: ['MatchCommands', 'TrainingCommands'], before: ['CombatRound'],
  queries: { fighters: query(read(Fighter)), shots: query(read(Projectile)) },
  resources: [read(MatchState), read(TrainingState), write(AIState), write(CombatInput)],
  run(ctx, q) {
    const match = ctx.resource(MatchState), ai = ctx.resource(AIState), controls = ctx.resource(CombatInput);
    const tuning = AITuning.get();
    const level = Math.min(2, match.difficulty[0]!);
    const reaction = Math.max(1, [tuning.easyReaction, tuning.normalReaction, tuning.hardReaction][level]!);
    const mistakeChance = Math.max(0, Math.min(100, [tuning.easyMistake, tuning.normalMistake, tuning.hardMistake][level]!));
    const cpu = match.mode[0] === 0 || (match.mode[0] === 2 && ctx.resource(TrainingState).dummyMode[0] === 4);
    if (!cpu) { ai.previous[1] = 0; ai.held[1] = 0; ai.plan[1] = 0; ai.think[1] = 0; return; }
    if (ai.resetStep[0] !== match.resetStep[0]) {
      ai.resetStep[0] = match.resetStep[0]!; ai.previous[1] = 0; ai.held[1] = 0; ai.plan[1] = 0; ai.think[1] = 0;
    }
    if (match.resetStep[0] === ctx.step) {
      controls.held[1] = 0; controls.pressed[1] = 0;
      ai.previous[1] = 0; ai.held[1] = 0; ai.plan[1] = 0; ai.think[1] = 0; return;
    }
    if (match.hitStop[0]! > 0) {
      controls.held[1] = ai.held[1]!; controls.pressed[1] = 0; return;
    }
    const fighters: FighterValue[] = [];
    for (const c of q.fighters.chunks()) for (let i = 0; i < c.length; i++) {
      const f = c.get(Fighter, i); fighters[f.player] = f;
    }
    const me = fighters[1], opponent = fighters[0];
    if (!me || !opponent) return;
    const toward = opponent.x < me.x ? LEFT : RIGHT, away = toward === LEFT ? RIGHT : LEFT;
    let held = ai.held[1]!;
    if (ai.plan[1]! > 0) {
      const frame = ai.planStep[1]!;
      const plan = ai.plan[1]!;
      // Motion steps are deliberately several input frames long, just like a player's.
      if (plan === 1) held = frame < 3 ? DOWN : frame < 6 ? DOWN | toward : toward | (frame < 9 ? 16 << (match.difficulty[0] === 2 ? 2 : 0) : 0);
      else if (plan === 2) held = frame < 3 ? toward : frame < 6 ? DOWN : DOWN | toward | (frame < 9 ? 32 : 0);
      else if (plan === 3) held = frame < 3 ? DOWN : frame < 6 ? DOWN | away : away | (frame < 9 ? 256 : 0);
      else if (plan === 4) held = frame < 8 ? toward | UP : frame < 22 ? toward : frame < 25 ? 256 : 0;
      ai.planStep[1] = frame + 1;
      if (frame >= (plan === 4 ? 32 : 12)) { ai.plan[1] = 0; ai.think[1] = reaction; held = 0; }
    } else if (ai.think[1]! > 0) {
      ai.think[1] = ai.think[1]! - 1;
      // Buttons are taps, directional choices remain held through a decision interval.
      held &= 15;
    } else {
      const difficulty = Math.min(2, match.difficulty[0]!);
      const distance = Math.abs(opponent.x - me.x);
      const mistake = ctx.rng.range(0, 100) < mistakeChance;
      let projectileThreat = false;
      for (const c of q.shots.chunks()) {
        const shots = c.col(Projectile);
        for (let i = 0; i < c.length; i++) if (shots.player[i] === 0 && shots.state[i] === 0 && Math.abs(shots.x[i]! - me.x) < 145) projectileThreat = true;
      }
      const attackThreat = (opponent.state >= 13 && opponent.state <= 18) || opponent.state === 25 || (opponent.state >= 29 && opponent.state <= 41) || opponent.state === 44 || opponent.state === 45;
      const roll = ctx.rng.range(0, 100);
      ai.think[1] = reaction + ctx.rng.range(0, 9);
      held = 0;
      if (!mistake && projectileThreat) {
        if (roll < 65 || distance < 100) held = away;
        else { ai.plan[1] = 4; ai.planStep[1] = 0; held = UP | toward; }
      } else if (!mistake && distance < 100 && attackThreat) {
        held = away | ((opponent.state >= 32 && opponent.state <= 34) ? DOWN : 0);
      } else if (!mistake && opponent.y < 190 && distance < 90 && difficulty > 0) {
        ai.plan[1] = 2; ai.planStep[1] = 0; held = toward;
      } else if (distance > 135) {
        if (roll < 35 && !mistake) { ai.plan[1] = 1; ai.planStep[1] = 0; held = DOWN; }
        else if (roll < 50) { ai.plan[1] = 4; ai.planStep[1] = 0; held = UP | toward; }
        else held = toward;
      } else if (distance > 70) {
        if (roll < 20 && !mistake) { ai.plan[1] = 3; ai.planStep[1] = 0; held = DOWN; }
        else if (roll < 45) held = 256;
        else held = toward;
      } else if (distance < 43 && roll < 20 && !mistake) held = 1024;
      else if (roll < 62) held = (16 << ctx.rng.range(0, 6)) | (roll < 25 ? DOWN : 0);
      else held = mistake ? 0 : away | (roll < 82 ? DOWN : 0);
    }
    ai.held[1] = held;
    controls.held[1] = held;
    controls.pressed[1] = held & ~ai.previous[1]!;
    ai.previous[1] = held;
  },
});
