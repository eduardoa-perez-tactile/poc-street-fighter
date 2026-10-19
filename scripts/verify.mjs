import { spawn } from 'node:child_process';
import { mkdirSync, openSync, closeSync, writeSync, writeFileSync } from 'node:fs';
import { ENGINE_CONTEXT, NATIVE_CHECKS, WEB_CHECKS, HERMES_CHECKS, REPOSITORY, assertPublishable, capture, snapshot } from './workflow.mjs';

const args = process.argv.slice(2);
const publish = args.includes('--publish');
const web = args.includes('--web');
const hermes = args.includes('--hermes');
if (args.some((arg) => !['--publish', '--web', '--hermes'].includes(arg)) || (web && hermes)) throw new Error('Usage: npm run verify -- [--publish | --web | --hermes]');
if (publish && (web || hermes)) throw new Error('Publish the native gate with npm run pr:verify; cross-runtime verification is an additional delivery gate.');
const before = snapshot();
const directory = `.gameengine/verification/${before.sha}`;
mkdirSync(directory, { recursive: true });
const mode = web ? 'web' : hermes ? 'hermes' : 'native';
const report = { sha: before.sha, cleanAtStart: !before.dirty, mode, started: new Date().toISOString(), passed: false, checks: [] };

function status(state, description) {
  capture('gh', ['api', '--method', 'POST', `repos/${REPOSITORY}/statuses/${before.sha}`,
    '-f', `state=${state}`, '-f', `context=${ENGINE_CONTEXT}`, '-f', `description=${description}`]);
}

function run(label, command, argv, index) {
  console.log(`\n[${index + 1}] ${label}\n$ ${command} ${argv.join(' ')}`);
  const log = `${directory}/${mode}-${index + 1}.log`;
  const fd = openSync(log, 'w');
  return new Promise((resolve, reject) => {
    const child = spawn(command, argv, { stdio: ['ignore', 'pipe', 'pipe'] });
    let spawnError;
    const timeout = setTimeout(() => child.kill('SIGTERM'), 15 * 60 * 1000);
    child.stdout.on('data', (data) => { writeSync(fd, data); process.stdout.write(data); });
    child.stderr.on('data', (data) => { writeSync(fd, data); process.stderr.write(data); });
    child.on('error', (error) => { spawnError = error; });
    child.on('close', (code, signal) => {
      clearTimeout(timeout);
      closeSync(fd);
      report.checks.push({ label, command: [command, ...argv], passed: code === 0, code, signal, log });
      if (spawnError) reject(spawnError);
      else if (code === 0) resolve();
      else reject(new Error(`${label} failed (${signal ?? code}). See ${log}.`));
    });
  });
}

let pending = false;
try {
  if (publish) {
    assertPublishable(before, before);
    // GitHub accepts statuses only for commits it already knows; push the branch first.
    capture('gh', ['api', `repos/${REPOSITORY}/commits/${before.sha}`, '--jq', '.sha']);
    status('pending', 'Running local engine checks for this exact commit');
    pending = true;
  }
  const checks = web ? WEB_CHECKS : hermes ? HERMES_CHECKS : NATIVE_CHECKS;
  for (const [index, [label, command, argv]] of checks.entries()) await run(label, command, argv, index);
  const after = snapshot();
  if (publish) assertPublishable(before, after);
  if (before.sha !== after.sha) throw new Error('HEAD changed during verification; results are stale.');
  report.passed = true;
  report.cleanAtEnd = !after.dirty;
  if (publish) status('success', 'V8 logic/repeatability, types, cook, smoke, render and cooked tests passed');
  console.log(`\n${mode} verification passed for ${before.sha}.${before.dirty ? ' Working tree had uncommitted changes; no status published.' : ''}`);
} catch (error) {
  report.error = error.message;
  report.passed = false;
  if (pending) {
    try { status('failure', 'Local engine verification failed; see local verification logs'); }
    catch (statusError) { console.error(`Could not publish failure: ${statusError.message}`); }
  }
  console.error(error.message);
  process.exitCode = 1;
} finally {
  report.finished = new Date().toISOString();
  writeFileSync(`${directory}/${mode}.json`, `${JSON.stringify(report, null, 2)}\n`);
}
