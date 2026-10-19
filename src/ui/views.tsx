import { defineView, Screen, View, Widget } from '@gameengine/ui';
import '../ui.gen.ts';

export interface HudModel {
  training?: boolean;
  p1Health: number;
  p2Health: number;
  p1Score: number;
  p2Score: number;
  p1Wins: number;
  p2Wins: number;
  timer: number;
  round: number;
}

const opening: HudModel = { p1Health: 144, p2Health: 144, p1Score: 0, p2Score: 0, p1Wins: 0, p2Wins: 0, timer: 99, round: 1 };

/** The document owns the bars and typography; this view only places and binds it.
 * Number-driver property names stay lowercase: the native CSS parser lowercases custom variables. */
export const StreetFighterHud = defineView<HudModel>({
  name: 'StreetFighterHud',
  description: 'Two player health, score, round and countdown. Intent: pause.',
  samples: {
    opening,
    closeFight: { ...opening, p1Health: 24, p2Health: 80, p1Score: 1200, p2Score: 800, p1Wins: 1, p2Wins: 2, timer: 12, round: 4 },
    knockout: { ...opening, p2Health: 0, p1Health: 28, timer: 3, p1Score: 3600 },
  },
  render: (model, { intent }) => (
    <Screen safeArea class="sf-hud">
      <View class="sf-hud-top">
        <Widget doc="fight-hud" props={{
          healthone: () => model().p1Health, healthtwo: () => model().p2Health,
          p1Score: () => model().p1Score, p2Score: () => model().p2Score,
          p1Wins: () => model().p1Wins, p2Wins: () => model().p2Wins,
          timer: () => model().timer, round: () => model().round,
        }} />
      </View>
      <View class="sf-hud-bottom">
        <Widget doc="fight-footer" props={{ visible: () => !model().training }} onIntent={(_, event) => intent(event.path.at(-1)!)} />
      </View>
    </Screen>
  ),
});

export interface MatchPanelModel {
  soloLabel?: string; localLabel?: string; trainingLabel?: string; difficultyLabel?: string;
  settingsable?: boolean; canReturn?: boolean;
  title: string;
  subtitle: string;
  hint: string;
  ready: boolean;
  paused: boolean;
  result: boolean;
}

export const READY_PANEL: MatchPanelModel = {
  title: 'STREET FIGHTER', subtitle: 'SOLO  /  RYU vs CPU', hint: 'ENTER TO START', ready: true, paused: false, result: false, settingsable: true, canReturn: false,
};
export const PAUSED_PANEL: MatchPanelModel = {
  title: 'PAUSED', subtitle: 'Take a breath. The round is waiting.', hint: 'ESC TO RESUME', ready: false, paused: true, result: false, settingsable: true, canReturn: true,
};

export const MatchPanel = defineView<MatchPanelModel>({
  name: 'MatchPanel',
  description: 'Start instructions, pause and round results. Intents: start, resume, restart, rematch.',
  blockInput: true,
  dims: true,
  samples: {
    ready: READY_PANEL,
    paused: PAUSED_PANEL,
    ryuWins: { ...PAUSED_PANEL, title: 'RYU WINS THE MATCH', subtitle: 'FINAL SCORE / RYU 2 - KEN 0', hint: 'ENTER TO REMATCH', paused: false, result: true, settingsable: false },
    kenWins: { ...PAUSED_PANEL, title: 'KEN WINS THE MATCH', subtitle: 'FINAL SCORE / RYU 1 - KEN 2', hint: 'ENTER TO REMATCH', paused: false, result: true, settingsable: false },
  },
  render: (model, { intent }) => (
    <Widget doc="match-panel" props={{
      title: () => model().title, subtitle: () => model().subtitle, hint: () => model().hint,
      ready: () => model().ready, paused: () => model().paused, result: () => model().result,
      soloLabel: () => model().soloLabel ?? 'SOLO [SELECTED]', localLabel: () => model().localLabel ?? 'LOCAL VERSUS',
      trainingLabel: () => model().trainingLabel ?? 'TRAINING', difficultyLabel: () => model().difficultyLabel ?? 'CPU: NORMAL',
      settingsable: () => model().settingsable ?? false, canReturn: () => model().canReturn ?? false,
    }} onIntent={(_, event) => intent(event.path.at(-1)!)} />
  ),
});

export interface BannerModel { label: string; detail: string }
export const FightBanner = defineView<BannerModel>({
  name: 'FightBanner', blockInput: false,
  samples: { intro: { label: 'ROUND 1', detail: 'BEST OF THREE' }, fight: { label: 'FIGHT', detail: '' }, knockout: { label: 'RYU WINS', detail: 'KO / NEXT ROUND' } },
  render: (m) => <Screen safeArea class="sf-banner-screen"><View class="sf-banner"><Widget doc="fight-banner" props={{ label: () => m().label, detail: () => m().detail }} /></View></Screen>,
});

export interface TrainingModel { stats: string; inputs: string; dummyLabel: string; boxesLabel: string }
export const TrainingConsole = defineView<TrainingModel>({
  name: 'TrainingConsole',
  samples: { idle: { stats: 'DAMAGE 0 / COMBO 0 / BEST 0', inputs: 'INPUT: NEUTRAL', dummyLabel: 'DUMMY: STAND', boxesLabel: 'HITBOXES: OFF' }, combo: { stats: 'DAMAGE 72 / COMBO 3 / BEST 5', inputs: 'INPUT: RIGHT + HP', dummyLabel: 'DUMMY: BLOCK', boxesLabel: 'HITBOXES: ON' } },
  render: (m, { intent }) => <Screen safeArea class="sf-training-screen"><View class="sf-training"><Widget doc="training-console" props={{ stats: () => m().stats, inputs: () => m().inputs, dummyLabel: () => m().dummyLabel, boxesLabel: () => m().boxesLabel }} onIntent={(_, e) => intent(e.path.at(-1)!)} /></View></Screen>,
});

export interface AudioSettingsModel { musicLabel: string; sfxLabel: string }
export const AudioSettings = defineView<AudioSettingsModel>({
  name: 'AudioSettings', blockInput: true, dims: true,
  samples: { normal: { musicLabel: 'MUSIC: 60%', sfxLabel: 'EFFECTS: 70%' }, muted: { musicLabel: 'MUSIC: 0%', sfxLabel: 'EFFECTS: 0%' } },
  render: (m, { intent }) => <Widget doc="audio-settings" props={{ musicLabel: () => m().musicLabel, sfxLabel: () => m().sfxLabel }} onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
