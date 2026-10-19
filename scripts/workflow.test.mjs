import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { assertMergeable, assertPublishable } from './workflow.mjs';

const clean = { sha: 'abc', dirty: '' };
const pr = () => ({ state: 'OPEN', isDraft: false, baseRefName: 'main', headRefOid: 'abc', statusCheckRollup: [
  { name: 'Repository checks', conclusion: 'SUCCESS' },
  { context: 'engine/local', state: 'SUCCESS' },
] });

test('verification cannot attest a dirty or changed commit', () => {
  assert.doesNotThrow(() => assertPublishable(clean, clean));
  assert.throws(() => assertPublishable({ ...clean, dirty: ' M src/main.ts' }, clean));
  assert.throws(() => assertPublishable(clean, { ...clean, dirty: '?? src/new.ts' }));
  assert.throws(() => assertPublishable(clean, { ...clean, sha: 'def' }));
});

test('merge requires both checks on the exact open, non-draft PR head', () => {
  assert.doesNotThrow(() => assertMergeable(pr(), 'abc'));
  for (const patch of [{ state: 'CLOSED' }, { isDraft: true }, { baseRefName: 'develop' }, { headRefOid: 'old' }]) {
    assert.throws(() => assertMergeable({ ...pr(), ...patch }, 'abc'));
  }
  for (const state of ['FAILURE', 'PENDING', 'ERROR', 'SKIPPED']) {
    const candidate = pr();
    candidate.statusCheckRollup[1].state = state;
    assert.throws(() => assertMergeable(candidate, 'abc'));
  }
  assert.throws(() => assertMergeable({ ...pr(), statusCheckRollup: [] }, 'abc'));
});

test('a duplicate failed check cannot be hidden by another success', () => {
  const candidate = pr();
  candidate.statusCheckRollup.push({ name: 'Repository checks', conclusion: 'FAILURE' });
  assert.throws(() => assertMergeable(candidate, 'abc'));
});

test('the installed push hook blocks main updates/deletions and allows feature pushes', () => {
  const push = (input) => spawnSync('sh', ['.githooks/pre-push'], { input, encoding: 'utf8' });
  assert.equal(push('refs/heads/main abc refs/heads/main def\n').status, 1);
  assert.equal(push('(delete) 000 refs/heads/main def\n').status, 1);
  assert.equal(push('refs/heads/feat/combat abc refs/heads/feat/combat def\n').status, 0);
  assert.equal(push('refs/heads/feat/combat abc refs/heads/feat/combat def\nrefs/heads/main abc refs/heads/main def\n').status, 1);
});
