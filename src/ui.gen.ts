// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
// This project's UI documents (ui/**/*.ui.json, ADR 0122) as types: `<Widget doc="…">` checks its
// props, codeAreas and refs against them. Types only: nothing imports this file at run time.
// Events are the names `onIntent` hears: `<id>` is the placing `<Widget>`'s `id` or `eventKey` (else a slug of
// its first text property's value, else the document's name), or in a document the use's key; `<item>` is a
// Repeat item's key.
import type { LocText } from '@gameengine/ui';

declare module '@gameengine/ui' {
  interface UiDocumentTypes {
    /**
     * Fight button: a widget, button (ui/docs/fight-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default "FIGHT"
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'fight-button': {
      props: { label: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Fight footer: a widget (ui/docs/fight-footer.ui.json)
     *
     * Properties: none
     * Events: `<id>: pause`
     * Code areas: none
     * Refs: `pause`
     */
    'fight-footer': {
      props: {};
      areas: never;
      refs: 'pause';
    };
    /**
     * Fight hud: a widget (ui/docs/fight-hud.ui.json)
     *
     * Properties:
     *   - `healthone`: number, default 144
     *   - `healthtwo`: number, default 144
     *   - `timer`: number, default 99
     *   - `p1Score`: number, default 0
     *   - `p2Score`: number, default 0
     *   - `p1Wins`: number, default 0
     *   - `p2Wins`: number, default 0
     *   - `round`: number, default 1
     * Events: none
     * Code areas: none
     * Refs: none
     * Samples (`view render doc:fight-hud --sample …`): `opening`, `closeFight`, `half`, `empty`
     */
    'fight-hud': {
      props: { healthone: number; healthtwo: number; timer: number; p1Score: number; p2Score: number; p1Wins: number; p2Wins: number; round: number };
      areas: never;
      refs: never;
    };
    /**
     * Match panel: a view, dialog (ui/docs/match-panel.ui.json)
     *
     * Properties:
     *   - `title`: text, default "STREET FIGHTER"
     *   - `subtitle`: text, default "LOCAL VERSUS  /  RYU vs KEN"
     *   - `hint`: text, default "ENTER TO START"
     *   - `ready`: yesno, default true
     *   - `paused`: yesno, default false
     *   - `result`: yesno, default false
     * Events: `start`, `resume`, `restart`, `rematch`
     * Code areas: none
     * Refs: `start`, `resume`, `restart`, `rematch`
     * Samples (`view render doc:match-panel --sample …`): `ready`, `paused`, `ryuWins`, `kenWins`, `draw`
     */
    'match-panel': {
      props: { title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; hint: string | { loc: string } | LocText; ready: boolean; paused: boolean; result: boolean };
      areas: never;
      refs: 'start' | 'resume' | 'restart' | 'rematch';
    };
  }
}
