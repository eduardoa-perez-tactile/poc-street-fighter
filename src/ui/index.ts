import { gameengine, loading, SetBusVolume } from '@gameengine/runtime';
import { createEffect, createMemo, defineUI, emit, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { MatchIntent, MatchState, MenuIntent, MenuState, TrainingIntent, TrainingState } from '../schema.gen.ts';
import { stageById } from '../data/stages.ts';
import { browserOptionsAvailable, openBrowserControls, toggleBrowserFullscreen } from '../platform/browser-options.ts';
import { FightBanner, StreetFighterHud, TrainingConsole, type BannerModel, type HudModel, type TrainingModel } from './views.tsx';
import { AlphaTitle, AlphaMain, AlphaSetup, AlphaPause, AlphaMoves, AlphaOptions, AlphaResults, type ArcadeModel } from './alpha.views.tsx';
export { AlphaTitle, AlphaMain, AlphaSetup, AlphaPause, AlphaMoves, AlphaOptions, AlphaResults } from './alpha.views.tsx';
export { AlphaMain as MatchPanel } from './alpha.views.tsx';
export { FightBanner, StreetFighterHud, TrainingConsole } from './views.tsx';
const SCREENS = [AlphaTitle, AlphaMain, AlphaSetup, AlphaPause, AlphaMoves, AlphaOptions, AlphaResults] as const;
const DIFFICULTIES = ['EASY', 'NORMAL', 'HARD'] as const;
const fighterName = (id: number) => id === 0 ? 'RYU' : 'KEN';
const DUMMIES = ['STAND', 'BLOCK', 'LOW BLOCK', 'JUMP', 'CPU'] as const;
const INPUT_NAMES = ['LEFT', 'RIGHT', 'UP', 'DOWN', 'LP', 'MP', 'HP', 'LK', 'MK', 'HK', 'THROW'] as const;
const savedVolume = (key: string, fallback: number) => {
  const value = gameengine.kv.get<number>(key, fallback / 100);
  return Number.isFinite(value) ? Math.max(0, Math.min(100, Math.round(value <= 1 ? value * 100 : value))) : fallback;
};

/** The sim owns menu focus and flow; this controller binds its model and plays platform requests. */
export const MatchUI = defineUI({
  name: 'MatchUI',
  root: () => {
    void loading.boot({ load: ['arena'], model: { label: 'Preparing the arena' } });
    const match = useResource(MatchState), menu = useResource(MenuState), training = useResource(TrainingState);
    let eventId = untrack(menu)?.lastIntent ?? 0;
    const sendMenu = (action: number, value = 0) => {
      const state = untrack(menu);
      eventId = Math.max(eventId, state?.lastIntent ?? 0) + 1;
      emit(MenuIntent, { action, value, id: eventId, screen: state?.screen ?? 0 });
    };
    sendMenu(8, savedVolume('sf.settings.music', 60));
    sendMenu(9, savedVolume('sf.settings.sfx', 70));
    sendMenu(10, browserOptionsAvailable() ? 1 : 0);
    const seeded = eventId;
    const seededReady = createMemo(() => (menu()?.lastIntent ?? 0) >= seeded);
    const musicVolume = createMemo(() => menu()?.music ?? 60);
    const effectsVolume = createMemo(() => menu()?.sfx ?? 70);
    const musicDuck = createMemo(() => match()?.phase === 3 ? 0.3 : 1);
    createEffect(() => {
      if (seededReady()) emit(SetBusVolume, { bus: 'Music', volume: musicVolume() / 100 * musicDuck() });
    });
    createEffect(() => {
      if (!seededReady()) return;
      const volume = effectsVolume() / 100;
      emit(SetBusVolume, { bus: 'SFX', volume }); emit(SetBusVolume, { bus: 'Voice', volume });
    });
    createEffect(() => { if (seededReady()) gameengine.kv.set('sf.settings.music', musicVolume() / 100); });
    createEffect(() => { if (seededReady()) gameengine.kv.set('sf.settings.sfx', effectsVolume() / 100); });
    let browserRequest = untrack(menu)?.browserRequest ?? 0;
    createEffect(() => {
      const state = menu();
      if (!state || state.browserRequest === browserRequest) return;
      browserRequest = state.browserRequest;
      if (state.browserAction === 0) openBrowserControls(); else toggleBrowserFullscreen();
    });
    const onIntent = (name: string) => {
      const state = untrack(menu), game = untrack(match), t = untrack(training);
      if (name === 'pause') { emit(MatchIntent, { action: 2 }); return; }
      if (name === 'dummy') { emit(TrainingIntent, { action: 0, value: ((t?.dummyMode ?? 0) + 1) % 5 }); return; }
      if (name === 'reset-training') { emit(TrainingIntent, { action: 1, value: 0 }); return; }
      if (name === 'boxes') { emit(TrainingIntent, { action: 2, value: t?.showBoxes ? 0 : 1 }); return; }
      if (name === 'music-down' || name === 'music-up') { sendMenu(8, Math.max(0, Math.min(100, (state?.music ?? 60) + (name === 'music-up' ? 10 : -10)))); return; }
      if (name === 'effects-down' || name === 'effects-up') { sendMenu(9, Math.max(0, Math.min(100, (state?.sfx ?? 70) + (name === 'effects-up' ? 10 : -10)))); return; }
      const screen = state?.screen ?? 0;
      if (name === 'swap-p1' || name === 'swap-p2') { sendMenu(11, name === 'swap-p2' ? 1 : 0); return; }
      if (name === 'press-start') { sendMenu(0); return; }
      if (name === 'back') { sendMenu(1); return; }
      let index = -1;
      if (screen === 1) index = ['solo', 'local', 'training', 'options'].indexOf(name);
      else if (screen === 2) index = name === 'p1-character' ? 0 : name === 'p2-character' ? 1 : name === 'stage' ? 2 : name === 'difficulty' ? 3 : name === 'fight' ? (game?.mode === 0 ? 4 : 3) : -1;
      else if (screen === 3) index = ['resume', 'moves', 'options', 'restart', 'main-menu'].indexOf(name);
      else if (screen === 4 && name === 'back') index = 0;
      else if (screen === 5) index = ['music', 'effects', 'browser-controls', 'fullscreen'].indexOf(name);
      else if (screen === 6) index = ['rematch', 'main-menu'].indexOf(name);
      if (index >= 0) sendMenu(6, index);
    };
    const seconds = createMemo(() => Math.max(0, Math.ceil((match()?.remaining ?? 5940) / 60)));
    const snapshot = (): HudModel => {
      const s = match();
      return { p1Name: fighterName(s?.p1Fighter ?? 0), p2Name: fighterName(s?.p2Fighter ?? 1), training: s?.mode === 2, p1Health: s?.p1Health ?? 144, p2Health: s?.p2Health ?? 144, p1Score: s?.p1Score ?? 0, p2Score: s?.p2Score ?? 0, p1Wins: s?.p1Wins ?? 0, p2Wins: s?.p2Wins ?? 0, timer: seconds(), round: s?.round ?? 1 };
    };
    const hud = views.push(StreetFighterHud, untrack(snapshot), { onIntent });
    createEffect(() => hud.update(snapshot()));
    let flow: ViewHandle<ArcadeModel> | undefined;
    let shownScreen = -1;
    createEffect(() => {
      const s = match(), m = menu(), phase = s?.phase ?? 0;
      if (!m || (phase !== 0 && phase !== 3 && phase !== 5 && phase !== 6)) { flow?.close({ immediate: true }); flow = undefined; shownScreen = -1; return; }
      const screen = phase === 6 ? 2 : Math.min(6, m.screen), winner = s?.matchWinner ?? 0;
      const winnerFighter = winner === 1 ? s?.p2Fighter ?? 1 : s?.p1Fighter ?? 0;
      const model: ArcadeModel = {
        cursor: m.cursor, mode: s?.mode ?? 0, difficulty: DIFFICULTIES[s?.difficulty ?? 1]!,
        music: `${m.music}%`, effects: `${m.sfx}%`, browser: m.browserAvailable,
        winner: `${fighterName(winnerFighter)} WINS`, score: `ROUNDS ${s?.p1Wins ?? 0} - ${s?.p2Wins ?? 0}`, points: `P1 ${s?.p1Score ?? 0} / P2 ${s?.p2Score ?? 0}`,
        portrait: `ui/arcade/${winnerFighter === 0 ? 'ryu' : 'ken'}-portrait`,
        p1Fighter: s?.p1Fighter ?? 0, p2Fighter: s?.p2Fighter ?? 1, stage: `${stageById(s?.stageId ?? 0).name} / ${stageById(s?.stageId ?? 0).location}`, stagePreview: stageById(s?.stageId ?? 0).preview,
        p1Ready: m.p1Ready, p2Ready: m.p2Ready, versus: phase === 6,
      };
      if (flow && shownScreen === screen) flow.update(model);
      else { flow?.close({ immediate: true }); shownScreen = screen; flow = views.push(SCREENS[screen]!, model, { onIntent }); }
    });
    const fight = createMemo(() => match()?.phase === 1 && (match()?.phaseTicks ?? 0) > 0);
    let banner: ViewHandle<BannerModel> | undefined;
    createEffect(() => {
      const s = match(), phase = s?.phase ?? 0;
      if (!s || (phase !== 4 && phase !== 2 && !fight())) { banner?.close({ immediate: true }); banner = undefined; return; }
      const model = phase === 4 ? { label: `ROUND ${s.round}`, detail: 'FIRST TO TWO WINS' } : phase === 2 ? { label: s.winner === 2 ? 'DRAW' : `${fighterName(s.winner === 0 ? s.p1Fighter : s.p2Fighter)} WINS`, detail: `${s.remaining === 0 ? 'TIME UP' : 'KO'} / ${s.p1Wins} - ${s.p2Wins}` } : { label: 'FIGHT', detail: '' };
      if (banner) banner.update(model); else banner = views.push(FightBanner, model);
    });
    let consoleView: ViewHandle<TrainingModel> | undefined;
    createEffect(() => {
      const s = match();
      if (s?.mode !== 2 || s.phase !== 1) { consoleView?.close({ immediate: true }); consoleView = undefined; return; }
      const t = training(), bits = t?.inputBits ?? 0;
      const model: TrainingModel = { stats: `DAMAGE ${t?.lastDamage ?? 0} / TOTAL ${t?.damage ?? 0} / COMBO ${t?.combo ?? 0} / BEST ${t?.maxCombo ?? 0}`, inputs: `INPUT: ${INPUT_NAMES.filter((_, i) => (bits & 1 << i) !== 0).join('+') || 'NEUTRAL'}`, dummyLabel: `DUMMY: ${DUMMIES[t?.dummyMode ?? 0]}`, boxesLabel: `BOXES: ${t?.showBoxes ? 'ON' : 'OFF'}` };
      if (consoleView) consoleView.update(model); else consoleView = views.push(TrainingConsole, model, { onIntent });
    });
    return null;
  },
});
