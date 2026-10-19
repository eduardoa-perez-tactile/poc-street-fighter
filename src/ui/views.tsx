import { defineView, Screen, View, Widget } from '@gameengine/ui';
import '../ui.gen.ts';

export interface HudModel {
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
        <Widget doc="fight-footer" onIntent={(_, event) => intent(event.path.at(-1)!)} />
      </View>
    </Screen>
  ),
});

export interface MatchPanelModel {
  title: string;
  subtitle: string;
  hint: string;
  ready: boolean;
  paused: boolean;
  result: boolean;
}

export const READY_PANEL: MatchPanelModel = {
  title: 'STREET FIGHTER', subtitle: 'LOCAL VERSUS  /  RYU vs KEN', hint: 'ENTER TO START', ready: true, paused: false, result: false,
};
export const PAUSED_PANEL: MatchPanelModel = {
  title: 'PAUSED', subtitle: 'Take a breath. The round is waiting.', hint: 'ESC TO RESUME', ready: false, paused: true, result: false,
};

export const MatchPanel = defineView<MatchPanelModel>({
  name: 'MatchPanel',
  description: 'Start instructions, pause and round results. Intents: start, resume, restart, rematch.',
  blockInput: true,
  dims: true,
  samples: {
    ready: READY_PANEL,
    paused: PAUSED_PANEL,
    ryuWins: { ...PAUSED_PANEL, title: 'RYU WINS', subtitle: 'KO  /  RYU 1 — KEN 0', hint: 'ENTER TO PLAY AGAIN', paused: false, result: true },
    kenWins: { ...PAUSED_PANEL, title: 'KEN WINS', subtitle: 'TIME UP  /  RYU 0 — KEN 1', hint: 'ENTER TO PLAY AGAIN', paused: false, result: true },
    draw: { ...PAUSED_PANEL, title: 'DRAW', subtitle: 'An even match. Settle it in the next round.', hint: 'ENTER TO PLAY AGAIN', paused: false, result: true },
  },
  render: (model, { intent }) => (
    <Widget doc="match-panel" props={{
      title: () => model().title, subtitle: () => model().subtitle, hint: () => model().hint,
      ready: () => model().ready, paused: () => model().paused, result: () => model().result,
    }} onIntent={(_, event) => intent(event.path.at(-1)!)} />
  ),
});
