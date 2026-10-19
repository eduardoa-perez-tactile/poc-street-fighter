export type Box = readonly [number, number, number, number];
export interface FighterFrame {
  sprite: string;
  rect: readonly [number, number, number, number];
  origin: readonly [number, number];
  push: Box;
  hurt: readonly Box[];
  hit: Box;
}
export interface FighterDefinition {
  name: string;
  frames: Readonly<Record<string, FighterFrame>>;
  animations: Readonly<Record<string, readonly (readonly [string, number])[]>>;
  initialVelocity: { x: Readonly<Record<string, number>>; jump: number };
  gravity: number;
}
