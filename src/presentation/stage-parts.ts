import { STAGE_ANIMATIONS, STAGE_FLOOR_STRIPS, STAGE_FRAMES, STAGE_PLACEMENTS } from '../data/stage.ts';

type FrameKey = keyof typeof STAGE_FRAMES;
type AnimationKey = keyof typeof STAGE_ANIMATIONS;
type Placement = { frame?: FrameKey; animation?: AnimationKey; frames?: readonly FrameKey[]; x: number; y: number; cameraDivisor?: number; cameraMultiplier?: number; parent?: 'stage-background' | 'stage-boat'; layer: string };
export interface StagePiece { image: string; x: number; y: number; ratio: number; boat: boolean; width: number; height: number; animation?: AnimationKey; grey?: boolean; strip?: number; layer: string; order: number }
const placements: readonly Placement[] = STAGE_PLACEMENTS;
export const STAGE_PIECES: readonly StagePiece[] = Object.freeze([
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
