// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
import { typeToken, rowRead as $r, registerSchema, type EntityId } from '@gameengine/runtime';

export type { EntityId };

/** Project schema IR, registered with the engine when the bundle boots. */
export const schemaIr = {
  "version": 1,
  "package": "StreetFighter",
  "enums": [],
  "types": [
    {
      "name": "CombatEffect",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "step",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "attack",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "kind",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "player",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "strength",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "x",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "y",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "CombatInput",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "keyboard",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "pad",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "axis",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "actions",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "previous",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "held",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "pressed",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "direction",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "motion",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "motionAge",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "Fighter",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "player",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "x",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "y",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1,
          "default": 216
        },
        {
          "name": "vx",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "vy",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "facing",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "state",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "frame",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "age",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "attackHit",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "strength",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "projectileFired",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "jumpDirection",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "MatchIntent",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "action",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "MatchState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "phase",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "remaining",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 5940
        },
        {
          "name": "winner",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1,
          "default": -1
        },
        {
          "name": "round",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "p1Health",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 144
        },
        {
          "name": "p2Health",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 144
        },
        {
          "name": "p1Score",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "p2Score",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "p1Wins",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "p2Wins",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "hitStop",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "initialized",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "intentKeys",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "resetStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "freezeStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "Projectile",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "player",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "x",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "y",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "facing",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1
        },
        {
          "name": "strength",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "state",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "frame",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "ArenaFocus",
      "kind": "component",
      "sim": true,
      "fields": [],
      "package": "StreetFighter"
    },
    {
      "name": "ArenaVisualState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "initialized",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "focus",
          "kind": "entity",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "tick",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "lastSparkStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "lastAudioStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "musicPhase",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 99
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "FighterShadow",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "player",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "HitSpark",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "life",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "player",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "strength",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "x",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        },
        {
          "name": "y",
          "kind": "f32",
          "scalar": "f32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "RenderBound",
      "kind": "component",
      "sim": true,
      "fields": [
        {
          "name": "kind",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "StagePart",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "index",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    }
  ],
  "commands": [],
  "protocol": [],
  "services": []
} as const;
registerSchema(schemaIr);

export interface CombatEffectViews {
  step: Uint32Array;
  attack: Uint32Array;
  kind: Uint32Array;
  player: Uint32Array;
  strength: Uint32Array;
  x: Float32Array;
  y: Float32Array;
}
export interface CombatEffectValue {
  step: number;
  attack: number;
  kind: number;
  player: number;
  strength: number;
  x: number;
  y: number;
}
/** CombatEffect (event, sim) */
export const CombatEffect = typeToken<CombatEffectViews, CombatEffectValue>('CombatEffect', 'event', { sig: 'step:u32:1,attack:u32:1,kind:u32:1,player:u32:1,strength:u32:1,x:f32:1,y:f32:1', read: (v: CombatEffectViews, i: number, o: Record<string, unknown>) => { o.step = v.step[i]; o.attack = v.attack[i]; o.kind = v.kind[i]; o.player = v.player[i]; o.strength = v.strength[i]; o.x = v.x[i]; o.y = v.y[i]; return o; } });

export interface CombatInputViews {
  keyboard: Uint32Array;
  pad: Uint32Array;
  axis: Uint32Array;
  actions: Uint32Array;
  previous: Uint32Array;
  held: Uint32Array;
  pressed: Uint32Array;
  direction: Uint32Array;
  motion: Uint32Array;
  motionAge: Uint32Array;
}
export interface CombatInputValue {
  keyboard: number[];
  pad: number[];
  axis: number[];
  actions: number[];
  previous: number[];
  held: number[];
  pressed: number[];
  direction: number[];
  motion: number[];
  motionAge: number[];
}
/** CombatInput (resource, sim) */
export const CombatInput = typeToken<CombatInputViews, CombatInputValue>('CombatInput', 'resource', { sig: 'keyboard:array:2,pad:array:2,axis:array:2,actions:array:2,previous:array:2,held:array:2,pressed:array:2,direction:array:2,motion:array:2,motionAge:array:2', read: (v: CombatInputViews, i: number, o: Record<string, unknown>) => { o.keyboard = $r.lanes(v.keyboard, i, 2, o.keyboard); o.pad = $r.lanes(v.pad, i, 2, o.pad); o.axis = $r.lanes(v.axis, i, 2, o.axis); o.actions = $r.lanes(v.actions, i, 2, o.actions); o.previous = $r.lanes(v.previous, i, 2, o.previous); o.held = $r.lanes(v.held, i, 2, o.held); o.pressed = $r.lanes(v.pressed, i, 2, o.pressed); o.direction = $r.lanes(v.direction, i, 2, o.direction); o.motion = $r.lanes(v.motion, i, 2, o.motion); o.motionAge = $r.lanes(v.motionAge, i, 2, o.motionAge); return o; } });

export interface FighterViews {
  player: Uint32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  facing: Int32Array;
  state: Uint32Array;
  frame: Uint32Array;
  age: Uint32Array;
  attackHit: Uint8Array;
  strength: Uint32Array;
  projectileFired: Uint8Array;
  jumpDirection: Int32Array;
}
export interface FighterValue {
  player: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  state: number;
  frame: number;
  age: number;
  attackHit: boolean;
  strength: number;
  projectileFired: boolean;
  jumpDirection: number;
}
/** Fighter (component, sim) */
export const Fighter = typeToken<FighterViews, FighterValue>('Fighter', 'component', { sig: 'player:u32:1,x:f32:1,y:f32:1,vx:f32:1,vy:f32:1,facing:i32:1,state:u32:1,frame:u32:1,age:u32:1,attackHit:bool:1,strength:u32:1,projectileFired:bool:1,jumpDirection:i32:1', read: (v: FighterViews, i: number, o: Record<string, unknown>) => { o.player = v.player[i]; o.x = v.x[i]; o.y = v.y[i]; o.vx = v.vx[i]; o.vy = v.vy[i]; o.facing = v.facing[i]; o.state = v.state[i]; o.frame = v.frame[i]; o.age = v.age[i]; o.attackHit = v.attackHit[i] !== 0; o.strength = v.strength[i]; o.projectileFired = v.projectileFired[i] !== 0; o.jumpDirection = v.jumpDirection[i]; return o; } });

export interface MatchIntentViews {
  action: Uint32Array;
}
export interface MatchIntentValue {
  action: number;
}
/** MatchIntent (event, sim) */
export const MatchIntent = typeToken<MatchIntentViews, MatchIntentValue>('MatchIntent', 'event', { sig: 'action:u32:1', read: (v: MatchIntentViews, i: number, o: Record<string, unknown>) => { o.action = v.action[i]; return o; } });

export interface MatchStateViews {
  phase: Uint32Array;
  remaining: Uint32Array;
  winner: Int32Array;
  round: Uint32Array;
  p1Health: Uint32Array;
  p2Health: Uint32Array;
  p1Score: Uint32Array;
  p2Score: Uint32Array;
  p1Wins: Uint32Array;
  p2Wins: Uint32Array;
  hitStop: Uint32Array;
  initialized: Uint8Array;
  intentKeys: Uint32Array;
  resetStep: Uint32Array;
  freezeStep: Uint32Array;
}
export interface MatchStateValue {
  phase: number;
  remaining: number;
  winner: number;
  round: number;
  p1Health: number;
  p2Health: number;
  p1Score: number;
  p2Score: number;
  p1Wins: number;
  p2Wins: number;
  hitStop: number;
  initialized: boolean;
  intentKeys: number;
  resetStep: number;
  freezeStep: number;
}
/** MatchState (resource, sim) */
export const MatchState = typeToken<MatchStateViews, MatchStateValue>('MatchState', 'resource', { sig: 'phase:u32:1,remaining:u32:1,winner:i32:1,round:u32:1,p1Health:u32:1,p2Health:u32:1,p1Score:u32:1,p2Score:u32:1,p1Wins:u32:1,p2Wins:u32:1,hitStop:u32:1,initialized:bool:1,intentKeys:u32:1,resetStep:u32:1,freezeStep:u32:1', read: (v: MatchStateViews, i: number, o: Record<string, unknown>) => { o.phase = v.phase[i]; o.remaining = v.remaining[i]; o.winner = v.winner[i]; o.round = v.round[i]; o.p1Health = v.p1Health[i]; o.p2Health = v.p2Health[i]; o.p1Score = v.p1Score[i]; o.p2Score = v.p2Score[i]; o.p1Wins = v.p1Wins[i]; o.p2Wins = v.p2Wins[i]; o.hitStop = v.hitStop[i]; o.initialized = v.initialized[i] !== 0; o.intentKeys = v.intentKeys[i]; o.resetStep = v.resetStep[i]; o.freezeStep = v.freezeStep[i]; return o; } });

export interface ProjectileViews {
  player: Uint32Array;
  x: Float32Array;
  y: Float32Array;
  facing: Int32Array;
  strength: Uint32Array;
  state: Uint32Array;
  frame: Uint32Array;
}
export interface ProjectileValue {
  player: number;
  x: number;
  y: number;
  facing: number;
  strength: number;
  state: number;
  frame: number;
}
/** Projectile (component, sim) */
export const Projectile = typeToken<ProjectileViews, ProjectileValue>('Projectile', 'component', { sig: 'player:u32:1,x:f32:1,y:f32:1,facing:i32:1,strength:u32:1,state:u32:1,frame:u32:1', read: (v: ProjectileViews, i: number, o: Record<string, unknown>) => { o.player = v.player[i]; o.x = v.x[i]; o.y = v.y[i]; o.facing = v.facing[i]; o.strength = v.strength[i]; o.state = v.state[i]; o.frame = v.frame[i]; return o; } });

export type ArenaFocusViews = Record<string, never>;
export type ArenaFocusValue = Record<string, never>;
/** ArenaFocus (component, sim) */
export const ArenaFocus = typeToken<ArenaFocusViews, ArenaFocusValue>('ArenaFocus', 'component');

export interface ArenaVisualStateViews {
  initialized: Uint8Array;
  focus: Uint32Array;
  tick: Uint32Array;
  lastSparkStep: Uint32Array;
  lastAudioStep: Uint32Array;
  musicPhase: Uint32Array;
}
export interface ArenaVisualStateValue {
  initialized: boolean;
  focus: EntityId;
  tick: number;
  lastSparkStep: number;
  lastAudioStep: number;
  musicPhase: number;
}
/** ArenaVisualState (resource, sim) */
export const ArenaVisualState = typeToken<ArenaVisualStateViews, ArenaVisualStateValue>('ArenaVisualState', 'resource', { sig: 'initialized:bool:1,focus:entity:2,tick:u32:1,lastSparkStep:u32:1,lastAudioStep:u32:1,musicPhase:u32:1', read: (v: ArenaVisualStateViews, i: number, o: Record<string, unknown>) => { o.initialized = v.initialized[i] !== 0; o.focus = $r.ent(v.focus, i); o.tick = v.tick[i]; o.lastSparkStep = v.lastSparkStep[i]; o.lastAudioStep = v.lastAudioStep[i]; o.musicPhase = v.musicPhase[i]; return o; } });

export interface FighterShadowViews {
  player: Uint32Array;
}
export interface FighterShadowValue {
  player: number;
}
/** FighterShadow (component, sim) */
export const FighterShadow = typeToken<FighterShadowViews, FighterShadowValue>('FighterShadow', 'component', { sig: 'player:u32:1', read: (v: FighterShadowViews, i: number, o: Record<string, unknown>) => { o.player = v.player[i]; return o; } });

export interface HitSparkViews {
  life: Uint32Array;
  player: Uint32Array;
  strength: Uint32Array;
  x: Float32Array;
  y: Float32Array;
}
export interface HitSparkValue {
  life: number;
  player: number;
  strength: number;
  x: number;
  y: number;
}
/** HitSpark (component, sim) */
export const HitSpark = typeToken<HitSparkViews, HitSparkValue>('HitSpark', 'component', { sig: 'life:u32:1,player:u32:1,strength:u32:1,x:f32:1,y:f32:1', read: (v: HitSparkViews, i: number, o: Record<string, unknown>) => { o.life = v.life[i]; o.player = v.player[i]; o.strength = v.strength[i]; o.x = v.x[i]; o.y = v.y[i]; return o; } });

export interface RenderBoundViews {
  kind: Uint32Array;
}
export interface RenderBoundValue {
  kind: number;
}
/** RenderBound (component, sim) */
export const RenderBound = typeToken<RenderBoundViews, RenderBoundValue>('RenderBound', 'component', { sig: 'kind:u32:1', read: (v: RenderBoundViews, i: number, o: Record<string, unknown>) => { o.kind = v.kind[i]; return o; } });

export interface StagePartViews {
  index: Uint32Array;
}
export interface StagePartValue {
  index: number;
}
/** StagePart (component, presentation-only) */
export const StagePart = typeToken<StagePartViews, StagePartValue>('StagePart', 'component', { sig: 'index:u32:1', read: (v: StagePartViews, i: number, o: Record<string, unknown>) => { o.index = v.index[i]; return o; } });
