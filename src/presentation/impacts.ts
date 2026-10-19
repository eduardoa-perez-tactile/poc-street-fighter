import { CameraShake, defineSystem, query, read, shakeCamera, write } from '@gameengine/runtime';
import { CameraImpact, HitSpark } from '../schema.gen.ts';

/** A presentation cursor makes each contact add trauma once, even across extra render frames. */
export const PresentHeavyImpacts = defineSystem({
  name: 'PresentHeavyImpacts', stage: 'LateUpdate',
  queries: { cameras: query(write(CameraImpact), write(CameraShake)), sparks: query(read(HitSpark)) },
  runIf: { changed: HitSpark },
  run(_ctx, q) {
    for (const cameras of q.cameras.chunks()) for (let i = 0; i < cameras.length; i++) {
      const last = cameras.col(CameraImpact).lastStep[i]!;
      let latest = last, trauma = 0;
      for (const sparks of q.sparks.chunks()) {
        const effect = sparks.col(HitSpark);
        for (let j = 0; j < sparks.length; j++) {
          if (!effect.life[j] || effect.born[j]! <= last) continue;
          latest = Math.max(latest, effect.born[j]!);
          if (effect.kind[j] === 7 || effect.kind[j] === 8) trauma = Math.max(trauma, 0.28);
          else if ((effect.kind[j] === 1 || effect.kind[j] === 3) && effect.strength[j] === 2) trauma = Math.max(trauma, 0.22);
        }
      }
      cameras.col(CameraImpact).lastStep[i] = latest;
      if (trauma > 0) shakeCamera(cameras.entity(i), trauma);
    }
  },
});
