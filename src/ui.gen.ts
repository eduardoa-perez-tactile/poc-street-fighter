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
     * Alpha arrow: a widget, button (ui/docs/alpha-arrow.ui.json)
     *
     * Properties:
     *   - `label`: text, default ">"
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'alpha-arrow': {
      props: { label: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Alpha main: a view, screen (ui/docs/alpha-main.ui.json)
     *
     * Properties:
     *   - `f0`: yesno, default true
     *   - `f1`: yesno, default false
     *   - `f2`: yesno, default false
     *   - `f3`: yesno, default false
     * Events: `solo`, `local`, `training`, `options`
     * Code areas: none
     * Refs: `solo`, `local`, `training`, `options`
     */
    'alpha-main': {
      props: { f0: boolean; f1: boolean; f2: boolean; f3: boolean };
      areas: never;
      refs: 'solo' | 'local' | 'training' | 'options';
    };
    /**
     * Alpha moves: a view, screen (ui/docs/alpha-moves.ui.json)
     *
     * Properties: none
     * Events: `back`
     * Code areas: none
     * Refs: `back`
     */
    'alpha-moves': {
      props: {};
      areas: never;
      refs: 'back';
    };
    /**
     * Alpha options: a view, screen (ui/docs/alpha-options.ui.json)
     *
     * Properties:
     *   - `f0`: yesno, default true
     *   - `f1`: yesno, default false
     *   - `f2`: yesno, default false
     *   - `music`: text, default "60%"
     *   - `effects`: text, default "70%"
     *   - `browser`: yesno, default false
     *   - `f3`: yesno, default false
     *   - `f4`: yesno, default false
     * Events: `music: down`, `music: up`, `effects: down`, `effects: up`, `browser-controls`, `fullscreen`, `back`
     * Code areas: none
     * Refs: `music`, `music.down`, `music.up`, `effects`, `effects.down`, `effects.up`, `browser-controls`, `fullscreen`, `back`
     */
    'alpha-options': {
      props: { f0: boolean; f1: boolean; f2: boolean; music: string | { loc: string } | LocText; effects: string | { loc: string } | LocText; browser: boolean; f3: boolean; f4: boolean };
      areas: never;
      refs: 'music' | 'music.down' | 'music.up' | 'effects' | 'effects.down' | 'effects.up' | 'browser-controls' | 'fullscreen' | 'back';
    };
    /**
     * Alpha pause: a view, dialog (ui/docs/alpha-pause.ui.json)
     *
     * Properties:
     *   - `f0`: yesno, default true
     *   - `f1`: yesno, default false
     *   - `f2`: yesno, default false
     *   - `f3`: yesno, default false
     *   - `f4`: yesno, default false
     * Events: `resume`, `moves`, `options`, `restart`, `main-menu`
     * Code areas: none
     * Refs: `resume`, `moves`, `options`, `restart`, `main-menu`
     */
    'alpha-pause': {
      props: { f0: boolean; f1: boolean; f2: boolean; f3: boolean; f4: boolean };
      areas: never;
      refs: 'resume' | 'moves' | 'options' | 'restart' | 'main-menu';
    };
    /**
     * Alpha results: a view, screen (ui/docs/alpha-results.ui.json)
     *
     * Properties:
     *   - `f0`: yesno, default true
     *   - `f1`: yesno, default false
     *   - `winner`: text, default "RYU WINS"
     *   - `score`: text, default "2 - 0"
     *   - `portrait`: image, default "ui/ryu-portrait"
     * Events: `rematch`, `main-menu`
     * Code areas: none
     * Refs: `rematch`, `main-menu`
     */
    'alpha-results': {
      props: { f0: boolean; f1: boolean; winner: string | { loc: string } | LocText; score: string | { loc: string } | LocText; portrait: string };
      areas: never;
      refs: 'rematch' | 'main-menu';
    };
    /**
     * Alpha row: a widget, button (ui/docs/alpha-row.ui.json)
     *
     * Properties:
     *   - `label`: text, default "SOLO BATTLE"
     *   - `value`: text, default ""
     *   - `active`: yesno, default false
     *   - `valued`: yesno, default false
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'alpha-row': {
      props: { label: string | { loc: string } | LocText; value: string | { loc: string } | LocText; active: boolean; valued: boolean };
      areas: never;
      refs: never;
    };
    /**
     * Alpha setup: a view, screen (ui/docs/alpha-setup.ui.json)
     *
     * Properties:
     *   - `f0`: yesno, default true
     *   - `f1`: yesno, default false
     *   - `f2`: yesno, default false
     *   - `heading`: text, default "SOLO BATTLE"
     *   - `difficulty`: text, default "NORMAL"
     *   - `solo`: yesno, default true
     *   - `opponent`: text, default "CPU"
     *   - `detail`: text, default "KEN'S STAGE / FIRST TO TWO WINS"
     *   - `hint`: text, default "LEFT / RIGHT: ADJUST    ENTER / A: CONFIRM    ESC / B: BACK"
     * Events: `difficulty`, `fight`, `back`
     * Code areas: none
     * Refs: `difficulty`, `fight`, `back`
     */
    'alpha-setup': {
      props: { f0: boolean; f1: boolean; f2: boolean; heading: string | { loc: string } | LocText; difficulty: string | { loc: string } | LocText; solo: boolean; opponent: string | { loc: string } | LocText; detail: string | { loc: string } | LocText; hint: string | { loc: string } | LocText };
      areas: never;
      refs: 'difficulty' | 'fight' | 'back';
    };
    /**
     * Alpha small: a widget, button (ui/docs/alpha-small.ui.json)
     *
     * Properties:
     *   - `label`: text, default "PAUSE"
     * Events: `<id>`
     * Code areas: none
     * Refs: none
     */
    'alpha-small': {
      props: { label: string | { loc: string } | LocText };
      areas: never;
      refs: never;
    };
    /**
     * Alpha title: a view, screen (ui/docs/alpha-title.ui.json)
     *
     * Properties: none
     * Events: `press-start`
     * Code areas: none
     * Refs: `press-start`
     */
    'alpha-title': {
      props: {};
      areas: never;
      refs: 'press-start';
    };
    /**
     * Alpha volume: a widget (ui/docs/alpha-volume.ui.json)
     *
     * Properties:
     *   - `label`: text, default "MUSIC VOLUME"
     *   - `value`: text, default "60%"
     *   - `active`: yesno, default false
     * Events: `<id>: down`, `<id>: up`
     * Code areas: none
     * Refs: `down`, `up`
     */
    'alpha-volume': {
      props: { label: string | { loc: string } | LocText; value: string | { loc: string } | LocText; active: boolean };
      areas: never;
      refs: 'down' | 'up';
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
     *   - `timertext`: text, default "99"
     *   - `centerlabel`: text, default "TIME"
     *   - `roundtext`: text, default "ROUND 1"
     * Events: `<id>: pause`
     * Code areas: none
     * Refs: `pause`
     * Samples (`view render doc:fight-hud --sample …`): `opening`, `closeFight`, `half`, `empty`, `training`
     */
    'fight-hud': {
      props: { healthone: number; healthtwo: number; timer: number; p1Score: number; p2Score: number; p1Wins: number; p2Wins: number; round: number; timertext: string | { loc: string } | LocText; centerlabel: string | { loc: string } | LocText; roundtext: string | { loc: string } | LocText };
      areas: never;
      refs: 'pause';
    };
    /**
     * Training console: a widget (ui/docs/training-console.ui.json)
     *
     * Properties:
     *   - `stats`: text, default "DAMAGE 0  /  COMBO 0  /  BEST 0"
     *   - `inputs`: text, default "INPUT: NEUTRAL"
     *   - `dummyLabel`: text, default "DUMMY: STAND"
     *   - `boxesLabel`: text, default "HITBOXES: OFF"
     * Events: `<id>: dummy`, `<id>: reset-training`, `<id>: boxes`
     * Code areas: none
     * Refs: `dummy`, `reset-training`, `boxes`
     */
    'training-console': {
      props: { stats: string | { loc: string } | LocText; inputs: string | { loc: string } | LocText; dummyLabel: string | { loc: string } | LocText; boxesLabel: string | { loc: string } | LocText };
      areas: never;
      refs: 'dummy' | 'reset-training' | 'boxes';
    };
  }
}
