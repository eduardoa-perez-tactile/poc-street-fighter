import { defineView, Widget } from '@gameengine/ui';
import '../ui.gen.ts';

export interface ArcadeModel {
  cursor: number; mode: number; difficulty: string; music: string; effects: string;
  browser: boolean; winner: string; score: string; portrait: string;
}
export const ARCADE_SAMPLE: ArcadeModel = { cursor: 0, mode: 0, difficulty: 'NORMAL', music: '60%', effects: '70%', browser: false, winner: 'RYU WINS', score: '2 - 0', portrait: 'ui/ryu-portrait' };

export const AlphaTitle = defineView<ArcadeModel>({
  name: 'AlphaTitle', blockInput: true,
  samples: { title: ARCADE_SAMPLE },
  render: (_m, { intent }) => <Widget doc="alpha-title" class="alpha-flow" onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
export const AlphaMain = defineView<ArcadeModel>({
  name: 'AlphaMain', blockInput: true,
  samples: { solo: ARCADE_SAMPLE, versus: { ...ARCADE_SAMPLE, cursor: 1 }, training: { ...ARCADE_SAMPLE, cursor: 2 }, options: { ...ARCADE_SAMPLE, cursor: 3 } },
  render: (m, { intent }) => <Widget doc="alpha-main" class="alpha-flow" props={{ f0: () => m().cursor === 0, f1: () => m().cursor === 1, f2: () => m().cursor === 2, f3: () => m().cursor === 3 }} onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
export const AlphaSetup = defineView<ArcadeModel>({
  name: 'AlphaSetup', blockInput: true,
  samples: { solo: { ...ARCADE_SAMPLE, cursor: 1 }, difficulty: ARCADE_SAMPLE, versus: { ...ARCADE_SAMPLE, mode: 1 }, training: { ...ARCADE_SAMPLE, mode: 2 } },
  render: (m, { intent }) => <Widget doc="alpha-setup" class="alpha-flow" props={{
    heading: () => m().mode === 0 ? 'SOLO BATTLE' : m().mode === 1 ? 'VERSUS BATTLE' : 'TRAINING',
    detail: () => m().mode === 2 ? "KEN'S STAGE / UNLIMITED PRACTICE" : "KEN'S STAGE / FIRST TO TWO WINS",
    hint: () => m().mode === 0 ? 'LEFT / RIGHT: ADJUST    ENTER / A: CONFIRM    ESC / B: BACK' : 'ENTER / A: FIGHT    ESC / B: BACK',
    solo: () => m().mode === 0, difficulty: () => m().difficulty, opponent: () => m().mode === 0 ? 'CPU' : m().mode === 1 ? 'PLAYER 2' : 'DUMMY',
    f0: () => m().mode === 0 && m().cursor === 0,
    f1: () => m().cursor === (m().mode === 0 ? 1 : 0),
    f2: () => m().cursor === (m().mode === 0 ? 2 : 1),
  }} onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});

export const AlphaPause = defineView<ArcadeModel>({
  name: 'AlphaPause', blockInput: true, dims: true,
  samples: { resume: ARCADE_SAMPLE, moves: { ...ARCADE_SAMPLE, cursor: 1 }, options: { ...ARCADE_SAMPLE, cursor: 2 } },
  render: (m, { intent }) => <Widget doc="alpha-pause" class="alpha-flow" props={{ f0: () => m().cursor === 0, f1: () => m().cursor === 1, f2: () => m().cursor === 2, f3: () => m().cursor === 3, f4: () => m().cursor === 4 }} onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
export const AlphaMoves = defineView<ArcadeModel>({
  name: 'AlphaMoves', blockInput: true,
  samples: { moves: ARCADE_SAMPLE },
  render: (_m, { intent }) => <Widget doc="alpha-moves" class="alpha-flow" onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
export const AlphaOptions = defineView<ArcadeModel>({
  name: 'AlphaOptions', blockInput: true,
  samples: { music: ARCADE_SAMPLE, effects: { ...ARCADE_SAMPLE, cursor: 1 }, browser: { ...ARCADE_SAMPLE, browser: true, cursor: 2 } },
  render: (m, { intent }) => <Widget doc="alpha-options" class="alpha-flow" props={{
    music: () => m().music, effects: () => m().effects, browser: () => m().browser,
    f0: () => m().cursor === 0, f1: () => m().cursor === 1,
    f2: () => m().browser && m().cursor === 2,
    f3: () => m().browser && m().cursor === 3,
    f4: () => m().cursor === (m().browser ? 4 : 2),
  }} onIntent={(_, e) => { const key = e.path.at(-1)!; intent(key === 'up' || key === 'down' ? e.path.slice(-2).join('-') : key); }} />,
});
export const AlphaResults = defineView<ArcadeModel>({
  name: 'AlphaResults', blockInput: true,
  samples: { ryu: ARCADE_SAMPLE, ken: { ...ARCADE_SAMPLE, winner: 'KEN WINS', score: '1 - 2', portrait: 'ui/ken-portrait' } },
  render: (m, { intent }) => <Widget doc="alpha-results" class="alpha-flow" props={{
    winner: () => m().winner, score: () => m().score, portrait: () => m().portrait,
    f0: () => m().cursor === 0, f1: () => m().cursor === 1,
  }} onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
