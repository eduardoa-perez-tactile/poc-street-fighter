import { array, bool, component, event, f32, i32, resource, u32 } from '@gameengine/schema';

export const Fighter = component('Fighter', {
  player: u32(), x: f32(), y: f32({ default: 216 }), vx: f32(), vy: f32(),
  facing: i32({ default: 1 }), state: u32(), frame: u32(), age: u32(),
  attackHit: bool(), strength: u32(), projectileFired: bool(), jumpDirection: i32(),
}, { sim: true });
export const Projectile = component('Projectile', {
  player: u32(), x: f32(), y: f32(), facing: i32(), strength: u32(), state: u32(), frame: u32(),
}, { sim: true });
export const MatchState = resource('MatchState', {
  phase: u32(), remaining: u32({ default: 5940 }), winner: i32({ default: -1 }),
  round: u32({ default: 1 }), p1Health: u32({ default: 144 }), p2Health: u32({ default: 144 }),
  p1Score: u32(), p2Score: u32(), p1Wins: u32(), p2Wins: u32(), hitStop: u32(),
  initialized: bool(), intentKeys: u32(), resetStep: u32(), freezeStep: u32(),
}, { sim: true });
export const CombatInput = resource('CombatInput', {
  keyboard: array(u32(), 2), pad: array(u32(), 2), axis: array(u32(), 2), actions: array(u32(), 2),
  previous: array(u32(), 2), held: array(u32(), 2), pressed: array(u32(), 2),
  direction: array(u32(), 2), motion: array(u32(), 2), motionAge: array(u32(), 2),
}, { sim: true });
export const MatchIntent = event('MatchIntent', { action: u32() }, { sim: true });
export const CombatEffect = event('CombatEffect', {
  step: u32(), attack: u32(), kind: u32(), player: u32(), strength: u32(), x: f32(), y: f32(),
}, { sim: true });
