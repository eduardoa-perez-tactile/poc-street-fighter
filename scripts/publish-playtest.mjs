#!/usr/bin/env node
/** Publish only the exact locally verified browser artifact; GitHub does not build the proprietary engine. */
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { capture, REPOSITORY, snapshot } from './workflow.mjs';
const state = snapshot();
assert.equal(state.dirty, '', 'Commit and verify the finished project before publishing a hosted playtest.');
const build = JSON.parse(readFileSync('build/web/site/playtest-build.json', 'utf8'));
assert.equal(build.sha, state.sha, 'Export belongs to another commit; rerun npm run verify:web and npm run test:browser.');
assert.equal(build.dirty, false, 'Browser build was exported from uncommitted source.');
const native = JSON.parse(readFileSync(`.gameengine/verification/${state.sha}/native.json`, 'utf8'));
const web = JSON.parse(readFileSync(`.gameengine/verification/${state.sha}/web.json`, 'utf8'));
const browser = JSON.parse(readFileSync('build/browser-qa/report.json', 'utf8'));
assert.ok(native.passed && native.cleanAtStart && native.cleanAtEnd, 'Exact clean commit requires passing native verification.');
assert.ok(web.passed && web.cleanAtStart && web.cleanAtEnd, 'Exact clean commit requires passing web verification.');
assert.ok(browser.ok && browser.build?.sha === state.sha && browser.build?.dirty === false, 'Browser QA must pass on this exact clean exported commit.');
assert.ok(existsSync('.github/workflows/playtest.yml'), 'Pages deployment workflow is missing.');
const tag = `playtest-${state.sha.slice(0, 12)}`;
const archive = 'build/playtest-site.tar.gz';
capture('tar', ['-czf', archive, '-C', 'build/web/site', '.']);
// This only enables the repository's standard Pages service; no credentials or engine sources are uploaded.
try { capture('gh', ['api', `repos/${REPOSITORY}/pages`]); }
catch { capture('gh', ['api', '--method', 'POST', `repos/${REPOSITORY}/pages`, '-f', 'build_type=workflow']); }
let exists = false;
try { capture('gh', ['release', 'view', tag, '--repo', REPOSITORY]); exists = true; } catch {}
if (!exists) capture('gh', ['release', 'create', tag, '--repo', REPOSITORY, '--target', state.sha, '--prerelease', '--title', `Street Fighter playtest ${state.sha.slice(0, 7)}`, '--notes', 'Verified native checks, V8/WebAssembly parity and Chrome WebGPU browser acceptance. Download contains the cooked browser game only.']);
capture('gh', ['release', 'upload', tag, archive, '--repo', REPOSITORY, '--clobber']);
capture('gh', ['workflow', 'run', 'playtest.yml', '--repo', REPOSITORY, '-f', `release_tag=${tag}`]);
console.log(`Deployment started for ${tag}. Monitor GitHub Actions; the stable playtest is https://eduardoa-perez-tactile.github.io/poc-street-fighter/ after the deployment succeeds.`);
