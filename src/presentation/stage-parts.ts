import { STAGE_ANIMATIONS, STAGE_FLOOR_STRIPS, STAGE_FRAMES, STAGE_PLACEMENTS } from '../data/stage.ts';

type FrameKey = keyof typeof STAGE_FRAMES;
type AnimationKey = keyof typeof STAGE_ANIMATIONS;
type Placement = { frame?: FrameKey; animation?: AnimationKey; frames?: readonly FrameKey[]; x: number; y: number; cameraDivisor?: number; cameraMultiplier?: number; parent?: 'stage-background' | 'stage-boat'; layer: string };
export interface StagePiece { image: string; x: number; y: number; ratio: number; boat: boolean; width: number; height: number; animation?: AnimationKey; grey?: boolean; frames?: readonly string[]; frameTicks?: number; strip?: number; layer: string; order: number }
const placements: readonly Placement[] = STAGE_PLACEMENTS;
const KEN_PIECES: readonly StagePiece[] = Object.freeze([
  ...placements.filter((p) => p.frame !== 'stage-floor').map((p, index): StagePiece => {
    const parent = p.parent === 'stage-background' ? { x: 16, ratio: 1 / 2.157303 } : p.parent === 'stage-boat' ? { x: 150, ratio: 1 / 1.613445 } : undefined;
    const key = p.frame ?? p.frames?.[0] ?? STAGE_ANIMATIONS[p.animation!]![0]![0] as FrameKey;
    const rect = STAGE_FRAMES[key].rect;
    return { image: STAGE_FRAMES[key].sprite, x: p.x + (parent?.x ?? 0), y: p.y,
      ratio: parent?.ratio ?? p.cameraMultiplier ?? 1 / (p.cameraDivisor ?? 1),
      boat: p.parent === 'stage-boat' || p.frame === 'stage-boat',
      width: rect[2], height: rect[3], animation: p.animation, grey: !!p.frames,
      layer: p.layer === 'foreground' ? 'Foreground' : 'Background', order: p.layer === 'floor' ? 30 : p.layer === 'background-props' ? 40 : index };
  }),
  ...STAGE_FLOOR_STRIPS.map((image, strip): StagePiece => ({ image, x: 32, y: 176 + strip, ratio: 1 / 1.55,
    boat: false, width: 896, height: 1, strip, layer: 'Background', order: 25 })),
]);

export function piecePosition(piece: StagePiece, camera: number, tick: number): [number, number] {
  const shear = piece.strip === undefined ? 0 : (-5.15 - (camera - 1024) / 112) * piece.strip;
  const bob = piece.boat ? [0, -1, -2, -3, -4, -3, -2, -1][Math.floor(tick / 30) % 8]! : 0;
  return [piece.x + camera * (1 - piece.ratio) - 256 + shear, piece.y + bob];
}
export function pieceImage(piece: StagePiece, tick: number): string {
  if (piece.frames) return piece.frames[Math.floor(tick / (piece.frameTicks ?? 30)) % piece.frames.length]!;
  if (piece.grey) return `stage/grey-suit-${Math.floor(tick / 40) % 2 + 1}`;
  if (!piece.animation) return piece.image;
  const frames = STAGE_ANIMATIONS[piece.animation];
  const cycle = frames.reduce((total, f) => total + f[1], 0);
  let time = (tick * 1000 / 60) % cycle;
  for (const [key, duration] of frames) {
    if (time < duration) return STAGE_FRAMES[key as FrameKey].sprite;
    time -= duration;
  }
  return piece.image;
}

// These coordinates place the source-native layers about the same 384px arena center.
// Background layers scroll more slowly; runway, shopfronts and dock retain world scale.
function layer(image: string, width: number, height: number, x: number, y: number, ratio: number, order: number, frames?: readonly string[], frameTicks?: number): StagePiece {
  return { image, width, height, x: x + 256 - 448 * (1 - ratio), y, ratio, boat: false, layer: 'Background', order, frames, frameTicks };
}
const STAGE_SETS: readonly (readonly StagePiece[])[] = Object.freeze([
  KEN_PIECES,
  [layer('stages/guile/sky',768,224,0,-48,0.45,0),
   layer('stages/guile/plane',1024,128,-128,48,0.82,10),
   layer('stages/guile/floor',1024,64,-128,176,1,20),
   layer('stages/guile/spectators',1024,128,-128,80,1,30),
   layer('stages/guile/crate',96,80,672,128,1,31)],
  [layer('stages/chun-li/sky',768,240,0,-48,0.45,0),
   layer('stages/chun-li/street',704,208,32,-16,0.95,10),
   layer('stages/chun-li/floor',1040,80,-136,192,1,20)],
  [layer('stages/honda/ceiling',768,48,0,-16,0.9,0),
   layer('stages/honda/wall',864,200,-48,16,0.9,10),
   layer('stages/honda/sun-mural-0',224,104,240,72,0.9,11,['stages/honda/sun-mural-0','stages/honda/sun-mural-1'],48),
   layer('stages/honda/sumo-mural',96,104,464,72,0.9,12),
   layer('stages/honda/bath',336,56,240,152,1,20),
   layer('stages/honda/floor',864,88,-48,176,1,19)],
  [layer('stages/blanka/sky',1024,160,-128,-16,0.4,0),
   layer('stages/blanka/huts-river',768,160,0,16,0.75,10),
   layer('stages/blanka/floor',896,64,-64,176,1,20),
   layer('stages/blanka/tree-hut',480,192,448,24,0.95,21)],
]);
/** Stable slot count: unused slots are hidden on every stage change, including return to Ken. */
export const STAGE_SLOT_COUNT = Math.max(...STAGE_SETS.map((pieces) => pieces.length));
export function stagePieces(stageId: number): readonly StagePiece[] { return STAGE_SETS[stageId] ?? KEN_PIECES; }
/** Compatibility export for existing Ken-specific tooling. */
export const STAGE_PIECES = KEN_PIECES;
