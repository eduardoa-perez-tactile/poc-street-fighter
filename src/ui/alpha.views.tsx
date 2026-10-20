import { defineView, Widget } from '@gameengine/ui';
import '../ui.gen.ts';

export interface ArcadeModel {
  cursor: number; mode: number; difficulty: string; music: string; effects: string;
  browser: boolean; winner: string; score: string; portrait: string; points: string;
  p1Fighter: number; p2Fighter: number; stage: string; stagePreview: string; p1Ready: boolean; p2Ready: boolean; versus: boolean;
}
export const ARCADE_SAMPLE: ArcadeModel = { cursor: 0, mode: 0, difficulty: 'NORMAL', music: '60%', effects: '70%', browser: false, winner: 'RYU WINS', score: '2 - 0', portrait: 'ui/arcade/ryu-portrait', points: 'P1 0 / P2 0', p1Fighter: 0, p2Fighter: 1, stage: "KEN'S DOCK / U.S.A.", stagePreview: 'stages/ken/preview', p1Ready: false, p2Ready: false, versus: false };

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
  samples: { solo: { ...ARCADE_SAMPLE, cursor: 1 }, difficulty: { ...ARCADE_SAMPLE, cursor: 3 }, versus: { ...ARCADE_SAMPLE, mode: 1 }, versusIntro: { ...ARCADE_SAMPLE, mode: 1, versus: true, p1Ready: true, p2Ready: true }, training: { ...ARCADE_SAMPLE, mode: 2 } },
  render: (m, { intent }) => <Widget doc="alpha-setup" class="alpha-flow" props={{
    heading: () => m().versus ? 'VERSUS' : 'PLAYER SELECT',
    detail: () => `${m().stage} / ${m().mode === 2 ? 'UNLIMITED PRACTICE' : 'FIRST TO TWO WINS'}`,
    hint: () => 'LEFT / RIGHT: SWAP RYU / KEN    ENTER / A: LOCK IN    ESC / B: BACK',
    p1name: () => m().p1Fighter === 0 ? 'RYU' : 'KEN', p2name: () => m().p2Fighter === 0 ? 'RYU' : 'KEN',
    p1portrait: () => `ui/arcade/${m().p1Fighter === 0 ? 'ryu' : 'ken'}-portrait`,
    p2portrait: () => `ui/arcade/${m().p2Fighter === 0 ? 'ryu' : 'ken'}-portrait`,
    p1status: () => m().versus || m().p1Ready ? 'PLAYER 1 / READY' : 'PLAYER 1 / CHOOSE',
    p2status: () => m().mode !== 1 ? (m().mode === 0 ? 'CPU' : 'DUMMY') : m().versus || m().p2Ready ? 'PLAYER 2 / READY' : 'PLAYER 2 / CHOOSE',
    stage: () => m().stage, stagePreview: () => m().stagePreview, versus: () => m().versus,
    solo: () => m().mode === 0, difficulty: () => m().difficulty,
    f0: () => m().cursor === 0, f1: () => m().cursor === 1, f2: () => m().cursor === 2,
    f3: () => m().mode === 0 && m().cursor === 3,
    f4: () => m().cursor === (m().mode === 0 ? 4 : 3),
    f5: () => m().cursor === (m().mode === 0 ? 5 : 4),
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
  samples: { ryu: ARCADE_SAMPLE, ken: { ...ARCADE_SAMPLE, winner: 'KEN WINS', score: '1 - 2', portrait: 'ui/arcade/ken-portrait' } },
  render: (m, { intent }) => <Widget doc="alpha-results" class="alpha-flow" props={{
    winner: () => m().winner, score: () => m().score, points: () => m().points, portrait: () => m().portrait,
    f0: () => m().cursor === 0, f1: () => m().cursor === 1,
  }} onIntent={(_, e) => intent(e.path.at(-1)!)} />,
});
