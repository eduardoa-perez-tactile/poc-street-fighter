import { defineSystem, write } from '@gameengine/runtime';
import { CombatInput, MatchIntent, MatchState } from '../schema.gen.ts';

export const MATCH_PHASE = Object.freeze({ title: 0, playing: 1, roundResult: 2, paused: 3, intro: 4, matchResult: 5 });
export const INTRO_STEPS = 90;
export const RESULT_STEPS = 150;

export const MatchCommands = defineSystem({
  name: 'MatchCommands', after: ['CombatControls'], runOn: [MatchIntent],
  resources: [write(MatchState), write(CombatInput)],
  run(ctx) {
    const m = ctx.resource(MatchState), controls = ctx.resource(CombatInput);
    let restart = false;
    for (const intent of ctx.events.read(MatchIntent)) {
      const action = intent.action, phase = m.phase[0]!;
      if (action === 14) { m.settingsOpen[0] = 0; continue; }
      if (m.settingsOpen[0]) continue;
      if (action === 13 && (phase === 0 || phase === 3)) { m.settingsOpen[0] = 1; continue; }
      if (phase === 0 && action >= 7 && action <= 9) m.mode[0] = action - 7;
      else if (phase === 0 && action >= 10 && action <= 12) m.difficulty[0] = action - 10;
      else if ((action === 0 && phase === 0) || (action === 1 && phase === 5) || (action === 5 && phase === 3)) restart = true;
      else if (action === 2 && (phase === 1 || phase === 4)) { m.resumePhase[0] = phase; m.phase[0] = 3; }
      else if (action === 3 && phase === 3) m.phase[0] = m.resumePhase[0]!;
      else if (action === 6 && (phase === 3 || phase === 5)) {
        m.phase[0] = 0; m.phaseTicks[0] = 0; m.hitStop[0] = 0;
      }
    }
    if (!restart) return;
    m.settingsOpen[0] = 0;
    m.phase[0] = m.mode[0] === 2 ? 1 : 4;
    m.phaseTicks[0] = m.mode[0] === 2 ? 0 : INTRO_STEPS;
    m.resumePhase[0] = 1; m.round[0] = 1; m.remaining[0] = 5940;
    m.p1Health[0] = 144; m.p2Health[0] = 144; m.p1Score[0] = 0; m.p2Score[0] = 0;
    m.p1Wins[0] = 0; m.p2Wins[0] = 0; m.winner[0] = -1; m.matchWinner[0] = -1;
    m.hitStop[0] = 0; m.freezeStep[0] = 0; m.resetStep[0] = ctx.step;
    // Physical inputs are edge-driven: retain held directions across resets until release.
    for (const field of ['pressed', 'buffered', 'bufferAge', 'history', 'historyStep', 'historyCount', 'direction', 'motion', 'motionAge'] as const) controls[field].fill(0);
  },
});

/** Round scoring is resolved by combat immediately; this owns the timed match progression. */
export const MatchLifecycle = defineSystem({
  name: 'MatchLifecycle', after: ['CombatProjectiles'],
  resources: [write(MatchState), write(CombatInput)],
  runIf: { any: [
    { resource: MatchState, field: 'phase', value: 4 },
    { resource: MatchState, field: 'phase', value: 2 },
    { resource: MatchState, field: 'phase', value: 1 },
  ] },
  run(ctx) {
    const m = ctx.resource(MatchState);
    if (m.phase[0] === 1) { if (m.phaseTicks[0]! > 0) m.phaseTicks[0] = m.phaseTicks[0]! - 1; return; }
    if (m.resetStep[0] === ctx.step) return;
    if (m.phaseTicks[0]! > 0) { m.phaseTicks[0] = m.phaseTicks[0]! - 1; if (m.phaseTicks[0]! > 0) return; }
    if (m.phase[0] === 4) { m.phase[0] = 1; m.phaseTicks[0] = 30; return; }
    if (m.p1Wins[0]! >= 2 || m.p2Wins[0]! >= 2) {
      m.matchWinner[0] = m.p1Wins[0]! >= 2 ? 0 : 1; m.phase[0] = 5; return;
    }
    if (m.winner[0] !== 2) m.round[0] = m.round[0]! + 1;
    m.winner[0] = -1; m.phase[0] = 4; m.phaseTicks[0] = INTRO_STEPS;
    m.remaining[0] = 5940; m.p1Health[0] = 144; m.p2Health[0] = 144;
    m.hitStop[0] = 0; m.freezeStep[0] = 0; m.resetStep[0] = ctx.step + 1;
    const controls = ctx.resource(CombatInput);
    // Physical inputs are edge-driven: retain held directions across resets until release.
    for (const field of ['pressed', 'buffered', 'bufferAge', 'history', 'historyStep', 'historyCount', 'direction', 'motion', 'motionAge'] as const) controls[field].fill(0);
  },
});
