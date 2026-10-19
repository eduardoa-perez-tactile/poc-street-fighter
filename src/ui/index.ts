import { loading } from '@gameengine/runtime';
import { createEffect, createMemo, defineUI, emit, untrack, useResource, views, type ViewHandle } from '@gameengine/ui';
import { MatchIntent, MatchState } from '../schema.gen.ts';
import { MatchPanel, PAUSED_PANEL, READY_PANEL, StreetFighterHud, type HudModel, type MatchPanelModel } from './views.tsx';

export { MatchPanel, StreetFighterHud } from './views.tsx';

/** Presentation owns only view handles; all match state and commands stay in the simulation. */
export const MatchUI = defineUI({
  name: 'MatchUI',
  root: () => {
    // Pin every arena texture before the title accepts input; rematches reuse the resident group.
    void loading.boot({ load: ['arena'], model: { label: 'Preparing the arena' } });
    const match = useResource(MatchState);
    const seconds = createMemo(() => Math.max(0, Math.ceil((match()?.remaining ?? 5940) / 60)));
    const onIntent = (name: string) => {
      const action = name === 'start' ? 0 : name === 'rematch' || name === 'restart' ? 1 : name === 'pause' ? 2 : name === 'resume' ? 3 : -1;
      if (action >= 0) emit(MatchIntent, { action });
    };
    const snapshot = (): HudModel => {
      const state = match();
      return {
        p1Health: state?.p1Health ?? 144, p2Health: state?.p2Health ?? 144,
        p1Score: state?.p1Score ?? 0, p2Score: state?.p2Score ?? 0,
        p1Wins: state?.p1Wins ?? 0, p2Wins: state?.p2Wins ?? 0,
        timer: seconds(), round: state?.round ?? 1,
      };
    };
    const hud = views.push(StreetFighterHud, untrack(snapshot), { onIntent });
    createEffect(() => hud.update(snapshot()));
    let panel: ViewHandle<MatchPanelModel> | undefined;
    createEffect(() => {
      const state = match();
      const phase = state?.phase ?? 0;
      if (phase === 1) {
        panel?.close({ immediate: true });
        panel = undefined;
        return;
      }
      let model = READY_PANEL;
      if (phase === 3) model = PAUSED_PANEL;
      else if (phase === 2 && state) {
        model = {
          title: state.winner === 0 ? 'RYU WINS' : state.winner === 1 ? 'KEN WINS' : 'DRAW',
          subtitle: `${state.remaining === 0 ? 'TIME UP' : state.winner === 2 ? 'DOUBLE KO' : 'KO'}  /  RYU ${state.p1Wins} — KEN ${state.p2Wins}`,
          hint: 'ENTER TO PLAY AGAIN', ready: false, paused: false, result: true,
        };
      }
      if (panel) panel.update(model);
      else panel = views.push(MatchPanel, model, { onIntent });
    });
    return null;
  },
});
