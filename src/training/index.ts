import { defineSystem, query, read, write } from '@gameengine/runtime';
import { CombatInput, Fighter, MatchState, TrainingIntent, TrainingState } from '../schema.gen.ts';

export const TrainingCommands = defineSystem({
  name: 'TrainingCommands', runIf: { resource: MatchState, field: 'mode', value: 2 }, after: ['MatchCommands'], before: ['CombatAI', 'CombatRound'],
  query: query(read(Fighter)), resources: [write(MatchState), write(TrainingState), write(CombatInput)], events: [TrainingIntent],
  run(ctx, q) {
    const match = ctx.resource(MatchState), training = ctx.resource(TrainingState), controls = ctx.resource(CombatInput);
    if (match.mode[0] !== 2) return;
    if (training.resetStep[0] !== match.resetStep[0]) {
      training.resetStep[0] = match.resetStep[0]!;
      training.damage[0] = 0; training.combo[0] = 0; training.maxCombo[0] = 0; training.lastDamage[0] = 0;
      training.previousHealth[0] = 144; training.previousStun[0] = 0;
    }
    for (const intent of ctx.events.read(TrainingIntent)) {
      if (intent.action === 0) training.dummyMode[0] = Math.min(4, intent.value);
      else if (intent.action === 1) {
        match.resetStep[0] = ctx.step; training.resetStep[0] = ctx.step;
        match.p1Health[0] = 144; match.p2Health[0] = 144; match.hitStop[0] = 0;
        training.damage[0] = 0; training.combo[0] = 0; training.maxCombo[0] = 0; training.lastDamage[0] = 0;
        training.previousHealth[0] = 144; training.previousStun[0] = 0;
        for (const field of ['pressed', 'buffered', 'bufferAge', 'history', 'historyStep', 'historyCount', 'direction', 'motion', 'motionAge'] as const) controls[field].fill(0);
      } else if (intent.action === 2) training.showBoxes[0] = intent.value > 0 ? 1 : 0;
    }
    if (match.phase[0] !== 1 || training.dummyMode[0] === 4) return;
    let facing = -1;
    for (const c of q.chunks()) for (let i = 0; i < c.length; i++) if (c.col(Fighter).player[i] === 1) facing = c.col(Fighter).facing[i]!;
    const away = facing === 1 ? 1 : 2;
    const mode = training.dummyMode[0]!;
    const held = mode === 1 ? away : mode === 2 ? away | 8 : mode === 3 ? 4 : 0;
    // The dummy's last held state belongs to CombatInput.previous, not host keyboard state.
    controls.pressed[1] = held & ~controls.held[1]!;
    controls.held[1] = held;
  },
});

export const TrainingStats = defineSystem({
  name: 'TrainingStats', runIf: [{ resource: MatchState, field: 'mode', value: 2 }, { resource: MatchState, field: 'phase', value: 1 }], after: ['CombatProjectiles'], before: ['MatchLifecycle'],
  query: query(read(Fighter)), resources: [write(MatchState), read(CombatInput), write(TrainingState)],
  run(ctx, q) {
    const match = ctx.resource(MatchState), training = ctx.resource(TrainingState);
    if (match.mode[0] !== 2 || match.phase[0] !== 1) return;
    training.inputBits[0] = ctx.resource(CombatInput).held[0]!;
    if (match.resetStep[0] === ctx.step) { training.previousHealth[0] = 144; training.previousStun[0] = 0; }
    const hp = match.p2Health[0]!;
    const damage = Math.max(0, training.previousHealth[0]! - hp);
    let recovering = false, hitRecovery = false, comboHits = 0;
    for (const c of q.chunks()) for (let i = 0; i < c.length; i++) if (c.col(Fighter).player[i] === 1) {
      const f = c.get(Fighter, i);
      comboHits = f.comboHits;
      hitRecovery = (f.state >= 19 && f.state <= 24) || f.state === 42 || f.state === 43;
      recovering = hitRecovery || f.stun > 0;
    }
    if (damage > 0) training.lastDamage[0] = damage;
    // Contact state is written immediately; emitted effects arrive on the next event frame.
    // Guard chip is damage feedback, but it is never a combo hit.
    if (damage > 0 && hitRecovery) {
      if (comboHits <= 1) training.damage[0] = 0;
      training.combo[0] = comboHits; training.damage[0] = training.damage[0]! + damage;
      training.maxCombo[0] = Math.max(training.maxCombo[0]!, training.combo[0]!);
    }
    training.previousStun[0] = hitRecovery ? 1 : 0;
    if ((!recovering && match.hitStop[0] === 0) || hp === 0) match.p2Health[0] = 144;
    if (match.p1Health[0] === 0) match.p1Health[0] = 144;
    training.previousHealth[0] = match.p2Health[0]!;
    match.remaining[0] = 5940;
  },
});
