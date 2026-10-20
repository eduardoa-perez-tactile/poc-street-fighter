import { defineSystem, query, read, Sprite, VisualOffset, WorldView, write } from '@gameengine/runtime';
import { ArenaVisualState, Fighter, FighterShadow, HitSpark, MatchState, Projectile, StagePart } from '../schema.gen.ts';
import { FIGHTERS } from '../data/fighters.ts';
import { HIT_FRAMES } from '../data/effects.ts';
import { frameForFighter } from '../combat/index.ts';
import { KNOCKDOWN, WAKEUP } from '../combat/moves.ts';
import { stagePieces, pieceImage, piecePosition } from './stage-parts.ts';

export const DrawStage = defineSystem({
  name: 'DrawStage', stage: 'LateUpdate', query: query(write(StagePart), write(Sprite), write(VisualOffset)),
  resources: [read(ArenaVisualState), read(WorldView), read(MatchState)], skipUnchanged: true,
  run(ctx, q) {
    const tick = ctx.resource(ArenaVisualState).tick[0]!, camera = ctx.get(WorldView).center[0]! * 100 + 64;
    const stageId = ctx.resource(MatchState).stageId[0]!, pieces = stagePieces(stageId);
    for (const c of q.chunks()) {
      const parts = c.col(StagePart), index = parts.index, offset = c.col(VisualOffset).position, sprites = c.col(Sprite);
      for (let i = 0; i < c.length; i++) {
        const piece = pieces[index[i]!];
        sprites.visible[i] = piece ? 1 : 0;
        if (!piece) continue;
        const now = piecePosition(piece, camera, tick), image = pieceImage(piece, tick);
        offset[i * 3] = now[0] / 100; offset[i * 3 + 1] = -now[1] / 100;
        if (parts.stageId[i] !== stageId) {
          c.setField(Sprite, i, 'image', image);
          c.setField(Sprite, i, 'size', [piece.width / 100, piece.height / 100]);
          c.setField(Sprite, i, 'sortingLayer', piece.layer);
          c.setField(Sprite, i, 'order', piece.order);
          parts.stageId[i] = stageId;
        } else if (piece.animation || piece.grey || piece.frames) c.setField(Sprite, i, 'image', image);
      }
    }
  },
});
export const DrawFighters = defineSystem({
  name: 'DrawFighters', stage: 'LateUpdate', query: query(read(Fighter), write(Sprite), write(VisualOffset)),
  resources: [read(MatchState), read(ArenaVisualState)], skipUnchanged: true,
  run(ctx, q) {
    const match = ctx.resource(MatchState), tick = ctx.resource(ArenaVisualState).tick[0]!;
    for (const c of q.chunks()) {
      const f = c.col(Fighter), s = c.col(Sprite), visual = c.col(VisualOffset), o = visual.position;
      for (let i = 0; i < c.length; i++) {
        const frame = frameForFighter(FIGHTERS[f.fighterId[i]!]!, f.state[i]!, f.frame[i]!);
        c.setField(Sprite, i, 'image', frame.sprite); s.flipX[i] = f.facing[i]! < 0 ? 1 : 0;
        o[i * 3] = match.hitStop[0]! > 0 && f.state[i]! >= 19 && f.state[i]! <= 24 ? (tick % 2 ? 0.02 : -0.02) : 0;
        // Reused hurt/crouch poses rotate about their authored feet pivot; only the
        // rendered body falls. Gameplay position, hit boxes and knockdown timing stay exact.
        const authenticFall = frame.sprite.includes('/extra-');
        const fall = authenticFall ? 0 : f.state[i] === KNOCKDOWN ? Math.min(1, f.frame[i]! / 10) : f.state[i] === WAKEUP ? Math.max(0, 1 - f.frame[i]! / 8) : 0;
        const angle = f.facing[i]! * Math.PI * 0.5 * fall;
        o[i * 3 + 1] = 0.3 * fall;
        visual.rotation[i * 4] = 0; visual.rotation[i * 4 + 1] = 0;
        visual.rotation[i * 4 + 2] = Math.sin(angle / 2); visual.rotation[i * 4 + 3] = Math.cos(angle / 2);

      }
    }
  },
});
export const DrawShadows = defineSystem({
  name: 'DrawShadows', stage: 'LateUpdate',
  queries: { shadows: query(read(FighterShadow), write(Sprite), write(VisualOffset)), fighters: query(read(Fighter)) },
  skipUnchanged: true,
  run(_ctx, q) {
    for (const c of q.shadows.chunks()) for (let i = 0; i < c.length; i++) {
      const player = c.col(FighterShadow).player[i]!;
      for (const f of q.fighters.chunks()) for (let j = 0; j < f.length; j++) if (f.col(Fighter).player[j] === player) {
        const fighter = f.col(Fighter), pos = c.col(VisualOffset).position, scale = c.col(VisualOffset).scale;
        pos[i * 3] = fighter.x[j]! / 100; pos[i * 3 + 1] = -0.015;
        scale[i * 3] = Math.max(0.35, 1 - (216 - fighter.y[j]!) / 250);
        scale[i * 3 + 1] = scale[i * 3]!;
      }
    }
  },
});
export const DrawProjectiles = defineSystem({
  name: 'DrawProjectiles', stage: 'LateUpdate', query: query(read(Projectile), write(Sprite)), skipUnchanged: true,
  run(_ctx, q) {
    for (const c of q.chunks()) {
      const p = c.col(Projectile), s = c.col(Sprite);
      for (let i = 0; i < c.length; i++) {
        const age = p.frame[i]!, active = p.state[i] === 0;
        const key = active ? `effects/hadouken-fireball-${[1, 3, 2, 3][Math.floor(age / 2) % 4]}` : `effects/hadouken-collide-${age < 9 ? 1 : age < 14 ? 2 : 3}`;
        c.setField(Sprite, i, 'image', key); s.flipX[i] = p.facing[i]! < 0 ? 1 : 0;
      }
    }
  },
});
export const DrawHitSparks = defineSystem({
  name: 'DrawHitSparks', stage: 'LateUpdate', query: query(read(HitSpark), write(Sprite)), skipUnchanged: true,
  run(_ctx, q) {
    for (const c of q.chunks()) {
      const f = c.col(HitSpark), s = c.col(Sprite);
      for (let i = 0; i < c.length; i++) {
        s.visible[i] = f.life[i]! > 0 ? 1 : 0;
        if (f.life[i]! > 0) {
          const frames = f.strength[i] === 0 ? HIT_FRAMES.light : f.strength[i] === 1 ? HIT_FRAMES.medium : HIT_FRAMES.heavy;
          c.setField(Sprite, i, 'image', frames[Math.min(3, Math.floor((16 - f.life[i]!) / 4)) + f.player[i]! * 4]!);
          c.setField(Sprite, i, 'color', f.kind[i] === 6 ? '#62cfffff' : f.kind[i] === 10 ? '#ffffffff' : f.kind[i] === 8 ? '#ffad62ff' : f.kind[i] === 9 ? '#e8b3ffff' : '#ffffffff');
          c.setField(Sprite, i, 'size', f.kind[i] === 7 || f.kind[i] === 8 ? [1.6, 1.6] : f.kind[i] === 6 ? [1.0, 1.0] : [1.28, 1.28]);
        }
      }
    }
  },
});
