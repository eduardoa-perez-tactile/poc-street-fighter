import { defineSystem, LocalTransform, PlayMusic, PlaySound, query, read, SetBusVolume, Sprite, VisualOffset, without, WorldViewFollow, write } from '@gameengine/runtime';
import { ArenaFocus, ArenaVisualState, CombatEffect, Fighter, FighterShadow, HitSpark, MatchState, Projectile, RenderBound } from '../schema.gen.ts';
import { FIGHTERS } from '../data/fighters.ts';
import { frameForFighter } from '../combat/index.ts';
import { STAGE_PIECES, piecePosition } from './stage-parts.ts';

export const SetupArena = defineSystem({
  name: 'SetupArena', resources: [write(ArenaVisualState)],
  runIf: { resource: ArenaVisualState, field: 'initialized', value: false },
  run(ctx) {
    ctx.commands.spawn({ ArenaFocus: {}, LocalTransform: { position: [3.84, 0.88, 0] } });
    for (let index = 0; index < STAGE_PIECES.length; index++) {
      const p = STAGE_PIECES[index]!, [x, y] = piecePosition(p, 448, 0);
      ctx.commands.spawn({ StagePart: { index }, LocalTransform: { position: [x / 100, (216 - y) / 100, 0] }, VisualOffset: {},
        Sprite: { image: p.image, size: [p.width / 100, p.height / 100], anchor: [0, 1], sortingLayer: p.layer, order: p.order } });
    }
    // Bleed below the source floor on unusually tall windows; the authored stage covers it normally.
    ctx.commands.spawn({ LocalTransform: { position: [3.84, -10.16, 0] }, Shape: { kind: 'Rect', size: [40, 20], color: '#655449', sortingLayer: 'Background', order: -10 } });
    for (let player = 0; player < 2; player++) ctx.commands.spawn({ FighterShadow: { player }, LocalTransform: {}, VisualOffset: {},
      Sprite: { image: 'effects/shadow', size: [0.68, 0.11], anchor: [0.5, 0.5], sortingLayer: 'Shadows', color: '#ffffffb0' } });
    for (let i = 0; i < 8; i++) ctx.commands.spawn({ HitSpark: {}, LocalTransform: {},
      Sprite: { image: 'effects/hit-light-0', size: [1.28, 1.28], visible: false, sortingLayer: 'Effects' } });
    ctx.setField(ArenaVisualState, 'initialized', true);
  },
});

export const BindCombatSprites = defineSystem({
  name: 'BindCombatSprites', after: ['CombatProjectiles', 'SetupArena'],
  queries: { fighters: query(read(Fighter), without(RenderBound)), shots: query(read(Projectile), without(RenderBound)) },
  runIf: { any: [{ query: query(read(Fighter), without(RenderBound)) }, { query: query(read(Projectile), without(RenderBound)) }] },
  run(ctx, q) {
    for (const c of q.fighters.chunks()) for (let i = 0; i < c.length; i++) {
      const f = c.get(Fighter, i), frame = frameForFighter(FIGHTERS[f.player]!, f.state, f.frame), entity = c.entity(i);
      ctx.commands.insert(entity, RenderBound, { kind: 0 });
      ctx.commands.insert(entity, LocalTransform, { position: [f.x / 100, (216 - f.y) / 100, 0] });
      ctx.commands.insert(entity, VisualOffset, {});
      ctx.commands.insert(entity, Sprite, { image: frame.sprite, size: [2.56, 2.56], anchor: [0.5, 0.125], sortingLayer: 'Fighters', order: f.player });
    }
    for (const c of q.shots.chunks()) for (let i = 0; i < c.length; i++) {
      const f = c.get(Projectile, i), entity = c.entity(i);
      ctx.commands.insert(entity, RenderBound, { kind: 1 });
      ctx.commands.insert(entity, LocalTransform, { position: [f.x / 100, (216 - f.y) / 100, 0] });
      ctx.commands.insert(entity, Sprite, { image: 'effects/hadouken-fireball-1', size: [1.28, 1.28], sortingLayer: 'Effects' });
    }
  },
});

