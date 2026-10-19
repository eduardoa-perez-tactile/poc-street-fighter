import { readFileSync } from 'node:fs';
import { REPOSITORY, assertMergeable, capture, snapshot } from './workflow.mjs';

try {
  const local = snapshot();
  if (local.dirty) throw new Error('Commit or remove local changes before merging.');
  const pr = JSON.parse(capture('gh', ['pr', 'view', ...process.argv.slice(2), '--repo', REPOSITORY,
    '--json', 'number,url,state,isDraft,headRefOid,baseRefName,statusCheckRollup']));
  assertMergeable(pr, local.sha);
  const report = JSON.parse(readFileSync(`.gameengine/verification/${local.sha}/native.json`, 'utf8'));
  if (!report.passed || report.sha !== local.sha || !report.cleanAtStart || !report.cleanAtEnd) {
    throw new Error('No passing local verification report for this exact clean commit. Run npm run pr:verify.');
  }
  capture('gh', ['pr', 'merge', String(pr.number), '--repo', REPOSITORY, '--squash', '--delete-branch', '--match-head-commit', local.sha]);
  // Do not let an API response that merely queues auto-merge count as a completed merge.
  const state = capture('gh', ['pr', 'view', String(pr.number), '--repo', REPOSITORY, '--json', 'state', '--jq', '.state']);
  if (state !== 'MERGED') throw new Error(`GitHub has not merged the PR (state: ${state}). Inspect its checks.`);
  capture('git', ['fetch', 'origin', '--prune']);
  capture('git', ['switch', 'main']);
  capture('git', ['pull', '--ff-only', 'origin', 'main']);
  console.log(`Merged ${pr.url}; local main is up to date.`);
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
