import { bool, component, entity, f32, i32, resource, u32 } from '@gameengine/schema';

export const ArenaVisualState = resource('ArenaVisualState', {
  initialized: bool(), focus: entity(), tick: u32(), lastSparkStep: u32(), lastAudioStep: u32(), musicPhase: u32({ default: 99 }),
}, { sim: true });
export const RenderBound = component('RenderBound', { kind: u32() }, { sim: true });
export const ArenaFocus = component('ArenaFocus', {}, { sim: true });
export const StagePart = component('StagePart', { index: u32(), stageId: i32({ default: -1 }) }, { sim: false });
export const FighterShadow = component('FighterShadow', { player: u32() }, { sim: true });
export const HitSpark = component('HitSpark', {
  born: u32(), kind: u32(), life: u32(), player: u32(), strength: u32(), x: f32(), y: f32(),
}, { sim: true });

export const DebugBox = component('DebugBox', { player: u32(), box: u32() }, { sim: false });

export const CameraImpact = component('CameraImpact', { lastStep: u32() }, { sim: false });
