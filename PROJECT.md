# StreetFighter — agent working agreement

## Ownership and scope

The agent implements, tests, self-reviews, opens PRs, fixes checks, and merges passing work.
The user playtests and gives feedback; do not wait for their code review or routine approval.
The user now explicitly requests a supervisor with implementation subagents. Delegate bounded
tracks with file ownership; the supervisor integrates, verifies, reviews and merges. Subagents
do not commit, push or run concurrent engine sessions without coordination.
Ask only when a material product decision cannot be inferred or an external blocker needs the user.

This is a new project, unrelated to the sibling Bubble Bobble project. The engine's starter
game has been replaced.

- Destination: `git@github.com:eduardoa-perez-tactile/poc-street-fighter.git`.
- Reference: `https://github.com/iuritorres/street-fighter-2-javascript`.
- Inspected reference commit: `e1c9d48a24f446972c941d4bc714f760908c76da`.
- Initial target: desktop and WebGPU browser, local Ryu versus Ken on Ken's stage.
- Initial parity: movement, crouch, jumps, six standing attacks, Hadouken, HUD, stage and audio.
- Add explicit KO/timeout/draw and rematch flow. AI, online play, extra fighters and mobile
  touch controls are outside the initial port.

## Git workflow

1. Start from current `main`; use short-lived `feat/*`, `fix/*`, or `chore/*` branches.
2. Deliver one coherent, playable increment per feature PR. Commit small meaningful changes.
3. Run focused checks while iterating. Self-review the full diff, including generated assets.
4. Commit and push the branch. Open a PR to `main` with behavior, validation, limitations,
   and playtest instructions. No human approval is required.
5. Run `npm run pr:verify` on that exact clean commit. It publishes `engine/local` to GitHub.
   Any edit, rebase, or merge from main requires a new commit and new verification.
6. Wait for GitHub's `Repository checks`; resolve all failures and review conversations.
7. Run `npm run pr:merge -- <number>` to squash merge the verified head, delete its remote
   branch, and fast-forward local main. Never use `--admin`, disable checks, force-push main,
   or publish successful engine status by hand. There is no separate `develop` branch.

GitHub main protection requires a PR, current base, both checks, resolved conversations, and
linear history, including for administrators. Bootstrap of the previously empty repository is
the only direct-main commit. `.githooks/pre-push` also blocks direct local main pushes.
Attach every created PR to this chat using the app tool.

## Harness

`npm run setup` links the installed Tactile Game Engine, refreshes engine skills, and enables
the local push guard. Node 22+, `gameengine`, Git, and authenticated `gh` are required. Run `npm ci` for browser QA dependencies.
The engine is machine-installed; do not commit it. TypeScript resolves through its generated
`.gameengine/engine` link so clones are not tied to one absolute installation path.

- `npm test`: workflow guard tests; these are not game tests.
- `npm run check:repo`: portable paths, tracked JSON/script validity, whitespace, and no build/runtime files.
- `npm run verify`: repo checks plus `gameengine check`, V8 logic tests, per-step hash
  repeatability, low-memory T1 render tests and cooked-content T0 tests. Failures stop the gate.
- `npm run pr:verify`: same native checks, but requires a clean pushed commit and publishes
  pending/failure/success for its SHA. Reports and command logs: `.gameengine/verification/<sha>/`.
- `npm run verify:hermes`: additional V8/Hermes parity; required before any mobile release.
- `npm run verify:web`: additional V8/wasm parity and WebGPU probe export to `build/web/site/`.
- `npm run test:browser`: actual Chrome/WebGPU controls, render, pause, resize, audio and tab lifecycle checks.
- `npm run play:web`: serve the built game at `http://localhost:8080`.
  Missing SDK/toolchains are failures, never silently skipped.

GitHub-hosted CI runs repository checks only; it has no proprietary engine installation or GPU.
`engine/local` is a local agent attestation, not a claim that GitHub ran the engine.
The installed editor v0.1.13 ships a V8 host but no Hermes/wasm test hosts or web source toolchain.
For this desktop/web project, the native merge gate explicitly uses V8; this overrides the
engine template's generic `--js both` requirement until a compatible Hermes host is installed.
A matching pinned engine source checkout and scoped Rust/Emscripten toolchain are now built in
ignored local storage. `scripts/web-toolchain.mjs` reads `.gameengine/web-toolchain.json`; it
checks the source tag matches the installed SDK, uses the real wasm host for parity and the
source exporter for WebGPU builds. Missing config is an actionable failure, never a skipped gate.
Web export/parity and real browser QA still gate browser delivery. Never alias V8 as another lane.
Do not substitute repository-tool tests for game validation or claim a skipped test passed.
Do not regenerate goldens automatically to make a failing check green; inspect intended changes.
Before running tests/check/run, ensure the editor is not rebuilding the project's native host.

Before calling a milestone playable: native gate, focused combat tests, inspected screenshots,
web gate, and real browser smoke testing (rendering, keyboard, resizing, audio and
tab lifecycle). Record concrete evidence in the PR. A browser export alone is not browser QA.
For visual/content changes add T1 render tests and record pipeline coverage as the engine requires.
Before shipping, measure the engine's phone-low budgets; desktop timings do not prove device speed.

## Implementation order and acceptance

1. Arena/importer: source crop/pivot data, crisp sprites, stable landscape framing, two local input seats.
2. Movement: mirrored facing, crouch/jump/landing, body pushing and corner constraints.
3. Combat slice: one punch with startup/active/recovery, hit-once damage, knockback and hit-stop.
4. Combat parity: six normals, per-frame head/body/feet hurt boxes, simultaneous-hit rules.
5. Specials/match: facing-relative input history, three projectile speeds, projectile cancellation,
   KO, timeout, draws and reliable rematch reset.
6. Presentation: stage/parallax/floor, spectators, shadows, HUD, sound, browser QA and budgets.

Combat timing is owned by deterministic sim state, not presentation callbacks. Use the same
frame definitions for visible sprites and collision boxes. Pin intentional deviations from the
reference in tests: correct the fast countdown, early-return hurt-box check, and player-order bias.
Track asset provenance when importing; no license file was present in the inspected source tree.

## Working state

The initial port is implemented: source crops, original timeline/boxes, two local keyboard seats,
native gamepad input, combat, projectiles, match flow, HUD, stage, audio and web tooling.
Verified: 44 native checks, 70 V8/wasm cases, 13 real Chrome WebGPU checks, replay, four screen-fit
goldens, release macOS build and WebGPU export. Rendering peaks at 16 draws (budget 30); arena
textures use 7.84 MB under phone-low residency limits. Desktop timings do not prove phone speed.
Browser gamepad support is absent from the current engine shell; physical controllers were not tested.
Controls: P1 WASD + FGH/VBN; P2 arrows + JKL/UIO; Enter starts/rematches, Escape pauses/resumes.
Hadouken: down, down-forward, forward + punch. Mobile builds and AI remain outside scope.
Keep this file concise and update this state as milestones land; the user has authorized the
working notes needed for autonomous development. Other engine instructions remain in AGENTS.md.
