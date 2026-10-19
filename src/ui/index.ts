import { gameengine, loading, SetBusVolume } from '@gameengine/runtime';
import { createEffect, createMemo, createSignal, defineUI, emit, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { MatchIntent, MatchState, TrainingIntent, TrainingState } from '../schema.gen.ts';
import { AudioSettings, FightBanner, MatchPanel, PAUSED_PANEL, READY_PANEL, StreetFighterHud, TrainingConsole, type AudioSettingsModel, type BannerModel, type HudModel, type MatchPanelModel, type TrainingModel } from './views.tsx';
export { AudioSettings, FightBanner, MatchPanel, StreetFighterHud, TrainingConsole } from './views.tsx';
const MODES = ['SOLO', 'LOCAL VERSUS', 'TRAINING'] as const;
const DIFFICULTIES = ['EASY', 'NORMAL', 'HARD'] as const;
const DUMMIES = ['STAND', 'BLOCK', 'LOW BLOCK', 'JUMP', 'CPU'] as const;
const INPUT_NAMES = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'THROW'] as const;

export const MatchUI = defineUI({
  name: 'MatchUI',
  root: () => {
    void loading.boot({ load: ['arena'], model: { label: 'Preparing the arena' } });
    const match = useResource(MatchState), training = useResource(TrainingState);
    const [music, setMusic] = createSignal(Math.max(0, Math.min(1, gameengine.kv.get<number>('sf.settings.music', 0.6))));
    const [sfx, setSfx] = createSignal(Math.max(0, Math.min(1, gameengine.kv.get<number>('sf.settings.sfx', 0.7))));
    let settings: ViewHandle<AudioSettingsModel> | undefined;
    const audioModel = (): AudioSettingsModel => ({ musicLabel: `MUSIC: ${Math.round(music() * 100)}%`, sfxLabel: `EFFECTS: ${Math.round(sfx() * 100)}%` });
    createEffect(() => {
      emit(SetBusVolume, { bus: 'Music', volume: music() * (match()?.phase === 3 ? 0.3 : 1) });
    });
    createEffect(() => { emit(SetBusVolume, { bus: 'SFX', volume: sfx() }); emit(SetBusVolume, { bus: 'Voice', volume: sfx() }); });
    createEffect(() => { const model = audioModel(); if (settings) settings.update(model); });
    const onIntent = (name: string) => {
      const state = untrack(match), t = untrack(training);
      if (name === 'settings') { emit(MatchIntent, { action: 13 }); return; }
      if (name === 'close-settings') { emit(MatchIntent, { action: 14 }); return; }
      if (name === 'music-down' || name === 'music-up') { const next = Math.max(0, Math.min(1, Math.round((music() + (name === 'music-up' ? 0.1 : -0.1)) * 10) / 10)); setMusic(next); gameengine.kv.set('sf.settings.music', next); return; }
      if (name === 'sfx-down' || name === 'sfx-up') { const next = Math.max(0, Math.min(1, Math.round((sfx() + (name === 'sfx-up' ? 0.1 : -0.1)) * 10) / 10)); setSfx(next); gameengine.kv.set('sf.settings.sfx', next); return; }
      if (name === 'dummy') { emit(TrainingIntent, { action: 0, value: ((t?.dummyMode ?? 0) + 1) % 5 }); return; }
      if (name === 'reset-training') { emit(TrainingIntent, { action: 1, value: 0 }); return; }
      if (name === 'boxes') { emit(TrainingIntent, { action: 2, value: t?.showBoxes ? 0 : 1 }); return; }
      const action = name === 'start' ? 0 : name === 'rematch' ? 1 : name === 'pause' ? 2 : name === 'resume' ? 3 : name === 'restart' ? 5 : name === 'title' ? 6 : name === 'solo' ? 7 : name === 'local' ? 8 : name === 'training' ? 9 : name === 'difficulty' ? 10 + ((state?.difficulty ?? 1) + 1) % 3 : -1;
      if (action >= 0) emit(MatchIntent, { action });
    };
    createEffect(() => {
      if (match()?.settingsOpen) {
        if (!settings) settings = views.push(AudioSettings, untrack(audioModel), { onIntent });
      } else { settings?.close({ immediate: true }); settings = undefined; }
    });
    const seconds = createMemo(() => Math.max(0, Math.ceil((match()?.remaining ?? 5940) / 60)));
    const snapshot = (): HudModel => {
      const s = match();
      return { training: s?.mode === 2, p1Health: s?.p1Health ?? 144, p2Health: s?.p2Health ?? 144, p1Score: s?.p1Score ?? 0, p2Score: s?.p2Score ?? 0, p1Wins: s?.p1Wins ?? 0, p2Wins: s?.p2Wins ?? 0, timer: seconds(), round: s?.round ?? 1 };
    };
    const hud = views.push(StreetFighterHud, untrack(snapshot), { onIntent });
    createEffect(() => hud.update(snapshot()));
    let panel: ViewHandle<MatchPanelModel> | undefined;
    createEffect(() => {
      const s = match(), phase = s?.phase ?? 0;
      if (phase !== 0 && phase !== 3 && phase !== 5) {
        panel?.close({ immediate: true }); panel = undefined;
        settings?.close({ immediate: true }); settings = undefined;
        return;
      }
      let model: MatchPanelModel = READY_PANEL;
      if (phase === 3) model = PAUSED_PANEL;
      else if (phase === 5 && s) model = { title: s.matchWinner === 0 ? 'RYU WINS THE MATCH' : 'KEN WINS THE MATCH', subtitle: `FINAL SCORE  /  RYU ${s.p1Wins} - KEN ${s.p2Wins}`, hint: 'ENTER TO REMATCH', ready: false, paused: false, result: true, settingsable: false, canReturn: true };
      else if (s) model = { ...READY_PANEL, subtitle: `${MODES[s.mode]}  /  ${s.mode === 0 ? 'RYU vs CPU' : s.mode === 1 ? 'RYU vs KEN' : 'PRACTICE WITHOUT A TIMER'}`, soloLabel: s.mode === 0 ? 'SOLO [SELECTED]' : 'SOLO', localLabel: s.mode === 1 ? 'LOCAL [SELECTED]' : 'LOCAL VERSUS', trainingLabel: s.mode === 2 ? 'TRAINING [SELECTED]' : 'TRAINING', difficultyLabel: `CPU: ${DIFFICULTIES[s.difficulty]}` };
      if (panel) panel.update(model); else panel = views.push(MatchPanel, model, { onIntent });
    });
    const fight = createMemo(() => match()?.phase === 1 && (match()?.phaseTicks ?? 0) > 0);
    let banner: ViewHandle<BannerModel> | undefined;
    createEffect(() => {
      const s = match(), phase = s?.phase ?? 0;
      if (!s || (phase !== 4 && phase !== 2 && !fight())) { banner?.close({ immediate: true }); banner = undefined; return; }
      const model = phase === 4 ? { label: `ROUND ${s.round}`, detail: 'BEST OF THREE / FIRST TO TWO WINS' } : phase === 2 ? { label: s.winner === 2 ? 'DRAW' : s.winner === 0 ? 'RYU WINS' : 'KEN WINS', detail: `${s.remaining === 0 ? 'TIME UP' : 'KO'} / RYU ${s.p1Wins} - KEN ${s.p2Wins}` } : { label: 'FIGHT', detail: '' };
      if (banner) banner.update(model); else banner = views.push(FightBanner, model);
    });
    let consoleView: ViewHandle<TrainingModel> | undefined;
    createEffect(() => {
      const s = match();
      if (s?.mode !== 2 || s.phase !== 1) { consoleView?.close({ immediate: true }); consoleView = undefined; return; }
      const t = training(), bits = t?.inputBits ?? 0;
      const model: TrainingModel = { stats: `DAMAGE ${t?.lastDamage ?? 0} / TOTAL ${t?.damage ?? 0} / COMBO ${t?.combo ?? 0} / BEST ${t?.maxCombo ?? 0}`, inputs: `INPUT: ${INPUT_NAMES.filter((_, i) => (bits & 1 << i) !== 0).join('+') || 'NEUTRAL'}`, dummyLabel: `DUMMY: ${DUMMIES[t?.dummyMode ?? 0]}`, boxesLabel: `HITBOXES: ${t?.showBoxes ? 'ON' : 'OFF'}` };
      if (consoleView) consoleView.update(model); else consoleView = views.push(TrainingConsole, model, { onIntent });
    });
    return null;
  },
});
