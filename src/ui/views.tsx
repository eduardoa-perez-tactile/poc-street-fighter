import { defineView, Screen, View, Widget } from '@gameengine/ui';
import '../ui.gen.ts';

export interface HudModel {
  training?: boolean;
  p1Name?: string; p2Name?: string;
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
    training: { ...opening, training: true },
    closeFight: { ...opening, p1Health: 24, p2Health: 80, p1Score: 1200, p2Score: 800, p1Wins: 1, p2Wins: 2, timer: 12, round: 4 },
    knockout: { ...opening, p2Health: 0, p1Health: 28, timer: 3, p1Score: 3600 },
  },
  render: (model, { intent }) => (
    <Screen safeArea class="sf-hud">
      <View class="sf-hud-top">
        <Widget doc="fight-hud" props={{
          p1name: () => model().p1Name ?? 'RYU', p2name: () => model().p2Name ?? 'KEN',
          healthone: () => model().p1Health, healthtwo: () => model().p2Health,
          p1Score: () => model().p1Score, p2Score: () => model().p2Score,
          p1Wins: () => model().p1Wins, p2Wins: () => model().p2Wins,
          p1one: () => model().p1Wins >= 1, p1two: () => model().p1Wins >= 2, p2one: () => model().p2Wins >= 1, p2two: () => model().p2Wins >= 2,
          timertext: () => model().training ? '--' : String(model().timer),
          centerlabel: () => model().training ? 'TRAINING' : 'TIME',
          roundtext: () => model().training ? '' : `ROUND ${model().round}`,
        }} onIntent={(_, event) => intent(event.path.at(-1)!)} />
      </View>
    </Screen>
  ),
});

export interface BannerModel { label: string; detail: string }
export const FightBanner = defineView<BannerModel>({
  name: 'FightBanner', blockInput: false,
  samples: { intro: { label: 'ROUND 1', detail: 'BEST OF THREE' }, fight: { label: 'FIGHT', detail: '' }, knockout: { label: 'RYU WINS', detail: 'KO / NEXT ROUND' } },
  render: (m) => <Screen safeArea class="sf-banner-screen"><View class="sf-banner"><Widget doc="fight-banner" props={{ label: () => m().label, detail: () => m().detail, original: () => m().label === 'FIGHT', art: 'ui/arcade/hud-fight' }} /></View></Screen>,
});

export interface TrainingModel { stats: string; inputs: string; dummyLabel: string; boxesLabel: string }
export const TrainingConsole = defineView<TrainingModel>({
  name: 'TrainingConsole',
  samples: { idle: { stats: 'DAMAGE 0 / COMBO 0 / BEST 0', inputs: 'INPUT: NEUTRAL', dummyLabel: 'DUMMY: STAND', boxesLabel: 'HITBOXES: OFF' }, combo: { stats: 'DAMAGE 72 / COMBO 3 / BEST 5', inputs: 'INPUT: RIGHT + HP', dummyLabel: 'DUMMY: BLOCK', boxesLabel: 'HITBOXES: ON' } },
  render: (m, { intent }) => <Screen safeArea class="sf-training-screen"><View class="sf-training"><Widget doc="training-console" props={{ stats: () => m().stats, inputs: () => m().inputs, dummyLabel: () => m().dummyLabel, boxesLabel: () => m().boxesLabel }} onIntent={(_, e) => intent(e.path.at(-1)!)} /></View></Screen>,
});
