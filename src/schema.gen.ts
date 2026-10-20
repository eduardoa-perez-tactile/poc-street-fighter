// @generated — do not edit. Regenerate with `pnpm gen` (tools/bindgen).
import { typeToken, rowRead as $r, registerSchema, dataToken, type DataRecord, type EntityId } from '@gameengine/runtime';
import './content.gen.ts';

export type { EntityId };

/** Project schema IR, registered with the engine when the bundle boots. */
export const schemaIr = {
  "version": 1,
  "package": "StreetFighter",
  "enums": [],
  "types": [
    {
      "name": "AIState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "resetStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "think",
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
          "name": "previous",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "plan",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "planStep",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "aggression",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        }
      ],
      "package": "StreetFighter"
    },
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
          "name": "buffered",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "bufferAge",
          "kind": "array",
          "scalar": "u32",
          "lanes": 2
        },
        {
          "name": "history",
          "kind": "array",
          "scalar": "u32",
          "lanes": 16
        },
        {
          "name": "historyStep",
          "kind": "array",
          "scalar": "u32",
          "lanes": 16
        },
        {
          "name": "historyCount",
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
          "name": "fighterId",
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
          "name": "comboHits",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "stun",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "invulnerable",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "airState",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "throwCooldown",
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
          "name": "stageId",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "p1Fighter",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "p2Fighter",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "settingsOpen",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "mode",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "difficulty",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "phaseTicks",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "resumePhase",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 1
        },
        {
          "name": "matchWinner",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1,
          "default": -1
        },
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
      "name": "MenuIntent",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "action",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "value",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "id",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "screen",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "MenuState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "selectionSeat",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "p1Ready",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "p2Ready",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "screen",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "cursor",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "returnScreen",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "returnCursor",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "lastIntent",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "lastPhase",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 99
        },
        {
          "name": "music",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 60
        },
        {
          "name": "sfx",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 70
        },
        {
          "name": "browserAvailable",
          "kind": "bool",
          "scalar": "u8",
          "lanes": 1
        },
        {
          "name": "browserRequest",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "browserAction",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "keyboard",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "pad",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "axis",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "previous",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "repeat",
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
      "name": "TrainingIntent",
      "kind": "event",
      "sim": true,
      "fields": [
        {
          "name": "action",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "value",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "TrainingState",
      "kind": "resource",
      "sim": true,
      "fields": [
        {
          "name": "dummyMode",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "damage",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "combo",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "maxCombo",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "lastDamage",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "inputBits",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "previousHealth",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1,
          "default": 144
        },
        {
          "name": "previousStun",
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
          "name": "showBoxes",
          "kind": "bool",
          "scalar": "u8",
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
      "name": "CameraImpact",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "lastStep",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        }
      ],
      "package": "StreetFighter"
    },
    {
      "name": "DebugBox",
      "kind": "component",
      "sim": false,
      "fields": [
        {
          "name": "player",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
        },
        {
          "name": "box",
          "kind": "u32",
          "scalar": "u32",
          "lanes": 1
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
          "name": "born",
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
        },
        {
          "name": "stageId",
          "kind": "i32",
          "scalar": "i32",
          "lanes": 1,
          "default": -1
        }
      ],
      "package": "StreetFighter"
    }
  ],
  "commands": [],
  "protocol": [],
  "services": [],
  "data": [
    {
      "name": "AITuningDef",
      "schema": {
        "type": "object",
        "properties": {
          "easyReaction": {
            "type": "integer",
            "description": "Fixed steps between easy CPU observations"
          },
          "normalReaction": {
            "type": "integer"
          },
          "hardReaction": {
            "type": "integer"
          },
          "easyMistake": {
            "type": "integer",
            "description": "Chance in percent to miss a defensive decision"
          },
          "normalMistake": {
            "type": "integer"
          },
          "hardMistake": {
            "type": "integer"
          }
        },
        "required": [
          "easyReaction",
          "normalReaction",
          "hardReaction",
          "easyMistake",
          "normalMistake",
          "hardMistake"
        ],
        "additionalProperties": false
      },
      "package": "StreetFighter"
    }
  ]
} as const;
registerSchema(schemaIr);

