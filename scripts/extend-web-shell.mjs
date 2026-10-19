/** Bundles project browser controls around the unchanged, version-checked engine shell. */
import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
export async function extendWebShell({ project, engineRoot, sdk }) {
  const site = join(project, 'build/web/site');
  let source = readFileSync(join(engineRoot, 'platform/web/player.ts'), 'utf8');
  const replace = (before, after) => { if (!source.includes(before)) throw new Error(`Pinned browser shell changed: missing ${before}`); source = source.replace(before, after); };
  replace("import { InputQueue, bindInput } from './input.ts';", `import { InputQueue, bindInput } from ${JSON.stringify(join(engineRoot, 'platform/web/input.ts'))};\nimport { installControls } from ${JSON.stringify(join(project, 'web/controls.mjs'))};`);
  replace('const queue = new InputQueue();', 'const queue = new InputQueue();\nconst sfControls = installControls(canvas, queue);');
  replace("status.textContent = 'Preparing renderer…';", "status.textContent = 'Preparing arena…';");
  replace('    for (const event of queue.events) {', '    sfControls.poll();\n    for (const event of queue.events) {');
  source = source.replaceAll('document.hidden', 'sfControls.hidden()');
  const visibility = source.match(/document\.addEventListener\('visibilitychange', \(\) => \{[\s\S]*?\n\}\);/);
  if (!visibility) throw new Error('Pinned browser shell visibility handler changed.');
  source += '\n' + visibility[0].replace("'visibilitychange'", "'sf-controls-visibility'") + '\n';
  const { build } = await import(pathToFileURL(resolve(sdk, 'node_modules/esbuild/lib/main.js')).href);
  await build({ stdin: { contents: source, resolveDir: project, sourcefile: 'streetfighter-browser-player.ts', loader: 'ts' }, outfile: join(site, 'player.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022' });
  let html = readFileSync(join(site, 'index.html'), 'utf8');
  const replaceHtml = (before, after) => { if (!html.includes(before)) throw new Error(`Pinned browser launch screen changed: missing ${before}`); html = html.replace(before, after); };
  replaceHtml('<title>Game Engine</title>', '<title>Street Fighter — local & solo playtest</title>');
  replaceHtml('<h1 id="name">Game Engine</h1>', '<h1 id="name">Street Fighter</h1>');
  replaceHtml('>Preparing game…</p>', '>Preparing arena…</p>');
  replaceHtml('>Start game</button>', '>ENTER THE ARENA</button>');
  replaceHtml('</head>', `<style>
      html, body { background: #100e18; color: #fff4d3; }
      #launch { background: radial-gradient(ellipse at 50% 35%, #32202b, #100e18 70%); }
      #name { color: #ffd66b; font-weight: 900; font-style: italic; letter-spacing: .05em; text-transform: uppercase; font-size: clamp(2rem, 7vw, 4rem); margin: 0; text-shadow: 3px 3px #972e37; }
      #status { color: #d4c4aa; line-height: 1.5; }
      #start { background: #dba93e; border: 2px solid #ffe293; color: #211721; border-radius: .15rem; font-weight: 800; letter-spacing: .07em; }
      #start:disabled { background: #4b3b2c; color: #c9b88f; border-color: #796240; cursor: wait; }
      #start:focus-visible { outline: 3px solid #fff4d3; outline-offset: 4px; }
    </style>\n  </head>`);
  writeFileSync(join(site, 'index.html'), html);
  const git = args => { const result = spawnSync('git', args, { cwd: project, encoding: 'utf8' }); if (result.status !== 0) throw new Error(result.stderr); return result.stdout.trim(); };
  writeFileSync(join(site, 'playtest-build.json'), JSON.stringify({ sha: git(['rev-parse', 'HEAD']), dirty: !!git(['status', '--porcelain', '--untracked-files=all']), exportedAt: new Date().toISOString(), shell: 'streetfighter-controls-v1' }, null, 2) + '\n');
  console.log('Browser shell includes recorded controller input, persistent remapping and fullscreen.');
}
