/** Bundles project browser controls around the unchanged, version-checked engine shell. */
import { copyFileSync, readFileSync, writeFileSync } from 'node:fs';
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
  replace("document.querySelector('#name')!.textContent = config.name;", "document.querySelector('#name')!.setAttribute('aria-label', config.name);");
  replace('    for (const event of queue.events) {', '    sfControls.poll();\n    for (const event of queue.events) {');
  source = source.replaceAll('document.hidden', 'sfControls.hidden()');
  const visibility = source.match(/document\.addEventListener\('visibilitychange', \(\) => \{[\s\S]*?\n\}\);/);
  if (!visibility) throw new Error('Pinned browser shell visibility handler changed.');
  source += '\n' + visibility[0].replace("'visibilitychange'", "'sf-controls-visibility'") + '\n';
  const { build } = await import(pathToFileURL(resolve(sdk, 'node_modules/esbuild/lib/main.js')).href);
  await build({ stdin: { contents: source, resolveDir: join(engineRoot, 'platform/web'), sourcefile: 'streetfighter-browser-player.ts', loader: 'ts' }, outfile: join(site, 'player.js'), bundle: true, format: 'esm', platform: 'browser', target: 'es2022' });
  let html = readFileSync(join(site, 'index.html'), 'utf8');
  const replaceHtml = (before, after) => { if (!html.includes(before)) throw new Error(`Pinned browser launch screen changed: missing ${before}`); html = html.replace(before, after); };
  const title = html.match(/<title>[^<]*<\/title>/)?.[0];
  const heading = html.match(/<h1 id="name">[^<]*<\/h1>/)?.[0];
  if (!title || !heading) throw new Error('Pinned browser launch screen changed: missing title or game heading');
  replaceHtml(title, '<title>Street Fighter — local & solo playtest</title>');
  replaceHtml(heading, '<h1 id="name" aria-label="Street Fighter"><img src="./sf-wordmark.png" alt="Street Fighter"></h1>');
  replaceHtml('>Preparing game…</p>', '>Preparing arena…</p>');
  replaceHtml('>Start game</button>', '>ENTER THE ARENA</button>');
  replaceHtml('</head>', `<style>
      @font-face { font-family: SFMenu; src: url('./PixelifySans-Bold.ttf'); }
      html, body { background: #191267; color: #fff3b0; font-family: SFMenu, monospace; }
      #launch { background: #191267 url('./alpha-backdrop.png') center / cover; gap: .75rem; }
      #name { margin: 0; }
      #name img { width: min(780px, 88vw); height: auto; }
      #status { color: #fff3b0; line-height: 1.4; margin: 0 0 1rem; }
      #start { justify-self: center; min-width: 280px; background: #f04b67; border: 0; color: #fff3b0; border-radius: 0; font: 24px SFMenu, monospace; box-shadow: 5px 5px 0 #100b2f; }
      #start:disabled { background: #191267; color: #b1a3e3; cursor: wait; }
      #start:focus-visible { outline: 3px solid #fff3b0; outline-offset: 4px; }
    </style>\n  </head>`);
  writeFileSync(join(site, 'index.html'), html);
  for (const [from, to] of [['assets/ui/alpha-backdrop.png', 'alpha-backdrop.png'], ['assets/ui/street-fighter-wordmark.png', 'sf-wordmark.png'], ['assets/fonts/PixelifySans-Bold.ttf', 'PixelifySans-Bold.ttf'], ['assets/fonts/PixelifySans-OFL.txt', 'PixelifySans-OFL.txt']]) copyFileSync(join(project, from), join(site, to));
  const git = args => { const result = spawnSync('git', args, { cwd: project, encoding: 'utf8' }); if (result.status !== 0) throw new Error(result.stderr); return result.stdout.trim(); };
  writeFileSync(join(site, 'playtest-build.json'), JSON.stringify({ sha: git(['rev-parse', 'HEAD']), dirty: !!git(['status', '--porcelain', '--untracked-files=all']), exportedAt: new Date().toISOString(), shell: 'streetfighter-alpha-ui-v2' }, null, 2) + '\n');
  console.log('Browser shell includes recorded controller input, persistent remapping and fullscreen.');
}
