import { existsSync } from 'node:fs';
import { capture } from './workflow.mjs';

try {
  // No silent fallback: a usable engine installation is required for the game.
  console.log(capture('gameengine', ['skills', 'update']));
  if (!existsSync('.gameengine/engine/packages/runtime/src/index.ts')) {
    throw new Error('Engine SDK link is missing. Install Tactile Game Engine and rerun npm run setup.');
  }
  capture('git', ['config', '--local', 'core.hooksPath', '.githooks']);
  console.log('Engine SDK linked, skills installed, and direct-main push guard enabled.');
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