export const TrackArena = defineSystem({
  name: 'TrackArena', after: ['CombatProjectiles'],
  queries: { fighters: query(read(Fighter), write(LocalTransform)), shots: query(read(Projectile), write(LocalTransform)), focus: query(read(ArenaFocus), write(LocalTransform)) },
  resources: [write(WorldViewFollow)], skipUnchanged: true,
  run(ctx, q) {
    let low = 768, high = 0, height = 216;
    for (const c of q.fighters.chunks()) {
      const f = c.col(Fighter), p = c.col(LocalTransform).position;
      for (let i = 0; i < c.length; i++) {
        p[i * 3] = f.x[i]! / 100; p[i * 3 + 1] = (216 - f.y[i]!) / 100;
        low = Math.min(low, f.x[i]!); high = Math.max(high, f.x[i]!); height = Math.min(height, f.y[i]!);
      }
    }
    for (const c of q.shots.chunks()) {
      const f = c.col(Projectile), p = c.col(LocalTransform).position;
      for (let i = 0; i < c.length; i++) { p[i * 3] = f.x[i]! / 100; p[i * 3 + 1] = (216 - f.y[i]!) / 100; }
    }
    if (low <= high) for (const c of q.focus.chunks()) for (let i = 0; i < c.length; i++) {
      c.set(LocalTransform, i, { position: [(low + high) / 200, (104 - Math.max(0, Math.min(32, -6 + Math.floor(height / 10)))) / 100, 0] });
      if (ctx.get(WorldViewFollow).target !== c.entity(i)) ctx.set(WorldViewFollow, { target: c.entity(i), damping: 0, deadZone: [0.15, 0.03], bounded: true, boundsMin: [0, -0.4], boundsMax: [7.68, 2.16] });
    }
  },
});

export const AdvanceArenaVisuals = defineSystem({
  name: 'AdvanceArenaVisuals', after: ['CombatProjectiles'],
  resources: [write(ArenaVisualState)], runIf: { resource: MatchState, field: 'phase', value: 1 },
  run(ctx) { const state = ctx.resource(ArenaVisualState); state.tick[0] = state.tick[0]! + 1; },
});

export const UpdateHitSparks = defineSystem({
  name: 'UpdateHitSparks', after: ['CombatProjectiles'], query: query(write(HitSpark), write(LocalTransform)),
  resources: [read(MatchState), write(ArenaVisualState)], events: [CombatEffect],
  run(ctx, q) {
    const match = ctx.resource(MatchState), phase = match.phase[0], visuals = ctx.resource(ArenaVisualState);
    const cursor = visuals.lastSparkStep[0]!;
    let latest = cursor;
    if (phase !== 3) for (const c of q.chunks()) for (let i = 0; i < c.length; i++) {
      const life = c.col(HitSpark).life;
      if (life[i]! > 0) life[i] = life[i]! - 1;
      if (phase === 0 || match.resetStep[0] === ctx.step) life[i] = 0;
    }
    for (const event of ctx.events.read(CombatEffect)) {
      if (event.step + 1 <= cursor) continue;
      latest = Math.max(latest, event.step + 1);
      if (event.kind !== 1 && event.kind !== 3) continue;
      let placed = false;
      for (const c of q.chunks()) for (let i = 0; i < c.length && !placed; i++) if (c.col(HitSpark).life[i] === 0) {
        c.set(HitSpark, i, { life: 16, player: event.player, strength: event.strength, x: event.x, y: event.y });
        c.set(LocalTransform, i, { position: [event.x / 100, (216 - event.y) / 100, 0] });
        placed = true;
      }
    }
    visuals.lastSparkStep[0] = latest;
  },
});

export const CombatAudio = defineSystem({
  name: 'CombatAudio', after: ['CombatProjectiles'], runOn: [CombatEffect], resources: [write(ArenaVisualState)],
  run(ctx) {
    const state = ctx.resource(ArenaVisualState), cursor = state.lastAudioStep[0]!;
    let latest = cursor;
    for (const event of ctx.events.read(CombatEffect)) {
      if (event.step + 1 <= cursor) continue;
      latest = Math.max(latest, event.step + 1);
      const strength = ['light', 'medium', 'heavy'][event.strength] ?? 'heavy';
      const sound = event.kind === 0 ? `audio/${strength}-attack` : event.kind === 1 || event.kind === 3 ? `audio/${strength}-${event.attack === 1 ? 'kick' : 'punch'}-hit` : event.kind === 2 ? 'audio/voice-hadouken' : event.kind === 5 ? 'audio/land' : '';
      if (sound) ctx.events.emit(PlaySound, { sound, volume: event.kind === 2 ? 0.65 : 0.45, maxVoices: 3 });
    }
    state.lastAudioStep[0] = latest;
  },
});
export const MatchMusic = defineSystem({
  name: 'MatchMusic', after: ['CombatControls'], resources: [read(MatchState), write(ArenaVisualState)],
  runIf: { changed: MatchState },
  run(ctx) {
    const phase = ctx.resource(MatchState).phase[0]!, state = ctx.resource(ArenaVisualState);
    if (state.musicPhase[0] === phase) return;
    if (phase === 1 && (state.musicPhase[0] === 0 || state.musicPhase[0] === 99)) ctx.events.emit(PlayMusic, { track: 'audio/theme-ken-main-cps1', volume: 0.38, crossfade: 0.2 });
    ctx.events.emit(SetBusVolume, { bus: 'Music', volume: phase === 3 ? 0.2 : 0.65 });
    state.musicPhase[0] = phase;
  },
});
