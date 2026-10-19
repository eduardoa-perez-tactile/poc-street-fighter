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
     * Audio settings: a view, dialog (ui/docs/audio-settings.ui.json)
     *
     * Properties:
     *   - `musicLabel`: text, default "MUSIC: 60%"
     *   - `sfxLabel`: text, default "EFFECTS: 70%"
     * Events: `music-down`, `music-up`, `sfx-down`, `sfx-up`, `close-settings`
     * Code areas: none
     * Refs: `music-down`, `music-up`, `sfx-down`, `sfx-up`, `close-settings`
     */
    'audio-settings': {
      props: { musicLabel: string | { loc: string } | LocText; sfxLabel: string | { loc: string } | LocText };
      areas: never;
      refs: 'music-down' | 'music-up' | 'sfx-down' | 'sfx-up' | 'close-settings';
    };
    /**
     * Fight banner: a widget (ui/docs/fight-banner.ui.json)
     *
     * Properties:
     *   - `label`: text, default "ROUND 1"
     *   - `detail`: text, default "BEST OF THREE"
     * Events: none
     * Code areas: none
     * Refs: none
     */
    'fight-banner': {
      props: { label: string | { loc: string } | LocText; detail: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Fight button: a widget, button (ui/docs/fight-button.ui.json)
     *
     * Properties:
     *   - `label`: text, default "FIGHT"
     *   - `compact`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'fight-button': {
      props: { label: string | { loc: string } | LocText; compact: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Fight footer: a widget (ui/docs/fight-footer.ui.json)
     *
     * Properties:
     *   - `visible`: yesno, default true
     * Events: `<id>: pause`
     * Code areas: none
     * Refs: `pause`
     */
    'fight-footer': {
      props: { visible: boolean };
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
     *   - `soloLabel`: text, default "SOLO [SELECTED]"
     *   - `localLabel`: text, default "LOCAL VERSUS"
     *   - `trainingLabel`: text, default "TRAINING"
     *   - `difficultyLabel`: text, default "DIFFICULTY: NORMAL"
     *   - `settingsable`: yesno, default true
     *   - `canReturn`: yesno, default false
     * Events: `solo`, `local`, `training`, `difficulty`, `start`, `resume`, `restart`, `rematch`, `settings`, `title`
     * Code areas: none
     * Refs: `solo`, `local`, `training`, `difficulty`, `start`, `resume`, `restart`, `rematch`, `settings`, `title`
     * Samples (`view render doc:match-panel --sample …`): `ready`, `paused`, `ryuWins`, `kenWins`
     */
    'match-panel': {
      props: { title: string | { loc: string } | LocText; subtitle: string | { loc: string } | LocText; hint: string | { loc: string } | LocText; ready: boolean; paused: boolean; result: boolean; soloLabel: string | { loc: string } | LocText; localLabel: string | { loc: string } | LocText; trainingLabel: string | { loc: string } | LocText; difficultyLabel: string | { loc: string } | LocText; settingsable: boolean; canReturn: boolean };
      areas: never;
      refs: 'solo' | 'local' | 'training' | 'difficulty' | 'start' | 'resume' | 'restart' | 'rematch' | 'settings' | 'title';
    };
    /**
     * Training console: a widget (ui/docs/training-console.ui.json)
     *
     * Properties:
     *   - `stats`: text, default "DAMAGE 0  /  COMBO 0  /  BEST 0"
     *   - `inputs`: text, default "INPUT: NEUTRAL"
     *   - `dummyLabel`: text, default "DUMMY: STAND"
     *   - `boxesLabel`: text, default "HITBOXES: OFF"
     * Events: `<id>: dummy`, `<id>: reset-training`, `<id>: boxes`, `<id>: pause`
     * Code areas: none
     * Refs: `dummy`, `reset-training`, `boxes`, `pause`
     */
    'training-console': {
      props: { stats: string | { loc: string } | LocText; inputs: string | { loc: string } | LocText; dummyLabel: string | { loc: string } | LocText; boxesLabel: string | { loc: string } | LocText };
      areas: never;
      refs: 'dummy' | 'reset-training' | 'boxes' | 'pause';
    };
  }
}