export interface AIStateViews {
  resetStep: Uint32Array;
  think: Uint32Array;
  held: Uint32Array;
  previous: Uint32Array;
  plan: Uint32Array;
  planStep: Uint32Array;
  aggression: Uint32Array;
}
export interface AIStateValue {
  resetStep: number;
  think: number[];
  held: number[];
  previous: number[];
  plan: number[];
  planStep: number[];
  aggression: number[];
}
/** AIState (resource, sim) */
export const AIState = typeToken<AIStateViews, AIStateValue>('AIState', 'resource', { sig: 'resetStep:u32:1,think:array:2,held:array:2,previous:array:2,plan:array:2,planStep:array:2,aggression:array:2', read: (v: AIStateViews, i: number, o: Record<string, unknown>) => { o.resetStep = v.resetStep[i]; o.think = $r.lanes(v.think, i, 2, o.think); o.held = $r.lanes(v.held, i, 2, o.held); o.previous = $r.lanes(v.previous, i, 2, o.previous); o.plan = $r.lanes(v.plan, i, 2, o.plan); o.planStep = $r.lanes(v.planStep, i, 2, o.planStep); o.aggression = $r.lanes(v.aggression, i, 2, o.aggression); return o; } });

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
  buffered: Uint32Array;
  bufferAge: Uint32Array;
  history: Uint32Array;
  historyStep: Uint32Array;
  historyCount: Uint32Array;
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
  buffered: number[];
  bufferAge: number[];
  history: number[];
  historyStep: number[];
  historyCount: number[];
  direction: number[];
  motion: number[];
  motionAge: number[];
}
/** CombatInput (resource, sim) */
export const CombatInput = typeToken<CombatInputViews, CombatInputValue>('CombatInput', 'resource', { sig: 'keyboard:array:2,pad:array:2,axis:array:2,actions:array:2,previous:array:2,held:array:2,pressed:array:2,buffered:array:2,bufferAge:array:2,history:array:16,historyStep:array:16,historyCount:array:2,direction:array:2,motion:array:2,motionAge:array:2', read: (v: CombatInputViews, i: number, o: Record<string, unknown>) => { o.keyboard = $r.lanes(v.keyboard, i, 2, o.keyboard); o.pad = $r.lanes(v.pad, i, 2, o.pad); o.axis = $r.lanes(v.axis, i, 2, o.axis); o.actions = $r.lanes(v.actions, i, 2, o.actions); o.previous = $r.lanes(v.previous, i, 2, o.previous); o.held = $r.lanes(v.held, i, 2, o.held); o.pressed = $r.lanes(v.pressed, i, 2, o.pressed); o.buffered = $r.lanes(v.buffered, i, 2, o.buffered); o.bufferAge = $r.lanes(v.bufferAge, i, 2, o.bufferAge); o.history = $r.lanes(v.history, i, 16, o.history); o.historyStep = $r.lanes(v.historyStep, i, 16, o.historyStep); o.historyCount = $r.lanes(v.historyCount, i, 2, o.historyCount); o.direction = $r.lanes(v.direction, i, 2, o.direction); o.motion = $r.lanes(v.motion, i, 2, o.motion); o.motionAge = $r.lanes(v.motionAge, i, 2, o.motionAge); return o; } });

export interface FighterViews {
  player: Uint32Array;
  fighterId: Uint32Array;
  x: Float32Array;
  y: Float32Array;
  vx: Float32Array;
  vy: Float32Array;
  facing: Int32Array;
  state: Uint32Array;
  frame: Uint32Array;
  age: Uint32Array;
  comboHits: Uint32Array;
  stun: Uint32Array;
  invulnerable: Uint32Array;
  airState: Uint32Array;
  throwCooldown: Uint32Array;
  attackHit: Uint8Array;
  strength: Uint32Array;
  projectileFired: Uint8Array;
  jumpDirection: Int32Array;
}
export interface FighterValue {
  player: number;
  fighterId: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  facing: number;
  state: number;
  frame: number;
  age: number;
  comboHits: number;
  stun: number;
  invulnerable: number;
  airState: number;
  throwCooldown: number;
  attackHit: boolean;
  strength: number;
  projectileFired: boolean;
  jumpDirection: number;
}
/** Fighter (component, sim) */
export const Fighter = typeToken<FighterViews, FighterValue>('Fighter', 'component', { sig: 'player:u32:1,fighterId:u32:1,x:f32:1,y:f32:1,vx:f32:1,vy:f32:1,facing:i32:1,state:u32:1,frame:u32:1,age:u32:1,comboHits:u32:1,stun:u32:1,invulnerable:u32:1,airState:u32:1,throwCooldown:u32:1,attackHit:bool:1,strength:u32:1,projectileFired:bool:1,jumpDirection:i32:1', read: (v: FighterViews, i: number, o: Record<string, unknown>) => { o.player = v.player[i]; o.fighterId = v.fighterId[i]; o.x = v.x[i]; o.y = v.y[i]; o.vx = v.vx[i]; o.vy = v.vy[i]; o.facing = v.facing[i]; o.state = v.state[i]; o.frame = v.frame[i]; o.age = v.age[i]; o.comboHits = v.comboHits[i]; o.stun = v.stun[i]; o.invulnerable = v.invulnerable[i]; o.airState = v.airState[i]; o.throwCooldown = v.throwCooldown[i]; o.attackHit = v.attackHit[i] !== 0; o.strength = v.strength[i]; o.projectileFired = v.projectileFired[i] !== 0; o.jumpDirection = v.jumpDirection[i]; return o; } });

