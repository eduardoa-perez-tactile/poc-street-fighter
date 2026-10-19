import { existsSync, readFileSync } from 'node:fs';
import { capture } from './workflow.mjs';

try {
  const files = capture('git', ['ls-files', '-z']).split('\0').filter(Boolean);
  for (const file of files) {
    if (!existsSync(file)) throw new Error(`Tracked file is missing: ${file}`);
    if (/^(?:\.gameengine|node_modules|build)\//.test(file)) throw new Error(`Generated runtime/build content must not be tracked: ${file}`);
    if (file.endsWith('.json')) JSON.parse(readFileSync(file, 'utf8'));
    if (file.endsWith('.mjs')) capture(process.execPath, ['--check', file]);
  }
  capture('git', ['diff', '--check', 'HEAD']);
  const config = JSON.parse(readFileSync('tsconfig.json', 'utf8'));
  for (const [name, paths] of Object.entries(config.compilerOptions.paths)) {
    if (name.startsWith('@gameengine/') && paths.some((p) => !p.startsWith('./.gameengine/engine/packages/'))) {
      throw new Error(`Non-portable engine path: ${name}. Resolve through .gameengine/engine.`);
    }
  }
  const project = JSON.parse(readFileSync('project.gameengine.json', 'utf8'));
  if (!project.platforms?.includes('desktop') || !project.platforms?.includes('web')) {
    throw new Error('The port must retain desktop and web platform coverage.');
  }
  console.log(`Repository checks passed (${files.length} tracked files). Engine checks run separately on the development machine.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
