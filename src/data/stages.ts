/** Original stage artwork: scripts/arcade-stage-provenance.json records the audited crops.
 * Stage choice is cosmetic; every location uses the existing combat floor and camera limits.
 * The compact first release preloads these with the shared arena group.
 */
export const STAGES = Object.freeze([
  { id: 0, key: 'ken', name: "KEN'S DOCK", location: 'U.S.A.', preview: 'stages/ken/preview', group: 'arena' },
  { id: 1, key: 'guile', name: "GUILE'S AIRBASE", location: 'U.S.A.', preview: 'stages/guile/preview', group: 'arena' },
  { id: 2, key: 'chun-li', name: "CHUN-LI'S STREET", location: 'CHINA', preview: 'stages/chun-li/preview', group: 'arena' },
  { id: 3, key: 'honda', name: "HONDA'S BATHHOUSE", location: 'JAPAN', preview: 'stages/honda/preview', group: 'arena' },
  { id: 4, key: 'blanka', name: "BLANKA'S RIVERSIDE", location: 'BRAZIL', preview: 'stages/blanka/preview', group: 'arena' },
] as const);
export type StageId = 0 | 1 | 2 | 3 | 4;
export function stageById(id: number) { return STAGES[id] ?? STAGES[0]; }
