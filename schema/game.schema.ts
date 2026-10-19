import { array, bool, component, event, f32, i32, resource, u32 } from '@gameengine/schema';

export const Fighter = component('Fighter', {
  player: u32(), x: f32(), y: f32({ default: 216 }), vx: f32(), vy: f32(),
  facing: i32({ default: 1 }), state: u32(), frame: u32(), age: u32(),
  comboHits: u32(), stun: u32(), invulnerable: u32(), airState: u32(), throwCooldown: u32(),
  attackHit: bool(), strength: u32(), projectileFired: bool(), jumpDirection: i32(),
}, { sim: true });
export const Projectile = component('Projectile', {
  player: u32(), x: f32(), y: f32(), facing: i32(), strength: u32(), state: u32(), frame: u32(),
}, { sim: true });
export const MatchState = resource('MatchState', {
  settingsOpen: bool(), mode: u32(), difficulty: u32({ default: 1 }), phaseTicks: u32(), resumePhase: u32({ default: 1 }), matchWinner: i32({ default: -1 }),
  phase: u32(), remaining: u32({ default: 5940 }), winner: i32({ default: -1 }),
  round: u32({ default: 1 }), p1Health: u32({ default: 144 }), p2Health: u32({ default: 144 }),
  p1Score: u32(), p2Score: u32(), p1Wins: u32(), p2Wins: u32(), hitStop: u32(),
  initialized: bool(), intentKeys: u32(), resetStep: u32(), freezeStep: u32(),
}, { sim: true });
export const CombatInput = resource('CombatInput', {
  keyboard: array(u32(), 2), pad: array(u32(), 2), axis: array(u32(), 2), actions: array(u32(), 2),
  previous: array(u32(), 2), held: array(u32(), 2), pressed: array(u32(), 2),
  buffered: array(u32(), 2), bufferAge: array(u32(), 2),
  history: array(u32(), 16), historyStep: array(u32(), 16), historyCount: array(u32(), 2),
  direction: array(u32(), 2), motion: array(u32(), 2), motionAge: array(u32(), 2),
}, { sim: true });
export const MatchIntent = event('MatchIntent', { action: u32() }, { sim: true });
export const CombatEffect = event('CombatEffect', {
  step: u32(), attack: u32(), kind: u32(), player: u32(), strength: u32(), x: f32(), y: f32(),
}, { sim: true });

export const AIState = resource('AIState', {
  resetStep: u32(),
  think: array(u32(), 2), held: array(u32(), 2), previous: array(u32(), 2),
  plan: array(u32(), 2), planStep: array(u32(), 2), aggression: array(u32(), 2),
}, { sim: true });
export const TrainingState = resource('TrainingState', {
  dummyMode: u32(), damage: u32(), combo: u32(), maxCombo: u32(), lastDamage: u32(), inputBits: u32(),
  previousHealth: u32({ default: 144 }), previousStun: u32(), resetStep: u32(), showBoxes: bool(),
}, { sim: true });
export const TrainingIntent = event('TrainingIntent', { action: u32(), value: u32() }, { sim: true });

// Recorded frontend input keeps keyboard, controller and pointer navigation equivalent.
export const MenuState = resource('MenuState', {
  screen: u32(), cursor: u32(), returnScreen: u32(), returnCursor: u32(), lastIntent: u32(), lastPhase: u32({ default: 99 }),
  music: u32({ default: 60 }), sfx: u32({ default: 70 }),
  browserAvailable: bool(), browserRequest: u32(), browserAction: u32(),
  keyboard: u32(), pad: u32(), axis: u32(), previous: u32(), repeat: u32(),
}, { sim: true });
export const MenuIntent = event('MenuIntent', {
  action: u32(), value: u32(), id: u32(), screen: u32(),
}, { sim: true });
