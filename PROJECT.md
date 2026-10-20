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

The UI now follows the original Street Fighter II: Champion Edition artwork and arcade screen
sequence, replacing the earlier Alpha 2-inspired generated artwork. Keep Solo, Local Versus,
Training, pause/help and Options. Character selection supports Ryu and Ken; stage selection
supports Ken, Guile, Chun-Li, E. Honda and Blanka locations using inspected original sheets.
Use dedicated original portraits, logo, HUD and versus artwork. Keep seat controls independent
of fighter identity and preserve deterministic native/web rules. New fighters remain out of scope.
Keyboard, controller and pointer must reach the same menu actions; browser remapping/fullscreen
remain in Options. Deliver original-art title/selection/versus/results and additional stages in
playable verified increments. A full arcade ladder, attract loop and continue flow are later options.

Version 0.3 retains the complete follow-up roadmap: local versus, solo CPU (three difficulties),
and training; guards, crouch/air normals, sweeps, wakeup, throws/tech, three specials, buffered
inputs and first-to-two matches. Fifty-two additional inspected source poses accompany the new
moves. Native and browser use the same deterministic fighting rules; CPU decisions use player
input bits with reaction delays and mistakes, configured in `assets/data/ai.json`.

Training offers five dummy modes, damage/true-combo/input readouts, position reset and exact
collision overlays. Its controls occupy the existing footer. Settings persist audio levels;
browser controls add remapping, fullscreen, stable controller seats and focus/disconnect resets.
Controller browser acceptance uses a virtual W3C device through the real input queue; physical
controller hardware still requires human playtesting. AI has no hidden health/damage advantages.

Controls: P1 WASD + FGH/VBN, R throw; P2 arrows + JKL/UIO, P throw. Hold back to block, down-back
for lows; air attacks are overheads. Hadouken: down/down-forward/forward + punch; dragon punch:
forward/down/down-forward + punch; hurricane: down/down-back/back + kick. Enter / pad A confirms
the focused menu row; arrows / WASD / pad directions select, Escape / pad B goes back.
Escape / pad Start pauses during a fight. Pause returns to the same fight after move help or Options.

Native/web tests, reviewed screen-fit goldens, recorded replay and actual Chrome WebGPU QA gate
delivery. Fresh cooked arena texture residency is 15.77 MB against the 52 MB group budget; the
coverage replay peaks at 15 draws against 30, with zero pipelines created during play and no
GC pauses over 4 ms. A paused
1800-step solo capture on this Mac measured sim p95 0.167 ms, max 0.488 ms and zero hitch steps;
process memory was 154 MB including the desktop engine. These are not phone GPU/frame timings.

`npm run publish:playtest` requires clean exact-commit native/web/browser evidence and deploys
only the cooked browser artifact through GitHub Pages. Run it after merge and fresh verification
on main. Mobile, online play and extra fighters remain outside this desktop/web release.
Keep working notes concise; the user authorized notes needed for autonomous development. Other
engine instructions remain in AGENTS.md.

## Complete game roadmap (authorized)

Deliver the full follow-up roadmap with implementation subagents and supervisor integration:
1. Defense/input: high/low guard, blockstun/pushback/chip and five-frame attack buffer.
2. Moves: crouching/air normals, sweeps, knockdown/wakeup, throws/tech, dragon punch and hurricane.
3. Match: solo/local/training selection, best-of-three, timed intro/KO and match rematches.
4. CPU: deterministic shared-input opponent with three reaction/mistake difficulty levels.
5. Polish: distinct impact/block feedback, restrained shake, audio/settings/remapping/fullscreen, web pads.
6. Finish: training dummy/input/damage/combo/box tools, balance regression scenarios, controller and
   browser checks, stable hosted playtest where supported. No claim of physical hardware testing without it.
Use inspected original poses where available and existing sprites honestly where art is absent. Keep native/web parity, reviewed goldens,
structural/residency budgets and exact-commit PR gates. Each shipped increment must be playable.
