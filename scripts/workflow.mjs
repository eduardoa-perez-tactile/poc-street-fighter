import { spawnSync } from 'node:child_process';

export const REPOSITORY = 'eduardoa-perez-tactile/poc-street-fighter';
export const ENGINE_CONTEXT = 'engine/local';
export const REQUIRED_CONTEXTS = ['Repository checks', ENGINE_CONTEXT];

export const NATIVE_CHECKS = [
  ['Repository tooling tests', 'npm', ['test']],
  ['Repository checks', 'npm', ['run', 'check:repo']],
  ['Engine validation, types, cook and smoke', 'gameengine', ['check']],
  ['V8 logic tests and deterministic trace baseline', 'gameengine', ['test', '--tier', 't0', '--js', 'v8', '--hash-trace', '.gameengine/verification-trace']],
  ['Repeat simulation and compare every step to baseline', 'gameengine', ['test', '--tier', 't0', '--js', 'v8', '--hash-trace-baseline', '.gameengine/verification-trace']],
  ['Render tests with low-memory residency', 'gameengine', ['test', '--tier', 't1', '--js', 'v8', '--memory-class', 'phone-low']],
  ['Cooked-content logic tests', 'gameengine', ['test', '--tier', 't0', '--js', 'v8', '--cooked']],
];

// The installed editor ships only a V8 test host. Keep other lanes explicit and fail-closed.
export const HERMES_CHECKS = [
  ['V8/Hermes simulation parity', 'gameengine', ['test', '--tier', 't0', '--js', 'both']],
];

export const WEB_CHECKS = [
  ['Browser-runtime simulation parity', 'gameengine', ['test', '--tier', 't0', '--js', 'v8,web']],
  ['Playable WebGPU probe export', 'gameengine', ['build', 'web', '--config', 'probe', '--out', 'build/web']],
];

export function capture(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024 });
  if (result.error || result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed: ${result.error?.message || result.stderr || result.stdout || `exit ${result.status}`}`);
  }
  return result.stdout.trim();
}

export function snapshot() {
  return {
    sha: capture('git', ['rev-parse', 'HEAD']),
    dirty: capture('git', ['status', '--porcelain', '--untracked-files=all']),
  };
}

export function assertPublishable(before, after) {
  if (before.dirty || after.dirty) throw new Error('Commit all project changes before publishing verification.');
  if (before.sha !== after.sha) throw new Error('HEAD changed during verification; run it again for the new commit.');
}

export function assertMergeable(pr, sha) {
  if (pr.state !== 'OPEN' || pr.isDraft) throw new Error('The PR must be open and ready for review.');
  if (pr.baseRefName !== 'main') throw new Error('The PR must target main.');
  if (pr.headRefOid !== sha) throw new Error('Check out the exact PR head and verify it before merging.');
  const checks = pr.statusCheckRollup ?? [];
  for (const name of REQUIRED_CONTEXTS) {
    const matching = checks.filter((c) => (c.name ?? c.context) === name);
    if (matching.length === 0 || matching.some((c) => (c.conclusion ?? c.state) !== 'SUCCESS')) {
      throw new Error(`Required check is missing or not successful: ${name}`);
    }
  }
}