export interface MatchIntentViews {
  action: Uint32Array;
}
export interface MatchIntentValue {
  action: number;
}
/** MatchIntent (event, sim) */
export const MatchIntent = typeToken<MatchIntentViews, MatchIntentValue>('MatchIntent', 'event', { sig: 'action:u32:1', read: (v: MatchIntentViews, i: number, o: Record<string, unknown>) => { o.action = v.action[i]; return o; } });

export interface MatchStateViews {
  stageId: Uint32Array;
  p1Fighter: Uint32Array;
  p2Fighter: Uint32Array;
  settingsOpen: Uint8Array;
  mode: Uint32Array;
  difficulty: Uint32Array;
  phaseTicks: Uint32Array;
  resumePhase: Uint32Array;
  matchWinner: Int32Array;
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
  stageId: number;
  p1Fighter: number;
  p2Fighter: number;
  settingsOpen: boolean;
  mode: number;
  difficulty: number;
  phaseTicks: number;
  resumePhase: number;
  matchWinner: number;
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
export const MatchState = typeToken<MatchStateViews, MatchStateValue>('MatchState', 'resource', { sig: 'stageId:u32:1,p1Fighter:u32:1,p2Fighter:u32:1,settingsOpen:bool:1,mode:u32:1,difficulty:u32:1,phaseTicks:u32:1,resumePhase:u32:1,matchWinner:i32:1,phase:u32:1,remaining:u32:1,winner:i32:1,round:u32:1,p1Health:u32:1,p2Health:u32:1,p1Score:u32:1,p2Score:u32:1,p1Wins:u32:1,p2Wins:u32:1,hitStop:u32:1,initialized:bool:1,intentKeys:u32:1,resetStep:u32:1,freezeStep:u32:1', read: (v: MatchStateViews, i: number, o: Record<string, unknown>) => { o.stageId = v.stageId[i]; o.p1Fighter = v.p1Fighter[i]; o.p2Fighter = v.p2Fighter[i]; o.settingsOpen = v.settingsOpen[i] !== 0; o.mode = v.mode[i]; o.difficulty = v.difficulty[i]; o.phaseTicks = v.phaseTicks[i]; o.resumePhase = v.resumePhase[i]; o.matchWinner = v.matchWinner[i]; o.phase = v.phase[i]; o.remaining = v.remaining[i]; o.winner = v.winner[i]; o.round = v.round[i]; o.p1Health = v.p1Health[i]; o.p2Health = v.p2Health[i]; o.p1Score = v.p1Score[i]; o.p2Score = v.p2Score[i]; o.p1Wins = v.p1Wins[i]; o.p2Wins = v.p2Wins[i]; o.hitStop = v.hitStop[i]; o.initialized = v.initialized[i] !== 0; o.intentKeys = v.intentKeys[i]; o.resetStep = v.resetStep[i]; o.freezeStep = v.freezeStep[i]; return o; } });

export interface MenuIntentViews {
  action: Uint32Array;
  value: Uint32Array;
  id: Uint32Array;
  screen: Uint32Array;
}
export interface MenuIntentValue {
  action: number;
  value: number;
  id: number;
  screen: number;
}
/** MenuIntent (event, sim) */
export const MenuIntent = typeToken<MenuIntentViews, MenuIntentValue>('MenuIntent', 'event', { sig: 'action:u32:1,value:u32:1,id:u32:1,screen:u32:1', read: (v: MenuIntentViews, i: number, o: Record<string, unknown>) => { o.action = v.action[i]; o.value = v.value[i]; o.id = v.id[i]; o.screen = v.screen[i]; return o; } });

export interface MenuStateViews {
  selectionSeat: Uint32Array;
  p1Ready: Uint8Array;
  p2Ready: Uint8Array;
  screen: Uint32Array;
  cursor: Uint32Array;
  returnScreen: Uint32Array;
  returnCursor: Uint32Array;
  lastIntent: Uint32Array;
  lastPhase: Uint32Array;
  music: Uint32Array;
  sfx: Uint32Array;
  browserAvailable: Uint8Array;
  browserRequest: Uint32Array;
  browserAction: Uint32Array;
  keyboard: Uint32Array;
  pad: Uint32Array;
  axis: Uint32Array;
  previous: Uint32Array;
  repeat: Uint32Array;
}
export interface MenuStateValue {
  selectionSeat: number;
  p1Ready: boolean;
  p2Ready: boolean;
  screen: number;
  cursor: number;
  returnScreen: number;
  returnCursor: number;
  lastIntent: number;
  lastPhase: number;
  music: number;
  sfx: number;
  browserAvailable: boolean;
  browserRequest: number;
  browserAction: number;
  keyboard: number;
  pad: number;
  axis: number;
  previous: number;
  repeat: number;
}
/** MenuState (resource, sim) */
export const MenuState = typeToken<MenuStateViews, MenuStateValue>('MenuState', 'resource', { sig: 'selectionSeat:u32:1,p1Ready:bool:1,p2Ready:bool:1,screen:u32:1,cursor:u32:1,returnScreen:u32:1,returnCursor:u32:1,lastIntent:u32:1,lastPhase:u32:1,music:u32:1,sfx:u32:1,browserAvailable:bool:1,browserRequest:u32:1,browserAction:u32:1,keyboard:u32:1,pad:u32:1,axis:u32:1,previous:u32:1,repeat:u32:1', read: (v: MenuStateViews, i: number, o: Record<string, unknown>) => { o.selectionSeat = v.selectionSeat[i]; o.p1Ready = v.p1Ready[i] !== 0; o.p2Ready = v.p2Ready[i] !== 0; o.screen = v.screen[i]; o.cursor = v.cursor[i]; o.returnScreen = v.returnScreen[i]; o.returnCursor = v.returnCursor[i]; o.lastIntent = v.lastIntent[i]; o.lastPhase = v.lastPhase[i]; o.music = v.music[i]; o.sfx = v.sfx[i]; o.browserAvailable = v.browserAvailable[i] !== 0; o.browserRequest = v.browserRequest[i]; o.browserAction = v.browserAction[i]; o.keyboard = v.keyboard[i]; o.pad = v.pad[i]; o.axis = v.axis[i]; o.previous = v.previous[i]; o.repeat = v.repeat[i]; return o; } });

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

export interface TrainingIntentViews {
  action: Uint32Array;
  value: Uint32Array;
}
export interface TrainingIntentValue {
  action: number;
  value: number;
}
/** TrainingIntent (event, sim) */
export const TrainingIntent = typeToken<TrainingIntentViews, TrainingIntentValue>('TrainingIntent', 'event', { sig: 'action:u32:1,value:u32:1', read: (v: TrainingIntentViews, i: number, o: Record<string, unknown>) => { o.action = v.action[i]; o.value = v.value[i]; return o; } });

export interface TrainingStateViews {
  dummyMode: Uint32Array;
  damage: Uint32Array;
  combo: Uint32Array;
  maxCombo: Uint32Array;
  lastDamage: Uint32Array;
  inputBits: Uint32Array;
  previousHealth: Uint32Array;
  previousStun: Uint32Array;
  resetStep: Uint32Array;
  showBoxes: Uint8Array;
}
export interface TrainingStateValue {
  dummyMode: number;
  damage: number;
  combo: number;
  maxCombo: number;
  lastDamage: number;
  inputBits: number;
  previousHealth: number;
  previousStun: number;
  resetStep: number;
  showBoxes: boolean;
}
/** TrainingState (resource, sim) */
export const TrainingState = typeToken<TrainingStateViews, TrainingStateValue>('TrainingState', 'resource', { sig: 'dummyMode:u32:1,damage:u32:1,combo:u32:1,maxCombo:u32:1,lastDamage:u32:1,inputBits:u32:1,previousHealth:u32:1,previousStun:u32:1,resetStep:u32:1,showBoxes:bool:1', read: (v: TrainingStateViews, i: number, o: Record<string, unknown>) => { o.dummyMode = v.dummyMode[i]; o.damage = v.damage[i]; o.combo = v.combo[i]; o.maxCombo = v.maxCombo[i]; o.lastDamage = v.lastDamage[i]; o.inputBits = v.inputBits[i]; o.previousHealth = v.previousHealth[i]; o.previousStun = v.previousStun[i]; o.resetStep = v.resetStep[i]; o.showBoxes = v.showBoxes[i] !== 0; return o; } });

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

export interface CameraImpactViews {
  lastStep: Uint32Array;
}
export interface CameraImpactValue {
  lastStep: number;
}
/** CameraImpact (component, presentation-only) */
export const CameraImpact = typeToken<CameraImpactViews, CameraImpactValue>('CameraImpact', 'component', { sig: 'lastStep:u32:1', read: (v: CameraImpactViews, i: number, o: Record<string, unknown>) => { o.lastStep = v.lastStep[i]; return o; } });

export interface DebugBoxViews {
  player: Uint32Array;
  box: Uint32Array;
}
export interface DebugBoxValue {
  player: number;
  box: number;
}
/** DebugBox (component, presentation-only) */
export const DebugBox = typeToken<DebugBoxViews, DebugBoxValue>('DebugBox', 'component', { sig: 'player:u32:1,box:u32:1', read: (v: DebugBoxViews, i: number, o: Record<string, unknown>) => { o.player = v.player[i]; o.box = v.box[i]; return o; } });

export interface FighterShadowViews {
  player: Uint32Array;
}
export interface FighterShadowValue {
  player: number;
}
/** FighterShadow (component, sim) */
export const FighterShadow = typeToken<FighterShadowViews, FighterShadowValue>('FighterShadow', 'component', { sig: 'player:u32:1', read: (v: FighterShadowViews, i: number, o: Record<string, unknown>) => { o.player = v.player[i]; return o; } });

export interface HitSparkViews {
  born: Uint32Array;
  kind: Uint32Array;
  life: Uint32Array;
  player: Uint32Array;
  strength: Uint32Array;
  x: Float32Array;
  y: Float32Array;
}
export interface HitSparkValue {
  born: number;
  kind: number;
  life: number;
  player: number;
  strength: number;
  x: number;
  y: number;
}
/** HitSpark (component, sim) */
export const HitSpark = typeToken<HitSparkViews, HitSparkValue>('HitSpark', 'component', { sig: 'born:u32:1,kind:u32:1,life:u32:1,player:u32:1,strength:u32:1,x:f32:1,y:f32:1', read: (v: HitSparkViews, i: number, o: Record<string, unknown>) => { o.born = v.born[i]; o.kind = v.kind[i]; o.life = v.life[i]; o.player = v.player[i]; o.strength = v.strength[i]; o.x = v.x[i]; o.y = v.y[i]; return o; } });

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
  stageId: Int32Array;
}
export interface StagePartValue {
  index: number;
  stageId: number;
}
/** StagePart (component, presentation-only) */
export const StagePart = typeToken<StagePartViews, StagePartValue>('StagePart', 'component', { sig: 'index:u32:1,stageId:i32:1', read: (v: StagePartViews, i: number, o: Record<string, unknown>) => { o.index = v.index[i]; o.stageId = v.stageId[i]; return o; } });

export type AITuningDefData = {
  /** Fixed steps between easy CPU observations */
  easyReaction: number;
  normalReaction: number;
  hardReaction: number;
  /** Chance in percent to miss a defensive decision */
  easyMistake: number;
  normalMistake: number;
  hardMistake: number;
};
/** A loaded AITuningDef as `loadData` returns it (frozen). */
export type ReadonlyAITuningDefData = DataRecord<AITuningDefData>;
export const AITuningDef = dataToken<AITuningDefData>('AITuningDef');
