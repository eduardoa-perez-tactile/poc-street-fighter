import { bool, component, entity, f32, resource, u32 } from '@gameengine/schema';

export const ArenaVisualState = resource('ArenaVisualState', {
  initialized: bool(), focus: entity(), tick: u32(), lastSparkStep: u32(), lastAudioStep: u32(), musicPhase: u32({ default: 99 }),
}, { sim: true });
export const RenderBound = component('RenderBound', { kind: u32() }, { sim: true });
export const ArenaFocus = component('ArenaFocus', {}, { sim: true });
export const StagePart = component('StagePart', { index: u32() }, { sim: false });
export const FighterShadow = component('FighterShadow', { player: u32() }, { sim: true });
export const HitSpark = component('HitSpark', {
  life: u32(), player: u32(), strength: u32(), x: f32(), y: f32(),
}, { sim: true });
